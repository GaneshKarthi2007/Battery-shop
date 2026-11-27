<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public static function notifyAdmins(string $type, string $title, string $message): void
    {
        $admins = User::where('role', 'admin')->get(['id']);
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
            ]);
        }
    }

    public static function notifyAllStaff(string $type, string $title, string $message): void
    {
        $staffMembers = User::where('role', 'staff')->get(['id']);
        foreach ($staffMembers as $staff) {
            Notification::create([
                'user_id' => $staff->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
            ]);
        }
    }

    public static function notifyUser(int $userId, string $type, string $title, string $message): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
        ]);
    }
}
