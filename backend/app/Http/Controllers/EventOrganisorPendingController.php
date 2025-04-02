<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EventOrganisorPending;
use Illuminate\Support\Facades\Storage;

class EventOrganisorPendingController extends Controller
{
    // Store event organizer data with PDF upload
    public function store(Request $request)
{
    try {
        // Validate request (without unique rule)
        $data = $request->validate([
            'name'  => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'pdf_file' => 'required|mimes:pdf|max:2048'
        ]);

        // Manually check if email exists in MongoDB
        if (EventOrganisorPending::where('email', $request->email)->exists()) {
            return response()->json(['error' => 'Email already exists'], 400);
        }

        // Handle PDF upload
        $pdfPath = $request->file('pdf_file')->store('pdfs', 'public');
        $pdfUrl = asset('storage/' . $pdfPath);

        // Save organizer to MongoDB
        $organizer = EventOrganisorPending::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'pdf_url' => $pdfUrl,
        ]);

        return response()->json(['message' => 'Organizer registered successfully!', 'data' => $organizer], 201);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}


    // Fetch all event organizers
    public function index()
    {
        $organizers = EventOrganisorPending::all();
        return response()->json($organizers);
    }
}
