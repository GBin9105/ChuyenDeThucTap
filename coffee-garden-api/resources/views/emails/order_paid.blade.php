<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Đơn hàng đã thanh toán</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:720px;margin:0 auto;padding:24px;">
    {{-- Header --}}
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;">
      <div style="font-size:12px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;font-weight:700;">
        Coffee Garden
      </div>

      <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;">
        Thanh toán thành công
      </h1>

      <p style="margin:10px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Xin chào <b style="color:#0f172a;">{{ $order->name }}</b>,<br>
        Đơn hàng của bạn đã được ghi nhận thanh toán thành công.
      </p>

      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <span style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;">
          PAID
        </span>

        <span style="display:inline-block;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;">
          {{ strtoupper($order->payment_method ?? 'vnpay') }}
        </span>

        @if(!empty($order->paid_at))
          <span style="display:inline-block;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;">
            Paid at: {{ optional($order->paid_at)->timezone('Asia/Ho_Chi_Minh')->format('H:i:s d/m/Y') }}
          </span>
        @endif
      </div>
    </div>

    {{-- Order summary --}}
    <div style="margin-top:14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;">
      <h2 style="margin:0;font-size:16px;">Thông tin đơn hàng</h2>

      <table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;width:140px;">Mã đơn</td>
          <td style="padding:6px 0;"><b>{{ $order->order_code ?? ('#'.$order->id) }}</b></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">SĐT</td>
          <td style="padding:6px 0;">{{ $order->phone }}</td>
        </tr>
        @if(!empty($order->email))
          <tr>
            <td style="padding:6px 0;color:#64748b;">Email</td>
            <td style="padding:6px 0;">{{ $order->email }}</td>
          </tr>
        @endif
        @if(!empty($order->address))
          <tr>
            <td style="padding:6px 0;color:#64748b;">Địa chỉ</td>
            <td style="padding:6px 0;">{{ $order->address }}</td>
          </tr>
        @endif
        @if(!empty($order->note))
          <tr>
            <td style="padding:6px 0;color:#64748b;">Ghi chú</td>
            <td style="padding:6px 0;">{{ $order->note }}</td>
          </tr>
        @endif
        @if(!empty($order->vnp_TxnRef))
          <tr>
            <td style="padding:6px 0;color:#64748b;">VNPay TxnRef</td>
            <td style="padding:6px 0;">{{ $order->vnp_TxnRef }}</td>
          </tr>
        @endif
      </table>
    </div>

    {{-- Items --}}
    <div style="margin-top:14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;">
      <h2 style="margin:0;font-size:16px;">Sản phẩm</h2>

      <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8fafc;color:#334155;">
              <th align="left" style="padding:10px;border-bottom:1px solid #e2e8f0;">Tên</th>
              <th align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">Đơn giá</th>
              <th align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">Extras</th>
              <th align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">SL</th>
              <th align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            @foreach(($order->items ?? []) as $it)
              @php
                $name = $it->product_name ?? optional($it->product)->name ?? 'Sản phẩm';
                $unit = (float) ($it->unit_price ?? 0);
                $extras = (float) ($it->extras_total ?? 0); // per-unit
                $qty = (int) ($it->qty ?? 0);
                $lineTotal = (float) ($it->line_total ?? ($qty * ($unit + $extras)));
              @endphp
              <tr>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
                  <div style="font-weight:700;">{{ $name }}</div>
                  @if(!empty($it->size_name))
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">
                      Size: {{ $it->size_name }}
                      @if((float)($it->size_price_extra ?? 0) > 0)
                        ( +{{ number_format((float)$it->size_price_extra, 0, ',', '.') }} đ )
                      @endif
                    </div>
                  @endif
                </td>

                <td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">
                  {{ number_format($unit, 0, ',', '.') }} đ
                </td>

                <td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">
                  {{ number_format($extras, 0, ',', '.') }} đ
                </td>

                <td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;">
                  {{ $qty }}
                </td>

                <td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700;">
                  {{ number_format($lineTotal, 0, ',', '.') }} đ
                </td>
              </tr>
            @endforeach

            @if(empty($order->items) || count($order->items) === 0)
              <tr>
                <td colspan="5" style="padding:12px;color:#64748b;text-align:center;">
                  (Không có items)
                </td>
              </tr>
            @endif
          </tbody>
        </table>
      </div>

      {{-- Totals --}}
      @php
        $subtotal = (float) ($order->subtotal ?? 0);
        $extrasTotal = (float) ($order->extras_total ?? 0);
        $total = (float) ($order->total_price ?? 0);
      @endphp

      <div style="margin-top:14px;display:flex;justify-content:flex-end;">
        <table style="min-width:320px;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;">Subtotal</td>
            <td align="right" style="padding:6px 0;">{{ number_format($subtotal, 0, ',', '.') }} đ</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">Extras</td>
            <td align="right" style="padding:6px 0;">{{ number_format($extrasTotal, 0, ',', '.') }} đ</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-weight:800;">Tổng thanh toán</td>
            <td align="right" style="padding:10px 0;border-top:1px solid #e2e8f0;font-weight:800;">
              {{ number_format($total, 0, ',', '.') }} đ
            </td>
          </tr>
        </table>
      </div>
    </div>

    {{-- Footer --}}
    <div style="margin-top:14px;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
      Email này được gửi tự động. Nếu bạn không thực hiện giao dịch này, vui lòng liên hệ hỗ trợ.
      <div style="margin-top:6px;">© {{ date('Y') }} Coffee Garden</div>
    </div>
  </div>
</body>
</html>
