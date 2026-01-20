<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| CLIENT (PUBLIC)
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\TopicController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ConfigController;

// LEGACY (chưa xoá nhưng không dùng)
use App\Http\Controllers\Api\SizeController;
use App\Http\Controllers\Api\ToppingController;
use App\Http\Controllers\Api\OptionController;

/*
|--------------------------------------------------------------------------
| CLIENT (AUTH)
|---
-----------------------------------------------------------------------
*/
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderDetailController;
use App\Http\Controllers\Api\VNPayController;

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminOrderDetailController;
use App\Http\Controllers\Api\Admin\AdminPaymentController;
use App\Http\Controllers\Api\Admin\AdminPostController;
use App\Http\Controllers\Api\Admin\AdminBannerController;
use App\Http\Controllers\Api\Admin\AdminMenuController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\AdminTopicController;
use App\Http\Controllers\Api\Admin\AdminUserController;

use App\Http\Controllers\Api\Admin\AdminAttributeController;
use App\Http\Controllers\Api\Admin\AdminSaleCampaignController;
use App\Http\Controllers\Api\Admin\AdminSaleCampaignItemController;
use App\Http\Controllers\Api\Admin\AdminInventoryController;
use App\Http\Controllers\Api\Admin\AdminProductImageController;

use App\Http\Controllers\Api\Admin\AdminCartController;

/* ======================================================
 | AUTH API
====================================================== */
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',      [AuthController::class, 'me']);
        Route::put('/me',      [AuthController::class, 'updateMe']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/* ======================================================
 | CLIENT API (PUBLIC)
====================================================== */

/* ---------- Categories ---------- */
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9\-]+');

/* ---------- Products ---------- */
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9\-]+');

/* ---------- Product Gallery (READ ONLY) ---------- */
Route::get('/products/{slug}/images', [ProductController::class, 'gallery'])
    ->where('slug', '[a-zA-Z0-9\-]+');

/* ---------- LEGACY (không dùng -> có thể xoá sau) ---------- */
Route::get('/sizes', [SizeController::class, 'index']);
Route::get('/products/{id}/sizes', [SizeController::class, 'productSizes'])->whereNumber('id');

Route::get('/toppings', [ToppingController::class, 'index']);
Route::get('/products/{id}/toppings', [ToppingController::class, 'productToppings'])->whereNumber('id');

Route::get('/options', [OptionController::class, 'index']);
Route::get('/products/{id}/options', [OptionController::class, 'productOptions'])->whereNumber('id');

