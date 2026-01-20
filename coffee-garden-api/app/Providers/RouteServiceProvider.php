<?php

namespace App\Providers;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Khai báo Limit cho API — fix lỗi "Rate limiter [api] is not defined"
        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
