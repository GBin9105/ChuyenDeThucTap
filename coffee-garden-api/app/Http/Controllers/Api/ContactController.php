<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required',
            'email'   => 'required|email',
            'phone'   => 'required',
            'content' => 'required'
        ]);

        $contact = Contact::create($data);

        return response()->json([
            'message' => 'Contact sent successfully',
            'data'    => $contact
        ]);
    }
}
