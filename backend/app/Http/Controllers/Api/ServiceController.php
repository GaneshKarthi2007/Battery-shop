<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceProcessFlow;
use App\Services\MediaStorage;
use App\Services\NotificationService;
use App\Support\InputNormalizer;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function nextLogId()
    {
        return response()->json([
            'next_log_id' => Service::getNextLogId(),
        ]);
    }

    public function index(Request $request)
    {
        $query = Service::with(['assignedStaff', 'sales', 'processFlows', 'processFlows.staff'])->latest();

        if ($request->has('search')) {
            $search = trim($request->query('search'));
            $query->where(function($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('service_code', $search)
                  ->orWhere('customer_code', $search);

                if (strlen($search) >= 3) {
                    $q->orWhere('contact_number', 'like', "%{$search}%");
                } elseif ($search !== '') {
                    $q->orWhere('contact_number', $search);
                }

                $digits = preg_replace('/\D/', '', $search);
                if ($digits !== '') {
                    $intId = (int)$digits;
                    $q->orWhere('id', $intId)
                      ->orWhere('service_code', (string)$intId)
                      ->orWhere('service_code', 'SRV-' . str_pad($intId, 5, '0', STR_PAD_LEFT));
                }
            });
        }

        if ($request->query('available') == 1) {
            $query->where('status', 'Pending')
                  ->whereNull('assigned_to');
        }

        return response()->json($query->get());
    }

    public function markAsConverted(Request $request, Service $service)
    {
        // Prevent duplicate conversion if already in requested status
        if ($service->status === 'Converted to Order') {
            return response()->json([
                'message' => 'This service already has an active conversion request. Please wait for the admin to process.'
            ], 400);
        }

        $service->update([
            'status' => 'Converted to Order',
            'status_updated_at' => now()
        ]);

        // Notify Admins
        NotificationService::notifyAdmins(
            'SERVICE',
            'Conversion Requested',
            "Staff requested to convert Service #{$service->id} ({$service->customer_name}) to a new order replacement."
        );

        return response()->json($service->load('assignedStaff'));
    }

    public function processConvertedOrder(Request $request, Service $service)
    {
        if ($service->status !== 'Converted to Order') {
            return response()->json(['message' => 'Service must be marked as converted first'], 400);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $product, $validated, $request) {
            // 1. Deduct stock (allows billing even if stock is 0 or less)
            $product->decrement('stock', $validated['quantity']);
            $product->update([
                'stock_status' => $product->stock <= 0 ? 'out_of_stock' : ($product->stock <= $product->min_stock ? 'low_stock' : 'in_stock')
            ]);

            // 2. Update service with new battery specs implicitly
            $service->update([
                'battery_brand' => $product->brand,
                'battery_model' => $product->model,
                'battery_capacity' => $product->ah,
                'status' => 'Completed',
                'status_updated_at' => now(),
                'resolved_at' => now(),
                'payment_status' => 'verified',
                'payment_confirmed_at' => now(),
                'billed_at' => now()
            ]);

            // 3. Create Receipt for staff reference
            $receipt = \App\Models\Receipt::create([
                'service_id' => $service->id,
                'product_id' => $product->id,
                'receipt_number' => 'RCP-' . strtoupper(uniqid()),
                'quantity' => $validated['quantity'],
                'price' => $product->price,
                'total' => $product->price * $validated['quantity'],
                'status' => 'paid',
                'generated_by' => $request->user()?->id,
            ]);

            // 4. Create Sale Record for the automated Customer Bill
            $totalAmount = ($service->service_charge ?: 0) + $receipt->total;

            $sale = \App\Models\Sale::create([
                'customer_name' => $service->customer_name,
                'customer_phone' => $service->contact_number,
                'vehicle_details' => $service->vehicle_details,
                'installation_address' => $service->address,
                'product_category' => 'Service',
                'total_amount' => $totalAmount,
                'type' => 'Service',
                'extra_charges' => 0,
                'discount_amount' => 0,
                'payment_method' => 'Cash', // Based on UI default
            ]);

            // Add Service Charge Item if present
            if ($service->service_charge > 0) {
                $sale->items()->create([
                    'service_id' => $service->id,
                    'quantity' => 1,
                    'price' => $service->service_charge,
                ]);
            }

            // Add Product Item
            $sale->items()->create([
                'product_id' => $receipt->product_id,
                'quantity' => $receipt->quantity,
                'price' => $receipt->total, // Total for the line item
            ]);

            return response()->json($service->load(['sale', 'receipt', 'receipt.product']));
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string',
            'contact_number' => 'required|string',
            'vehicle_details' => 'nullable|string',
            'status' => 'sometimes|string',
            'service_charge' => 'sometimes|numeric',
            'battery_brand' => 'nullable|string',
            'battery_model' => 'nullable|string',
            'battery_capacity' => 'nullable|string',
            'address' => 'nullable|string',
            'complaint_type' => 'nullable|string',
            'complaint_details' => 'nullable|string',
            'pickup_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'sub_status' => 'nullable|string',
            'service_code' => 'nullable|string',
            'log_id' => 'nullable|string',
            'customer_code' => 'nullable|string',
            'customer_log_id' => 'nullable|string',
            'allow_auto_id' => 'sometimes|boolean',
        ]);

        $normalizedPhone = InputNormalizer::normalizeMobile10($validated['contact_number']);
        if ($normalizedPhone === null) {
            return response()->json(['message' => 'Contact number must be a valid 10-digit mobile number.'], 422);
        }
        $validated['contact_number'] = $normalizedPhone;

        $validated['customer_name'] = !empty($validated['customer_name'])
            ? (InputNormalizer::capitalizeWords($validated['customer_name']) ?? 'Customer')
            : 'Customer';

        $validated['vehicle_details'] = !empty($validated['vehicle_details'])
            ? (InputNormalizer::capitalizeFirst($validated['vehicle_details']) ?? 'N/A')
            : 'N/A';

        if (!empty($validated['address'])) {
            $validated['address'] = InputNormalizer::capitalizeFirst($validated['address']);
        }
        if (!empty($validated['complaint_type'])) {
            $validated['complaint_type'] = InputNormalizer::capitalizeWords($validated['complaint_type']);
        }
        if (!empty($validated['complaint_details'])) {
            $validated['complaint_details'] = InputNormalizer::capitalizeFirst($validated['complaint_details']);
        }

        // Handle manual or sequential Service Log ID
        $manualServiceLogId = $request->input('log_id') ?? $request->input('service_code');
        $allowAutoId = $request->boolean('allow_auto_id', true);

        if (!empty($manualServiceLogId)) {
            $cleanServiceId = preg_replace('/\D/', '', (string)$manualServiceLogId);
            if ($cleanServiceId === '') {
                return response()->json(['message' => 'Service Log ID must be an integer.'], 422);
            }
            $cleanServiceId = (string)(int)$cleanServiceId;
            if (Service::where('service_code', $cleanServiceId)->orWhere('id', (int)$cleanServiceId)->exists()) {
                return response()->json(['message' => "Service Log ID #{$cleanServiceId} is already in use."], 422);
            }
            $validated['service_code'] = $cleanServiceId;
        } elseif (!$allowAutoId) {
            return response()->json(['message' => 'Service Log ID is required because auto-generation permission is not enabled by developer.'], 422);
        } else {
            $validated['service_code'] = (string) Service::getNextLogId();
        }

        // Handle manual Customer Log ID if provided
        $manualCustomerLogId = $request->input('customer_log_id') ?? $request->input('customer_code');
        if (!empty($manualCustomerLogId)) {
            $cleanCustId = preg_replace('/\D/', '', (string)$manualCustomerLogId);
            if ($cleanCustId !== '') {
                $cleanCustId = (string)(int)$cleanCustId;
                $customer = \App\Models\Customer::ensureCustomer(
                    $validated['customer_name'] ?? null,
                    $validated['contact_number'] ?? null,
                    $validated['vehicle_details'] ?? null,
                    $validated['address'] ?? null,
                    $cleanCustId
                );
                if ($customer) {
                    $validated['customer_code'] = $customer->customer_code;
                }
            }
        }

        if (isset($validated['assigned_to']) && $validated['assigned_to']) {
            $validated['assigned_at'] = now();
            $validated['status'] = 'In Progress';
        }

        // Deduplication Logic
        $duplicate = Service::where('contact_number', $validated['contact_number'])
            ->where('customer_name', $validated['customer_name'])
            ->where('complaint_type', $validated['complaint_type'] ?? null)
            ->where('status', 'Pending')
            ->where('created_at', '>=', now()->subMinutes(5))
            ->first();

        if ($duplicate) {
            return response()->json($duplicate->load('assignedStaff'), 200);
        }

        unset($validated['log_id'], $validated['customer_log_id'], $validated['allow_auto_id']);

        $service = Service::create($validated);

        if ($service->assigned_to) {
            NotificationService::notifyUser(
                $service->assigned_to,
                'SERVICE',
                'New Job Assigned',
                "You have been assigned to a new service for {$service->customer_name}."
            );
        } elseif ($request->user() && in_array($request->user()->role, ['admin', 'manager'])) {
            NotificationService::notifyAllStaff(
                'SERVICE',
                'New Service Registered',
                "New job Service #{$service->id} ({$service->customer_name}) is available for pickup."
            );
        }

        return response()->json($service->load('assignedStaff'), 201);
    }

    public function show(Service $service)
    {
        return response()->json($service->load(['assignedStaff', 'sale', 'sales', 'sales.items.product', 'receipt', 'receipt.product', 'processFlows', 'processFlows.staff']));
    }

    public function update(Request $request, Service $service)
    {
        $user = $request->user();

        // Rule 1: Once assigned to a staff member, assigned_to cannot be changed
        if ($request->has('assigned_to') && $service->assigned_to && (int)$request->input('assigned_to') !== (int)$service->assigned_to) {
            return response()->json(['message' => 'Assigned staff cannot be changed once assigned to a job.'], 400);
        }

        // Rule 2: Staff restrictions on completed/converted jobs and status transitions
        if ($user && !in_array($user->role, ['admin', 'manager'])) {
            if (in_array($service->status, ['Completed', 'Converted to Order'])) {
                return response()->json(['message' => 'Completed jobs cannot be modified by staff.'], 403);
            }

            if ($request->has('status')) {
                $newStatus = $request->input('status');
                $allowedTransitions = [
                    'Pending' => ['Pending', 'In Progress', 'Completed', 'Converted to Order'],
                    'In Progress' => ['In Progress', 'Completed', 'Converted to Order'],
                    'Completed' => ['Completed'],
                    'Converted to Order' => ['Converted to Order'],
                ];
                $allowed = $allowedTransitions[$service->status] ?? [];
                if (!in_array($newStatus, $allowed)) {
                    return response()->json(['message' => 'Cannot revert job status to a previous state.'], 400);
                }
            }
        }

        $validated = $request->validate([
            'customer_name' => 'sometimes|string',
            'contact_number' => 'sometimes|string',
            'vehicle_details' => 'sometimes|string',
            'status' => 'sometimes|string',
            'service_charge' => 'sometimes|numeric',
            'payment_method' => 'nullable|string',
            'battery_brand' => 'nullable|string',
            'battery_model' => 'nullable|string',
            'battery_capacity' => 'nullable|string',
            'address' => 'nullable|string',
            'complaint_type' => 'nullable|string',
            'complaint_details' => 'nullable|string',
            'pickup_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'voice_note' => 'nullable|string', // Could be a file path from frontend
            'payment_status' => 'sometimes|string',
            'sub_status' => 'nullable|string',
        ]);

        if (isset($validated['contact_number'])) {
            $normalizedPhone = InputNormalizer::normalizeMobile10($validated['contact_number']);
            if ($normalizedPhone === null) {
                return response()->json(['message' => 'Contact number must be a valid 10-digit mobile number.'], 422);
            }
            $validated['contact_number'] = $normalizedPhone;
        }
        if (isset($validated['customer_name'])) {
            $validated['customer_name'] = InputNormalizer::capitalizeWords($validated['customer_name']);
        }
        if (isset($validated['address'])) {
            $validated['address'] = InputNormalizer::capitalizeFirst($validated['address']);
        }
        if (isset($validated['complaint_details'])) {
            $validated['complaint_details'] = InputNormalizer::capitalizeFirst($validated['complaint_details']);
        }
        if (isset($validated['sub_status'])) {
            $validated['sub_status'] = InputNormalizer::capitalizeFirst($validated['sub_status']);
        }

        if (isset($validated['payment_method'])) {
            $validated['payment_method'] = in_array(strtoupper($validated['payment_method']), ['UPI', 'CASH']) 
                ? ucfirst(strtolower($validated['payment_method'])) 
                : 'Cash';
        }

        $oldStatus = $service->status;
        $oldSubStatus = $service->sub_status;
        $oldPaymentStatus = $service->payment_status;
        $oldCharge = $service->service_charge;

        if ((isset($validated['status']) && $validated['status'] !== $service->status) || 
            (isset($validated['sub_status']) && $validated['sub_status'] !== $service->sub_status)) {
            $validated['status_updated_at'] = now();
        }

        if (isset($validated['status']) && $validated['status'] === 'Completed' && $service->status !== 'Completed') {
            $validated['resolved_at'] = now();
            if (!isset($validated['payment_status'])) {
                $validated['payment_status'] = 'verified';
                $validated['payment_confirmed_at'] = now();
                $validated['billed_at'] = now();
            }
        }

        $formattedNotes = $request->filled('notes') ? InputNormalizer::capitalizeFirst($request->input('notes')) : null;
        if (isset($validated['sub_status']) && $validated['sub_status'] !== $service->sub_status) {
            ServiceProcessFlow::create([
                'service_id' => $service->id,
                'sub_status' => $validated['sub_status'],
                'staff_id' => $user?->id,
                'notes' => $formattedNotes,
            ]);
        }

        $oldAssignedTo = $service->assigned_to;
        $service->update($validated);

        if ($service->assigned_to && $service->assigned_to != $oldAssignedTo) {
            $service->update(['assigned_at' => now(), 'status' => 'In Progress']);

            // Create initial process flow for pickup
            ServiceProcessFlow::create([
                'service_id' => $service->id,
                'sub_status' => 'Task Picked Up / Commenced',
                'staff_id' => $service->assigned_to,
            ]);

            NotificationService::notifyUser(
                $service->assigned_to,
                'SERVICE',
                'New Job Assigned',
                "You have been assigned to service #{$service->id} for {$service->customer_name}."
            );
        } elseif ($user && $user->role === 'staff') {
            if ($oldStatus !== 'Completed' && $service->status === 'Completed') {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'Service Completed',
                    "Staff {$user->name} completed Service #{$service->id} ({$service->customer_name})."
                );
            } elseif (($service->payment_status === 'verified' && $oldPaymentStatus !== 'verified')
                || ($request->has('service_charge') && (float)$service->service_charge !== (float)$oldCharge)) {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'Payment Recorded',
                    "Staff {$user->name} recorded ₹{$service->service_charge} ({$service->payment_method}) for Service #{$service->id} ({$service->customer_name})."
                );
            } elseif (isset($validated['sub_status']) && $validated['sub_status'] !== $oldSubStatus) {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'Progress Updated',
                    "Staff {$user->name} updated Service #{$service->id} ({$service->customer_name}) to {$service->sub_status}."
                );
            } elseif ($formattedNotes) {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'Staff Note Added',
                    "Staff {$user->name} added a note on Service #{$service->id} ({$service->customer_name}): {$formattedNotes}."
                );
            }
        }

        return response()->json($service->load(['assignedStaff', 'sale']));
    }

    public function pickUp(Request $request, Service $service)
    {
        $user = $request->user();

        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $user) {
            $lockedService = Service::where('id', $service->id)->lockForUpdate()->first();

            if (!$lockedService) {
                return response()->json(['message' => 'Service not found'], 404);
            }

            if ($lockedService->assigned_to) {
                return response()->json(['message' => 'This complaint has already been accepted by another staff member.'], 400);
            }

            if (in_array(strtolower($lockedService->status), ['completed', 'cancelled', 'closed'])) {
                return response()->json(['message' => 'Cannot accept a closed or cancelled complaint.'], 400);
            }

            $lockedService->update([
                'assigned_to' => $user->id,
                'assigned_at' => now(),
                'status' => 'In Progress',
                'status_updated_at' => now()
            ]);

            ServiceProcessFlow::create([
                'service_id' => $lockedService->id,
                'sub_status' => 'Task Picked Up / Commenced',
                'staff_id' => $user->id,
            ]);

            NotificationService::notifyAdmins(
                'SERVICE',
                'Job Picked Up',
                "Staff {$user->name} accepted Service #{$lockedService->id} ({$lockedService->customer_name})."
            );

            return response()->json($lockedService->load('assignedStaff'));
        });
    }

    public function uploadVoiceNote(Request $request, Service $service, MediaStorage $media)
    {
        $request->validate([
            'voice_note' => 'required|file|max:20480',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('voice_note')) {
            $path = $media->store($request->file('voice_note'), 'voice_notes');
            $user = $request->user();
            $notes = $request->input('notes');

            // Logic to decide where to attach the voice note
            // If it's the initial stage (Pending & not assigned) or if forced to service level
            if ($service->status === 'Pending' && !$service->assigned_to) {
                $service->update([
                    'voice_note' => $path,
                    'complaint_details' => $notes ? ($service->complaint_details . "\n\nNote: " . $notes) : $service->complaint_details
                ]);
            } else {
                // Try to find the latest process flow entry for this staff member
                $latestFlow = $service->processFlows()
                    ->where('staff_id', $user->id)
                    ->latest()
                    ->first();

                if ($latestFlow) {
                    $latestFlow->update([
                        'voice_note' => $path,
                        'notes' => $notes ?: $latestFlow->notes
                    ]);
                } else {
                    // Fallback to service level if no flow exists yet
                    $service->update([
                        'voice_note' => $path,
                        // If it's a general staff update without a flow, we just update the voice note
                    ]);
                    
                    if ($notes) {
                        // Create a new process flow entry if notes are provided but no flow exists
                        ServiceProcessFlow::create([
                            'service_id' => $service->id,
                            'sub_status' => 'Staff Update',
                            'staff_id' => $user->id,
                            'notes' => $notes,
                            'voice_note' => $path
                        ]);
                    }
                }
            }
            
            // Notify all Admins
            if ($user && $user->role === 'staff') {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'New Voice Feedback',
                    "Staff {$user->name} recorded a voice note for Service #{$service->id} ({$service->customer_name})."
                );
            } else {
                NotificationService::notifyAdmins(
                    'SERVICE',
                    'New Voice Feedback',
                    "Voice note recorded for Service #{$service->id} ({$service->customer_name})."
                );
            }

            return response()->json($service->load(['assignedStaff', 'sale', 'receipt', 'receipt.product', 'processFlows', 'processFlows.staff']));
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function verifyPayment(Request $request, Service $service)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $request) {
            if ($request->has('service_charge')) {
                $service->update(['service_charge' => $request->input('service_charge')]);
            }

            $paymentMethod = $request->input('payment_method', 'Cash');
            if (in_array(strtoupper($paymentMethod), ['UPI', 'CASH'])) {
                $paymentMethod = ucfirst(strtolower($paymentMethod));
            } else {
                $paymentMethod = 'Cash';
            }

            $service->update([
                'payment_method' => $paymentMethod,
                'payment_status' => 'verified',
                'payment_confirmed_at' => now(),
                'status' => 'Completed',
                'status_updated_at' => now(),
                'billed_at' => now()
            ]);

            // Check if there is an associated receipt to include in the sale
            $receipt = $service->receipt;
            $totalAmount = $service->service_charge;
            if ($receipt) {
                $totalAmount += $receipt->total;
                $receipt->update(['status' => 'paid']);
            }

            // Check if a sale is already linked to this service via sale items
            $hasExistingSale = \App\Models\SaleItem::where('service_id', $service->id)->exists();

            if (!$hasExistingSale) {
                // Auto-generate a sale record for the reports
                $sale = \App\Models\Sale::create([
                    'customer_name' => $service->customer_name,
                    'customer_phone' => $service->contact_number,
                    'vehicle_details' => $service->vehicle_details,
                    'installation_address' => $service->address,
                    'product_category' => 'Service',
                    'total_amount' => $totalAmount,
                    'type' => 'Service',
                    'extra_charges' => 0,
                    'discount_amount' => 0,
                    'payment_method' => $paymentMethod,
                ]);

                $sale->items()->create([
                    'service_id' => $service->id,
                    'quantity' => 1,
                    'price' => $service->service_charge,
                ]);

                if ($receipt && $receipt->product_id) {
                    $sale->items()->create([
                        'product_id' => $receipt->product_id,
                        'quantity' => $receipt->quantity,
                        'price' => $receipt->total, // price here usually refers to total for the item, or price per unit. The DB for SaleItem uses 'price' as total line price in this logic. 
                    ]);
                }
            } else {
                // If a sale already exists, find it and optionally update its total and add the service charge item
                $saleItem = \App\Models\SaleItem::where('service_id', $service->id)->first();
                if ($saleItem) {
                    $sale = $saleItem->sale;
                    if ($sale && $service->service_charge > 0) {
                        $sale->increment('total_amount', $service->service_charge);
                        $sale->items()->create([
                            'service_id' => $service->id,
                            'quantity' => 1,
                            'price' => $service->service_charge,
                        ]);
                    }
                }
            }

            return response()->json($service->load('sale'));
        });
    }

    public function revisit(Request $request, Service $service)
    {
        if ($service->status !== 'Completed') {
            return response()->json(['message' => 'Only completed services can be revisited.'], 400);
        }

        $validated = $request->validate([
            'issue' => 'nullable|string',
            'complaint_type' => 'nullable|string',
            'complaint_details' => 'nullable|string',
        ]);

        $newService = Service::create([
            'customer_name' => $service->customer_name,
            'contact_number' => $service->contact_number,
            'vehicle_details' => $service->vehicle_details,
            'address' => $service->address,
            'status' => 'Pending',
            'parent_id' => $service->id,
            'complaint_type' => InputNormalizer::capitalizeWords($validated['complaint_type'] ?? null),
            'complaint_details' => InputNormalizer::capitalizeFirst($validated['complaint_details'] ?? null),
            'issue' => InputNormalizer::capitalizeFirst($validated['issue'] ?? null),
        ]);

        if ($request->user() && in_array($request->user()->role, ['admin', 'manager'])) {
            NotificationService::notifyAllStaff(
                'SERVICE',
                'New Revisit Job Registered',
                "Admin registered revisit Service #{$newService->id} ({$newService->customer_name}). Available for pickup."
            );
        }

        return response()->json($newService, 201);
    }

    public function generateReceipt(Request $request, Service $service)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $product, $validated, $request) {
            // Deduct stock (allows billing even if stock is 0 or less)
            $product->decrement('stock', $validated['quantity']);
            $product->update([
                'stock_status' => $product->stock <= 0 ? 'out_of_stock' : ($product->stock <= $product->min_stock ? 'low_stock' : 'in_stock')
            ]);

            // Update service with the new battery specs implicitly
            $service->update([
                'battery_brand' => $product->brand,
                'battery_model' => $product->model,
                'battery_capacity' => $product->ah,
            ]);

            // Create receipt
            $receipt = \App\Models\Receipt::create([
                'service_id' => $service->id,
                'product_id' => $product->id,
                'receipt_number' => 'RCP-' . strtoupper(uniqid()),
                'quantity' => $validated['quantity'],
                'price' => $product->price,
                'total' => $product->price * $validated['quantity'],
                'status' => 'pending_payment',
                'generated_by' => $request->user()?->id,
            ]);

            return response()->json($receipt->load(['service', 'product', 'generator']), 201);
        });
    }

    public function deleteProcessFlow(\App\Models\ServiceProcessFlow $flow, MediaStorage $media)
    {
        $user = auth()->user();
        
        // Only the staff who created it or an admin can delete it
        if ($user->role !== 'admin' && $flow->staff_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $media->delete($flow->voice_note);

        $flow->delete();

        return response()->json(['message' => 'Update deleted successfully']);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(null, 204);
    }
}
