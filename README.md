# Loan Form

Ứng dụng React + Vite để tính lịch trả nợ vay vốn theo phương pháp **dư nợ gốc giảm dần** và đăng ký khoản vay qua JSONBin.

## Yêu cầu bài toán

Người dùng nhập:

- Số tiền vay (`p`)
- Kỳ hạn (`n` tháng)
- Lãi suất cố định (`r%/năm`)

Hệ thống tính số tiền phải trả theo từng tháng, có validate dữ liệu, và cho phép đăng ký vay khi người dùng đồng ý.

Ví dụ: vay `120.000.000`, kỳ hạn `12` tháng, lãi `12%/năm`.

- Gốc tháng 1: `120.000.000 / 12 = 10.000.000`
- Lãi tháng 1: `120.000.000 * 1% = 1.200.000`
- Tổng trả tháng 1: `11.200.000`

## Tính năng hiện có

- Validate form (số tiền vay, kỳ hạn, lãi suất).
- Tính lịch trả nợ theo tháng với các cột: gốc, lãi, tổng trả, dư nợ còn lại.
- Hiển thị tổng quan: trả tháng đầu, tổng tiền lãi, tổng thanh toán.
- Đăng ký vay thật qua JSONBin, có trạng thái đang gửi, thành công, thất bại.

## Chạy dự án

```bash
pnpm install
pnpm dev
```

## Kiểm thử

```bash
pnpm test -- --run
```

## Cấu hình JSONBin

Tạo file `.env` ở thư mục gốc:

```bash
VITE_JSONBIN_MASTER_KEY=<your-jsonbin-master-key>
VITE_JSONBIN_ACCESS_KEY=<optional-access-key>
VITE_JSONBIN_BIN_ID=<optional-bin-id>
```

- `VITE_JSONBIN_MASTER_KEY`: bắt buộc.
- `VITE_JSONBIN_ACCESS_KEY`: tùy chọn.
- `VITE_JSONBIN_BIN_ID`: tùy chọn.
- Có `VITE_JSONBIN_BIN_ID`: dùng `PUT /v3/b/{binId}`.
- Không có `VITE_JSONBIN_BIN_ID`: dùng `POST /v3/b`.
