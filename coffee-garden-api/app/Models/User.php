<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'username',
        'password',
        'roles',
        'avatar',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Hash password khi ghi vào DB
     * Nhưng KHÔNG hash lại nếu password đã là bcrypt hash.
     */
    public function setPasswordAttribute($value)
    {
        if ($value && !Hash::info($value)['algo']) {
            $this->attributes['password'] = Hash::make($value);
        } else {
            // mật khẩu đã hashed trước đó → giữ nguyên
            $this->attributes['password'] = $value;
        }
    }
}
