<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getStaff()
    {
        $staff = User::where('role', 'staff')->get(['id', 'name', 'email']);
        return response()->json($staff);
    }
}
