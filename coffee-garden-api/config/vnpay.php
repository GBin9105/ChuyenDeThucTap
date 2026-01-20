<?php

return [
    'vnp_TmnCode'    => trim((string) env('VNPAY_TMN_CODE', ''), " \t\n\r\0\x0B\"'"),
    'vnp_HashSecret' => preg_replace('/\s+/', '', trim((string) env('VNPAY_HASH_SECRET', ''), " \t\n\r\0\x0B\"'")),
    'vnp_Url'        => trim((string) env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'), " \t\n\r\0\x0B\"'"),

    'vnp_ReturnUrl'  => trim((string) env('VNPAY_RETURN_URL', ''), " \t\n\r\0\x0B\"'"),
    'vnp_IpnUrl'     => trim((string) env('VNPAY_IPN_URL', ''), " \t\n\r\0\x0B\"'"),

    'frontend_return_url' => trim((string) env('FRONTEND_RETURN_URL', 'http://localhost:3000/payment-result'), " \t\n\r\0\x0B\"'"),

    'version'        => trim((string) env('VNPAY_VERSION', '2.1.0')),
    'hash_type'      => trim((string) env('VNPAY_HASH_TYPE', 'HMACSHA512')),

    'order_info'     => (string) env('VNPAY_ORDER_INFO', 'Thanh toan Coffee Garden'),
    'order_type'     => (string) env('VNPAY_ORDER_TYPE', 'other'),
    'locale'         => (string) env('VNPAY_LOCALE', 'vn'),
    'expire_minutes' => (int) env('VNPAY_EXPIRE_MINUTES', 15),

    'debug'          => (bool) env('VNPAY_DEBUG', false),
];
