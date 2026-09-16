# 烤食煮盒簡易點餐系統（純 HTML）

不需 Node.js。雙擊 `index.html` / `admin.html` 即可使用。

## 跨裝置自動共用後台（建議）

訂單若要在手機、電腦、平板之間**自動即時同步**，請用免費的 Firebase Realtime Database（約 5 分鐘設定一次）。

### 1. 建立 Firebase 專案

1. 開啟 [Firebase Console](https://console.firebase.google.com/)
2. 新增專案（可關閉 Google Analytics）
3. 專案概覽 → **新增應用程式** → 選 **Web** → 註冊後複製設定物件

### 2. 建立 Realtime Database

1. 左側 **Build → Realtime Database → Create Database**
2. 選地區（例如 `asia-southeast1`）
3. 一開始可選 **測試模式**
4. 到 **規則**，確認可讀寫（測試用）：

```json
{
  "rules": {
    "orders": {
      ".read": true,
      ".write": true
    }
  }
}
```

> 正式營運請再加密碼或登入限制。測試規則通常 30 天後會過期，記得調整。

### 3. 填入本專案設定

編輯 `js/config.js`，貼上 Firebase 給你的值，**務必包含 `databaseURL`**：

```js
const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "你的專案.firebaseapp.com",
  databaseURL: "https://你的專案-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "你的專案",
  storageBucket: "你的專案.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

存檔後重新整理前台／後台，看到綠色「雲端同步已開啟」即可。

### 4. 上線給不同裝置用

把整個資料夾上傳到靜態空間（GitHub Pages、Netlify、Cloudflare Pages 等），各裝置開啟**同一個網址**即可自動共用訂單。

> 若只在本機雙擊開啟 `index.html`（`file://`），Firebase 仍可同步；但手機通常無法開你電腦上的檔案，所以跨裝置請用網址上線。

## 未設定 Firebase 時

系統會自動改用本機瀏覽器儲存：同一台裝置的前台／後台仍可共用，但**不同裝置不會互通**。