/* ---------- Blog ---------- */
Route::get('/topics', [TopicController::class, 'index']);
Route::get('/posts',  [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9\-]+');

/* ---------- Banners ---------- */
Route::get('/banners', [BannerController::class, 'index']);
Route::get('/banners/{position}', [BannerController::class, 'position']);

/* ---------- Menus ---------- */
Route::get('/menus/{position}', [MenuController::class, 'index']);

/* ---------- Contact ---------- */
Route::post('/contact', [ContactController::class, 'store']);

/* ---------- Config ---------- */
Route::get('/config', [ConfigController::class, 'show']);

/* ======================================================
 | VNPAY CALLBACKS (PUBLIC)
====================================================== */
Route::get('/payment/vnpay/return', [VNPayController::class, 'paymentReturn']);
Route::get('/payment/vnpay/ipn',    [VNPayController::class, 'ipn']);

/* ======================================================
 | CLIENT API (AUTHENTICATED - Sanctum)
====================================================== */
Route::middleware('auth:sanctum')->group(function () {

    /* ---------- Cart (User) ---------- */
    Route::get('/cart',           [CartController::class, 'index']);
    Route::post('/cart',          [CartController::class, 'store']);
    Route::patch('/cart/{cart}',  [CartController::class, 'update'])->whereNumber('cart');
    Route::delete('/cart/{cart}', [CartController::class, 'destroy'])->whereNumber('cart');

    // clear = xoá toàn bộ cart của CHÍNH user đang login
    Route::delete('/cart',        [CartController::class, 'clear']);

    /* ---------- Orders (User) ---------- */
    Route::post('/orders',     [OrderController::class, 'store']);
    Route::get('/orders',      [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');

    /* ---------- Order Items (User) ---------- */
    Route::get('/orders/{id}/items', [OrderDetailController::class, 'index'])->whereNumber('id');

    /* ---------- VNPay (Init/Retry) ---------- */
    Route::post('/payment/vnpay', [VNPayController::class, 'createPayment']);
});

/* ======================================================
 | ADMIN API (Require Admin)
====================================================== */
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'is_admin'])
    ->group(function () {

        /* ---------- CRUD ---------- */
        Route::apiResource('categories', AdminCategoryController::class);
        Route::apiResource('products',   AdminProductController::class);
        Route::apiResource('orders',     AdminOrderController::class);
        Route::apiResource('posts',      AdminPostController::class);
        Route::apiResource('banners',    AdminBannerController::class);
        Route::apiResource('menus',      AdminMenuController::class);
        Route::apiResource('topics',     AdminTopicController::class);
        Route::apiResource('users',      AdminUserController::class);

        /* ---------- CARTS (ADMIN) ---------- */
        Route::get('/carts', [AdminCartController::class, 'index']);

        // IMPORTANT: đặt clear TRƯỚC {cart} để tránh hiểu nhầm route
        Route::delete('/carts/clear', [AdminCartController::class, 'clear']);
        Route::delete('/carts/{cart}', [AdminCartController::class, 'destroy'])->whereNumber('cart');

        /* ---------- ORDER ITEMS (ADMIN) ---------- */
        Route::get('/orders/{orderId}/items', [AdminOrderDetailController::class, 'index'])
            ->whereNumber('orderId');

        Route::get('/orders/{orderId}/items/{id}', [AdminOrderDetailController::class, 'show'])
            ->whereNumber('orderId')
            ->whereNumber('id');

        Route::post('/orders/{orderId}/items', [AdminOrderDetailController::class, 'store'])
            ->whereNumber('orderId');

        Route::match(['put', 'patch'], '/orders/{orderId}/items/{id}', [AdminOrderDetailController::class, 'update'])
            ->whereNumber('orderId')
            ->whereNumber('id');

        Route::delete('/orders/{orderId}/items/{id}', [AdminOrderDetailController::class, 'destroy'])
            ->whereNumber('orderId')
            ->whereNumber('id');

        /* ---------- PAYMENTS (ADMIN) ---------- */
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{id}', [AdminPaymentController::class, 'show'])->whereNumber('id');
        Route::get('/orders/{orderId}/payments', [AdminPaymentController::class, 'byOrder'])
            ->whereNumber('orderId');

        /* ---------- ATTRIBUTE ---------- */
        Route::apiResource('attributes', AdminAttributeController::class);
        Route::post('/attributes/{id}/value', [AdminAttributeController::class, 'addValue'])->whereNumber('id');
        Route::put('/attributes/value/{id}', [AdminAttributeController::class, 'updateValue'])->whereNumber('id');
        Route::delete('/attributes/value/{id}', [AdminAttributeController::class, 'deleteValue'])->whereNumber('id');

        /* ---------- SALE CAMPAIGN ---------- */
        Route::apiResource('sale-campaigns', AdminSaleCampaignController::class);
        Route::post('/sale-campaigns/{id}/items', [AdminSaleCampaignItemController::class, 'store'])
            ->whereNumber('id');

        /* ---------- INVENTORY (SNAPSHOT) ---------- */
        Route::get('/inventory', [AdminInventoryController::class, 'index']);
        Route::post('/inventory/import', [AdminInventoryController::class, 'import']);
        Route::post('/inventory/adjust', [AdminInventoryController::class, 'adjust']);
        Route::get('/inventory/{productId}/history', [AdminInventoryController::class, 'history'])->whereNumber('productId');
        Route::get('/inventory/{productId}', [AdminInventoryController::class, 'show'])->whereNumber('productId');

        /* ---------- PRODUCT GALLERY (ADMIN) ---------- */
        Route::get('/products/{productId}/images', [AdminProductImageController::class, 'index'])
            ->whereNumber('productId');

        Route::post('/product-images', [AdminProductImageController::class, 'store']);
        Route::put('/product-images/{id}', [AdminProductImageController::class, 'update'])->whereNumber('id');
        Route::delete('/product-images/{id}', [AdminProductImageController::class, 'destroy'])->whereNumber('id');

        Route::post('/product-images/{id}/set-main', [AdminProductImageController::class, 'setMain'])->whereNumber('id');
        Route::post('/product-images/reorder', [AdminProductImageController::class, 'reorder']);

        /* ---------- Dashboard ---------- */
        Route::get('/dashboard/summary',       [DashboardController::class, 'summary']);
        Route::get('/dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);
        Route::get('/dashboard/top-products',  [DashboardController::class, 'topProducts']);
    });
