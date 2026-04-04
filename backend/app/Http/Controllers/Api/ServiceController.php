<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceProcessFlow;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::with(['assignedStaff', 'processFlows', 'processFlows.staff'])->latest()->get());
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
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'SERVICE',
                'title' => 'Conversion Requested',
                'message' => "Staff requested to convert Service #{$service->id} ({$service->customer_name}) to a new order replacement.",
            ]);
        }

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
        
        if ($product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock for this product.'], 400);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $product, $validated, $request) {
            // 1. Deduct stock
            $product->decrement('stock', $validated['quantity']);

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
            'customer_name' => 'required|string',
            'contact_number' => 'required|string',
            'vehicle_details' => 'sometimes|string',
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
        ]);

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

        $service = Service::create($validated);

        if ($service->assigned_to) {
            \App\Models\Notification::create([
                'user_id' => $service->assigned_to,
                'type' => 'SERVICE',
                'title' => 'New Job Assigned',
                'message' => "You have been assigned to a new service for {$service->customer_name}.",
            ]);
        }

        return response()->json($service->load('assignedStaff'), 201);
    }

    public function show(Service $service)
    {
        return response()->json($service->load(['assignedStaff', 'sale', 'sales', 'sales.items.product', 'receipt', 'receipt.product', 'processFlows', 'processFlows.staff']));
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'customer_name' => 'sometimes|string',
            'contact_number' => 'sometimes|string',
            'vehicle_details' => 'sometimes|string',
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
            'voice_note' => 'nullable|string', // Could be a file path from frontend
            'payment_status' => 'sometimes|string',
            'sub_status' => 'nullable|string',
        ]);

        if ((isset($validated['status']) && $validated['status'] !== $service->status) || 
            (isset($validated['sub_status']) && $validated['sub_status'] !== $service->sub_status)) {
            $validated['status_updated_at'] = now();
        }

        if (isset($validated['status']) && $validated['status'] === 'Completed' && $service->status !== 'Completed') {
            $validated['resolved_at'] = now();
        }

        if (isset($validated['sub_status']) && $validated['sub_status'] !== $service->sub_status) {
            ServiceProcessFlow::create([
                'service_id' => $service->id,
                'sub_status' => $validated['sub_status'],
                'staff_id' => $request->user()?->id,
                'notes' => $request->input('notes') // Optional notes if provided
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

            \App\Models\Notification::create([
                'user_id' => $service->assigned_to,
                'type' => 'SERVICE',
                'title' => 'New Job Assigned',
                'message' => "You have been assigned to service #{$service->id} for {$service->customer_name}.",
            ]);
        }

        return response()->json($service->load(['assignedStaff', 'sale']));
    }

    public function pickUp(Request $request, Service $service)
    {
        $user = $request->user();
        if ($service->assigned_to) {
            return response()->json(['message' => 'Task already assigned'], 400);
        }

        $service->update([
            'assigned_to' => $user->id,
            'assigned_at' => now(),
            'status' => 'In Progress',
            'status_updated_at' => now()
        ]);

        ServiceProcessFlow::create([
            'service_id' => $service->id,
            'sub_status' => 'Task Picked Up / Commenced',
            'staff_id' => $user->id,
        ]);

        return response()->json($service->load('assignedStaff'));
    }

    public function uploadVoiceNote(Request $request, Service $service)
    {
        $request->validate([
            'voice_note' => 'required|file|mimes:audio/mpeg,mp3,wav,ogg,m4a,webm,application/octet-stream',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('voice_note')) {
            $path = $request->file('voice_note')->store('voice_notes', 'public');
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
            
            // Notify Admin
            \App\Models\Notification::create([
                'user_id' => 1, // Assuming ID 1 is the main admin
                'type' => 'SERVICE',
                'title' => 'New Voice Feedback',
                'message' => "Voice note recorded for service #{$service->id} ({$service->customer_name}).",
            ]);

            return response()->json($service->load(['assignedStaff', 'sale', 'receipt', 'receipt.product', 'processFlows', 'processFlows.staff']));
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function verifyPayment(Request $request, Service $service)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($service) {
            $service->update([
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
                'payment_method' => 'Cash', // Defaulting to Cash as per UI flow
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
            'status' => 'pending',
            'parent_id' => $service->id,
            'complaint_type' => $validated['complaint_type'] ?? null,
            'complaint_details' => $validated['complaint_details'] ?? null,
            'issue' => $validated['issue'] ?? null,
        ]);

        return response()->json($newService, 201);
    }

    public function generateReceipt(Request $request, Service $service)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);
        
        if ($product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock for this product.'], 400);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($service, $product, $validated, $request) {
            // Deduct stock
            $product->decrement('stock', $validated['quantity']);

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

    public function deleteProcessFlow(\App\Models\ServiceProcessFlow $flow)
    {
        $user = auth()->user();
        
        // Only the staff who created it or an admin can delete it
        if ($user->role !== 'admin' && $flow->staff_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($flow->voice_note) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($flow->voice_note);
        }

        $flow->delete();

        return response()->json(['message' => 'Update deleted successfully']);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(null, 204);
    }
}
