<?php

namespace App\Http\Controllers;
use App\Models\EventOrg;
use Illuminate\Http\Request;

class EventOrgController extends Controller
{
    public function index() {
        return EventOrg::all(); // List all event organizers
    }

    public function store(Request $request) {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'phone' => 'required',
            'pdf' => 'required|file|mimes:pdf',
        ]);

        $eventOrg = EventOrg::create($request->all());

        return response()->json(['message' => 'Event Organizer added!', 'data' => $eventOrg]);
    }

    public function update(Request $request, $id) {
        $eventOrg = EventOrg::findOrFail($id);
        $eventOrg->update($request->all());

        return response()->json(['message' => 'Updated successfully', 'data' => $eventOrg]);
    }

    public function destroy($id) {
        EventOrg::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
