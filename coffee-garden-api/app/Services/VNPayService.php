<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VNPayService
{
    public function createPayment(array $data): array
    {
        $cfg = $this->getConfig();

        $tmnCode    = $cfg['tmn'];
        $hashSecret = $cfg['secret'];
        $vnpUrl     = $cfg['url'];
        $returnUrl  = trim((string) ($data['return_url'] ?? $cfg['return_url']), " \t\n\r\0\x0B\"'");

        if ($tmnCode === '' || $hashSecret === '' || $vnpUrl === '' || $returnUrl === '') {
            return [
                'code'    => '99',
                'message' => 'Missing VNPay config: VNPAY_TMN_CODE / VNPAY_HASH_SECRET / VNPAY_URL / VNPAY_RETURN_URL',
            ];
        }

        $amountVnd = (float) ($data['amount'] ?? 0);
        if ($amountVnd <= 0) {
            return ['code' => '99', 'message' => 'Invalid amount'];
        }

        $rawTxnRef = (string) ($data['txn_ref'] ?? (now()->format('YmdHis') . Str::upper(Str::random(10))));
        $txnRef = $this->normalizeTxnRef($rawTxnRef);

        $vnpAmount = (int) round($amountVnd * 100);

        $orderInfo = (string) ($data['order_info'] ?? $cfg['order_info']);
        $orderInfo = $this->normalizeOrderInfo($orderInfo);

        $orderType = trim((string) ($data['order_type'] ?? $cfg['order_type']));
        $locale    = trim((string) ($data['locale'] ?? $cfg['locale']));
        $bankCode  = trim((string) ($data['bank_code'] ?? ''));

        $nowVN = now()->setTimezone('Asia/Ho_Chi_Minh');
        $createDate = $nowVN->format('YmdHis');

        $expireMins = max(1, (int) $cfg['expire_minutes']);
        $expireDate = $nowVN->copy()->addMinutes($expireMins)->format('YmdHis');

        $ipAddr = $this->resolveClientIpForVNPay();

        $inputData = [
            'vnp_Version'    => $cfg['version'],
            'vnp_Command'    => 'pay',
            'vnp_TmnCode'    => $tmnCode,
            'vnp_Amount'     => $vnpAmount,
            'vnp_CurrCode'   => 'VND',
            'vnp_TxnRef'     => $txnRef,
            'vnp_OrderInfo'  => $orderInfo,
            'vnp_OrderType'  => $orderType,
            'vnp_Locale'     => $locale,
            'vnp_ReturnUrl'  => $returnUrl,
            'vnp_IpAddr'     => $ipAddr,
            'vnp_CreateDate' => $createDate,
            'vnp_ExpireDate' => $expireDate,
        ];

        if ($bankCode !== '') {
            $inputData['vnp_BankCode'] = $bankCode;
        }

        $inputData = $this->removeNullEmpty($inputData);
        ksort($inputData);

        // build hashData + query theo chuẩn VNPAY demo: urlencode cả key/value
        [$hashData, $query] = $this->buildHashDataAndQuery($inputData);

        $vnpSecureHash = hash_hmac('sha512', $hashData, $hashSecret);

        // query đã có '&' cuối
        $paymentUrl = $vnpUrl . '?' . $query . 'vnp_SecureHash=' . $vnpSecureHash;

        if ($cfg['debug']) {
            Log::info('VNPAY CREATE DEBUG', [
                'tmn' => $tmnCode,
                'version' => $cfg['version'],
                'hash_type' => 'HMACSHA512',
                'hashData' => $hashData,
                'secureHash' => $vnpSecureHash,
                'payment_url' => $paymentUrl,
                'params' => $inputData,
            ]);
        }

        return [
            'code'        => '00',
            'message'     => 'success',
            'payment_url' => $paymentUrl,
            'vnp_TxnRef'  => $txnRef,
            'vnp_Amount'  => $vnpAmount,
        ];
    }

    public function verify(array $input): array
    {
        $cfg = $this->getConfig();
        $hashSecret = $cfg['secret'];

        $vnpParams = [];
        foreach ($input as $k => $v) {
            if (is_string($k) && str_starts_with($k, 'vnp_')) {
                $vnpParams[$k] = $v;
            }
        }

        $provided = (string) ($vnpParams['vnp_SecureHash'] ?? '');
        $txnRef   = $vnpParams['vnp_TxnRef'] ?? null;

        unset($vnpParams['vnp_SecureHash'], $vnpParams['vnp_SecureHashType']);

        $vnpParams = $this->removeNullEmpty($vnpParams);
        ksort($vnpParams);

        // hashData cũng urlencode key/value y hệt lúc create
        [$hashData, $_query] = $this->buildHashDataAndQuery($vnpParams);

        $calculated = hash_hmac('sha512', $hashData, $hashSecret);
        $isVerified = ($provided !== '') && hash_equals(strtolower($calculated), strtolower($provided));

        $responseCode = (string) ($input['vnp_ResponseCode'] ?? '');
        $txnStatus    = (string) ($input['vnp_TransactionStatus'] ?? '');
        $isSuccess    = ($responseCode === '00' && $txnStatus === '00');

        if ($cfg['debug']) {
            Log::info('VNPAY VERIFY DEBUG', [
                'txnRef' => $txnRef,
                'hashData' => $hashData,
                'provided' => $provided,
                'calculated' => $calculated,
                'is_verified' => $isVerified,
                'responseCode' => $responseCode,
                'txnStatus' => $txnStatus,
            ]);
        }

        return [
            'is_verified' => $isVerified,
            'is_success'  => $isSuccess,
            'vnp_TxnRef'  => $txnRef,
            'response_code' => $responseCode,
            'transaction_status' => $txnStatus,
        ];
    }

    private function getConfig(): array
    {
        $tmn = trim((string) config('vnpay.vnp_TmnCode', ''), " \t\n\r\0\x0B\"'");
        $secret = trim((string) config('vnpay.vnp_HashSecret', ''), " \t\n\r\0\x0B\"'");
        $url = trim((string) config('vnpay.vnp_Url', ''), " \t\n\r\0\x0B\"'");
        $returnUrl = trim((string) config('vnpay.vnp_ReturnUrl', ''), " \t\n\r\0\x0B\"'");

        $secret = preg_replace('/\s+/', '', $secret) ?? $secret;

        return [
            'tmn' => $tmn,
            'secret' => $secret,
            'url' => $url,
            'return_url' => $returnUrl,

            'version' => (string) config('vnpay.version', '2.1.0'),
            'order_info' => (string) config('vnpay.order_info', 'Thanh toan Coffee Garden'),
            'order_type' => (string) config('vnpay.order_type', 'other'),
            'locale' => (string) config('vnpay.locale', 'vn'),
            'expire_minutes' => (int) config('vnpay.expire_minutes', 15),

            'debug' => (bool) config('vnpay.debug', false),
        ];
    }

    /**
     * Chuẩn theo demo VNPAY:
     * - hashData: urlencode(key)=urlencode(value)&... (không có '&' cuối)
     * - query:    urlencode(key)=urlencode(value)&... (có '&' cuối để nối vnp_SecureHash)
     */
    private function buildHashDataAndQuery(array $params): array
    {
        $hashData = '';
        $query = '';
        $i = 0;

        foreach ($params as $key => $value) {
            if (is_bool($value)) $value = $value ? '1' : '0';
            if ($value === null) $value = '';
            if (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
            $value = (string) $value;

            $encKey = urlencode((string) $key);
            $encVal = urlencode($value);

            if ($i === 1) {
                $hashData .= '&' . $encKey . '=' . $encVal;
            } else {
                $hashData .= $encKey . '=' . $encVal;
                $i = 1;
            }

            $query .= $encKey . '=' . $encVal . '&';
        }

        return [$hashData, $query];
    }

    private function removeNullEmpty(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            if ($v === null) continue;
            if (is_string($v) && $v === '') continue;
            $out[$k] = $v;
        }
        return $out;
    }

    private function normalizeTxnRef(string $txnRef): string
    {
        $clean = preg_replace('/[^A-Za-z0-9]/', '', $txnRef) ?: '';
        $clean = substr($clean, 0, 40);

        if ($clean === '') {
            $clean = now()->format('YmdHis') . Str::upper(Str::random(6));
            $clean = preg_replace('/[^A-Za-z0-9]/', '', $clean) ?: now()->format('YmdHis');
            $clean = substr($clean, 0, 40);
        }
        return $clean;
    }

    private function normalizeOrderInfo(string $orderInfo): string
    {
        $s = Str::ascii($orderInfo);
        $s = preg_replace('/[^A-Za-z0-9 \:\-\_\.\,\/]/', ' ', $s) ?: '';
        $s = trim(preg_replace('/\s+/', ' ', $s) ?: '');
        return $s !== '' ? $s : 'Thanh toan';
    }

    private function resolveClientIpForVNPay(): string
    {
        try {
            $ip = (string) request()->ip();
        } catch (\Throwable $e) {
            $ip = '';
        }

        $ip = trim($ip);

        if ($ip === '' || strlen($ip) < 7 || strlen($ip) > 45) {
            return '127.0.0.1';
        }

        return $ip;
    }
}
