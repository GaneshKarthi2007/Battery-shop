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
            'vehicle_details' => 'required|string',
            'status' => 'sometimes|string',
            'service_charge' => 'sometimes|numeric',
            'battery_brand' => 'nullable|string',
            'battery_model' => 'nullable|string',
            'pickup_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

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
        return response()->json($service->load('assignedStaff'));
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
            'pickup_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $oldAssignedTo = $service->assigned_to;
        $service->update($validated);

        if ($service->assigned_to && $service->assigned_to != $oldAssignedTo) {
            \App\Models\Notification::create([
                'user_id' => $service->assigned_to,
                'type' => 'SERVICE',
                'title' => 'New Job Assigned',
                'message' => "You have been assigned to service #{$service->id} for {$service->customer_name}.",
            ]);
        }

        return response()->json($service->load('assignedStaff'));
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(null, 204);
    }
}
