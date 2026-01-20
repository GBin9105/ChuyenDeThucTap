<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Config extends Model
{
    protected $fillable = [
        'site_name','email','phone','hotline','address','status'
    ];
}
