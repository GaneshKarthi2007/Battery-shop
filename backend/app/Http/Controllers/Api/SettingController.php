<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /** Any authenticated user can read shop settings (needed to render prefixes etc.). */
    public function index(Request $request)
    {
        return response()->json(Setting::all_as_array());
    }

    /** Only admin and developer can change shop settings. */
    public function update(Request $request)
    {
        $role = $request->user()->role ?? '';
        if (! in_array($role, ['admin', 'developer'])) {
            return response()->json(['message' => 'Unauthorized. Only admins and developers can change settings.'], 403);
        }

        $validated = $request->validate([
            Setting::SERVICE_LOG_ID_PREFIX => [
                'sometimes', 'nullable', 'string',
                'max:'.Setting::PREFIX_MAX_LENGTH,
                'regex:'.Setting::PREFIX_PATTERN,
            ],
            'shop_name' => 'sometimes|nullable|string|max:255',
            'shop_phone' => 'sometimes|nullable|string|max:30',
            'shop_address' => 'sometimes|nullable|string|max:500',
            'shop_gst' => 'sometimes|nullable|string|max:30',
            'shop_email' => 'sometimes|nullable|email|max:255',
        ], [
            Setting::SERVICE_LOG_ID_PREFIX.'.regex' => 'The prefix may only contain letters, numbers, - _ # and /.',
        ]);

        foreach ($validated as $key => $value) {
            if ($key === Setting::SERVICE_LOG_ID_PREFIX) {
                $value = Setting::sanitizePrefix($value);
            }
            Setting::set($key, $value === null ? null : (string) $value);
        }

        return response()->json(Setting::all_as_array());
    }
}
