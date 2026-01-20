<?php

namespace App\Services;

use App\Models\Contact;

class ContactService
{
    public function store(array $data)
    {
        return Contact::create($data);
    }
}
