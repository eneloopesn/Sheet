# 烤食煮盒 ROAST & COOK

訂單存在雲端（jsonstorage），任何裝置、任何瀏覽器都能同步。

## 使用

1. **先把網站用網址開啟**（上傳到靜態空間，或本機用 Live Server／`npx serve`），不要直接雙擊 `file://`
2. 開啟 `admin.html`，按「建立訂單庫」
3. 複製「點餐連結／後台連結」分享給其他裝置
4. （可選）把 ID 填進 `js/config.js` 的 `storageId`

## 檔案

```
index.html      點餐頁
admin.html      後台統計
js/config.js    雲端訂單庫 ID（可選預填）
js/menu.js
js/store.js
js/app.js
js/admin.js
css/style.css
```
