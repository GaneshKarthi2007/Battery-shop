<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::with('assignedStaff')->latest()->get());
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
        ]);

        if (isset($validated['assigned_to']) && $validated['assigned_to']) {
            $validated['assigned_at'] = now();
            $validated['status'] = 'In Progress';
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
        return response()->json($service->load(['assignedStaff', 'sale']));
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
        ]);

        if (isset($validated['status']) && $validated['status'] === 'Completed' && $service->status !== 'Completed') {
            $validated['resolved_at'] = now();
        }

        $oldAssignedTo = $service->assigned_to;
        $service->update($validated);

        if ($service->assigned_to && $service->assigned_to != $oldAssignedTo) {
            $service->update(['assigned_at' => now(), 'status' => 'In Progress']);
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
            'status' => 'In Progress'
        ]);

        return response()->json($service->load('assignedStaff'));
    }

    public function uploadVoiceNote(Request $request, Service $service)
    {
        $request->validate([
            'voice_note' => 'required|file|mimes:audio/mpeg,mp3,wav,ogg,m4a,webm',
        ]);

        if ($request->hasFile('voice_note')) {
            $path = $request->file('voice_note')->store('voice_notes', 'public');
            $service->update(['voice_note' => $path]);
            
            // Notify Admin
            \App\Models\Notification::create([
                'user_id' => 1, // Assuming ID 1 is the main admin
                'type' => 'SERVICE',
                'title' => 'New Voice Feedback',
                'message' => "Service person left a voice note for service #{$service->id} ({$service->customer_name}).",
            ]);

            return response()->json(['path' => $path]);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function verifyPayment(Request $request, Service $service)
    {
        $service->update([
            'payment_status' => 'verified',
            'payment_confirmed_at' => now(),
            'status' => 'Completed'
        ]);

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(null, 204);
    }
}
