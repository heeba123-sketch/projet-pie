<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function google(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'google_id' => 'nullable|string',
            'profile_image' => 'nullable|string',
        ]);

        try {
            // In a real app, you'd verify the Firebase ID token here.
            // For simplicity in this demo, we trust the frontend data.
            
            $user = User::where('email', $request->email)->first();

            if ($user) {
                // Update existing user with google info if not set
                if ($request->google_id && !$user->google_id) {
                    $user->update([
                        'google_id' => $request->google_id,
                        'profile_image' => $user->profile_image ?? $request->profile_image,
                    ]);
                }
            } else {
                // Create new user
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'google_id' => $request->google_id,
                    'profile_image' => $request->profile_image,
                    'password' => bcrypt(str()->random(24)), // Random password for google users
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Google auth error: ' . $e->getMessage());
            return response()->json(['message' => 'Authentication failed'], 500);
        }
    }
}
