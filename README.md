# 瑜珈教室網站

這是一個完整的瑜珈教室管理系統，包含前端公開頁面、會員專區和後端管理介面。

## 功能特色

### 前端公開頁面
- **首頁**：介紹、最新消息、快速連結
- **上課時間表**：顯示每週課程表
- **預約體驗**：非會員預約體驗課程
- **聯絡方式**：地址、電話、地圖、營業時間

### 會員專區
- **會員登入**：安全的帳號密碼登入
- **會員中心**：會員資料總覽、統計資訊
- **請假/補課管理**：
  - 申請請假（需在課程開始前2小時以上）
  - 申請補課（可關聯請假紀錄）
  - 取消請假/補課
  - SMS 通知（申請成功後自動發送）
- **查詢紀錄**：查詢請假/補課時間、剩餘堂數
- **個人資料設定**：修改密碼、聯絡資訊

### 後端管理介面
- **管理者登入**：管理員專屬登入頁面
- **管理中心**：網站數據總覽
- **會員管理**：新增、修改、刪除會員資料
- **課程/課表管理**：管理課程內容、時間、教練
- **預約管理**：管理體驗預約申請
- **請假/補課審核**：查詢、修改會員請假/補課紀錄

## 技術架構

- **前端框架**：Next.js 14 (App Router)
- **語言**：TypeScript
- **樣式**：Tailwind CSS
- **資料庫**：SQLite (使用 Prisma ORM)
- **認證**：JWT (JSON Web Token)
- **表單處理**：React Hook Form
- **日期處理**：date-fns

## 安裝與設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定以下變數：
- `DATABASE_URL`：資料庫連線字串（SQLite 預設為 `file:./dev.db`）
- `JWT_SECRET`：JWT 密鑰（請在正式環境中使用強密鑰）
- `NEXT_PUBLIC_BASE_URL`：網站基礎 URL（生產環境設定為 `http://111.185.61.18:3000`）
- `SMS_API_KEY`、`SMS_API_SECRET`、`SMS_FROM_NUMBER`：SMS 服務設定（選填）

範例 `.env` 檔案內容：
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_BASE_URL="http://111.185.61.18:3000"
SMS_API_KEY=""
SMS_API_SECRET=""
SMS_FROM_NUMBER=""
```

### 3. 初始化資料庫

```bash
# 產生 Prisma Client
npm run db:generate

# 推送資料庫架構
npm run db:push
```

### 4. 建立預設管理員帳號

資料庫初始化後，需要手動建立管理員帳號。可以使用 Prisma Studio：

```bash
npm run db:studio
```

或使用 SQL 直接插入：

```sql
-- 預設密碼為 "admin123" (已使用 bcrypt 加密)
INSERT INTO Admin (id, username, password, name, email, createdAt, updatedAt)
VALUES ('admin-1', 'admin', '$2a$10$...', '管理員', 'admin@yoga.com', datetime('now'), datetime('now'));
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://111.185.61.18:3000](http://111.185.61.18:3000)

## 專案結構

```
├── app/                    # Next.js App Router 頁面
│   ├── api/               # API 路由
│   │   ├── admin/         # 管理後台 API
│   │   └── member/        # 會員專區 API
│   ├── admin/             # 管理後台頁面
│   ├── member/            # 會員專區頁面
│   └── ...                # 公開頁面
├── lib/                   # 共用函式庫
│   ├── auth.ts           # 認證相關函式
│   ├── prisma.ts         # Prisma Client
│   └── sms.ts            # SMS 通知服務
├── prisma/                # Prisma 設定
│   └── schema.prisma     # 資料庫架構定義
└── ...                    # 其他設定檔案
```

## 資料庫架構

### 主要資料表
- **Admin**：管理員帳號
- **Member**：會員資料
- **Leave**：請假紀錄
- **Makeup**：補課紀錄
- **Class**：課程資料
- **Booking**：體驗預約
- **Contact**：聯絡資訊

## SMS 通知整合

目前 SMS 通知功能使用範例實作，實際部署時需要：

1. 選擇 SMS 服務商（如 Twilio、Nexmo 等）
2. 在 `lib/sms.ts` 中實作真實的 API 呼叫
3. 在 `.env` 中設定對應的 API 金鑰

## 部署建議

### Vercel 部署
1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 在 Vercel 專案設定中，前往「Settings」→「Environment Variables」，設定以下環境變數：
   - `DATABASE_URL`：資料庫連線字串
   - `JWT_SECRET`：JWT 密鑰
   - `NEXT_PUBLIC_BASE_URL`：設定為 `http://111.185.61.18:3000`（或您的實際網域）
   - `SMS_API_KEY`、`SMS_API_SECRET`、`SMS_FROM_NUMBER`（選填）
4. 使用 Vercel 的 PostgreSQL 或其他資料庫服務

### 其他平台
- 確保支援 Next.js 14
- 在部署平台的環境變數設定中，設定 `NEXT_PUBLIC_BASE_URL=http://111.185.61.18:3000`
- 設定其他必要的環境變數（`DATABASE_URL`、`JWT_SECRET` 等）
- 使用支援的資料庫（建議 PostgreSQL 或 MySQL）

## 開發注意事項

1. **資料庫**：開發環境使用 SQLite，生產環境建議使用 PostgreSQL 或 MySQL
2. **密碼加密**：使用 bcrypt 進行密碼雜湊
3. **認證機制**：使用 JWT 儲存在 HTTP-only Cookie 中
4. **SMS 通知**：目前為範例實作，需要連接真實服務

## 授權

MIT License


