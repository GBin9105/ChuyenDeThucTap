<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Contact;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        Contact::insert([
            [
                'name' => 'Nguyễn Văn A',
                'email' => 'vana@example.com',
                'phone' => '0909009009',
                'content' => 'Tôi muốn góp ý về dịch vụ.',
            ],
        ]);
    }
}
