<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->notifications()->latest()->limit(20)->get()
        );
    }

    public function markAsRead(Notification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->notifications()->update(['is_read' => true]);
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
