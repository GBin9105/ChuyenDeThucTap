<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Configuration (Laravel 12)
    |--------------------------------------------------------------------------
    |
    | File cấu hình CORS chuẩn cho API dùng Sanctum.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        '/login',
        '/logout',
        '/register',
    ],

    'allowed_methods' => ['*'],

    // CHO PHÉP MỌI DOMAIN (Frontend)
    // Khi deploy, bạn có thể sửa lại thành domain thật
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // Headers nào FE có thể xem
    'exposed_headers' => [],

    'max_age' => 0,

    // BẮT BUỘC TRUE khi dùng Sanctum hoặc login qua frontend
    'supports_credentials' => true,

];
