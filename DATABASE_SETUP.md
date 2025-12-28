# 資料庫設置說明

## 已完成的設置

### 1. 管理者帳號設置
- **帳號**: `admin`
- **密碼**: `admin123`
- **姓名**: 系統管理員
- **Email**: admin@yoga-studio.com

### 2. 資料庫 Schema 更新

資料庫已更新包含以下新欄位：

#### Member 表新增欄位：
- `classId1` (String?) - 第一堂課的 Class ID
- `classId2` (String?) - 第二堂課的 Class ID
- `classId3` (String?) - 第三堂課的 Class ID

#### Class 表新增欄位：
- `isRecurring` (Boolean) - 是否為週期性課程
- `recurringPattern` (String?) - 週期模式 (daily, weekly, monthly)
- `recurringEndDate` (DateTime?) - 週期結束日期

#### ClassEnrollment 表：
- 用於記錄會員預約課程的關聯表
- 包含 `memberId` 和 `classId` 的唯一約束

### 3. 初始化腳本

執行以下命令來初始化或更新管理員帳號：

```bash
npx ts-node scripts/init-admin.ts
```

### 4. 資料庫遷移

如果 schema 有變更，執行以下命令：

```bash
npx prisma db push
```

或使用 migrate（在互動環境中）：

```bash
npx prisma migrate dev
```

## 登入資訊

**管理者登入**：
- URL: `/admin/login`
- 帳號: `admin`
- 密碼: `admin123`

