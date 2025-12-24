# Mortgage Simulator

Công cụ mô phỏng chi phí vay mua BĐS và refinance tại Việt Nam. So sánh nhiều gói vay với 3 chiến lược trả nợ khác nhau.

## Features

- 🏠 **Mô phỏng vay mua BĐS** - Tính toán chi phí cho khoản vay mua nhà mới
- 🔄 **Mô phỏng Refinance** - So sánh chi phí chuyển ngân hàng
- 📊 **So sánh 3 chiến lược** - Thanh toán tối thiểu, trả thêm gốc, tất toán sớm
- 📈 **Lịch thanh toán chi tiết** - Xem từng tháng với lãi suất, gốc, lãi
- 📥 **Xuất CSV** - Tải về lịch thanh toán chi tiết

## Project Structure

```
loan-ai/
├── apps/
│   └── web/              # Next.js frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       ├── lib/          # Utilities, hooks, types
│       └── data/         # Static JSON data
└── packages/
    └── loan-engine/      # TypeScript calculation engine
        ├── src/
        │   ├── engine.ts     # Core simulation logic
        │   ├── templates.ts  # Built-in product templates
        │   └── types.ts      # Type definitions
        └── tests/
```

## Quick Start

### 1. Build Loan Engine

```bash
cd packages/loan-engine
npm install
npm run build
```

### 2. Start Frontend

```bash
cd apps/web
npm install
npm run dev
```

App will be available at http://localhost:3000

## Strategies

### Mortgage Strategies (M1, M2, M3)

| Strategy | Description | Best For |
|----------|-------------|----------|
| **M1: Thanh Toán Tối Thiểu** | Chỉ trả đúng kỳ hạn | Giữ thanh khoản, cần vốn cho đầu tư khác |
| **M2: Trả Thêm Gốc** | Trả thêm gốc cố định hàng tháng | Có thu nhập ổn định, muốn giảm tổng lãi |
| **M3: Tất Toán Sớm** | Tất toán tại mốc thời gian xác định | Có kế hoạch bán nhà hoặc nguồn tiền lớn |

### Refinance Strategies (R1, R2, R3)

| Strategy | Description | Best For |
|----------|-------------|----------|
| **R1: Refinance Ngay** | Chuyển vay ngay, trả tối thiểu | Muốn hưởng lãi suất mới ngay |
| **R2: Refinance + Trả Nhanh** | Chuyển vay ngay và trả thêm gốc | Muốn tiết kiệm lãi tối đa |
| **R3: Thời Điểm Tối Ưu** | Tự động tìm tháng refinance tối ưu | Phí tất toán cũ còn cao |

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching

## Development

### Run Tests

```bash
# Loan engine tests
cd packages/loan-engine
npm test
```

### Build for Production

```bash
# Build loan-engine first
cd packages/loan-engine
npm run build

# Build frontend
cd apps/web
npm run build
npm start
```

## License

Proprietary - All Rights Reserved
