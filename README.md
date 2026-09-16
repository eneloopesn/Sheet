# 烤食煮盒 ROAST & COOK

純靜態點餐網頁。訂單存在 jsonstorage 雲端，可跨裝置／瀏覽器同步。

## 第一次設定

1. 開啟 https://app.jsonstorage.net 免費註冊
2. 建立一把有 **Create** 權限的 API Key
3. 把 Key 填進 `js/config.js` 的 `apiKey`（或後台輸入後按「儲存 Key」）
4. 用網站網址開啟 `admin.html`（不要雙擊本機檔案）
5. 按「建立訂單庫」
6. 把顯示的訂單庫 ID 填回 `js/config.js` 的 `storageId`

完成後，點餐頁與後台即可跨裝置同步。

## 檔案

```
index.html
admin.html
js/config.js    ← apiKey、storageId
js/menu.js
js/store.js
js/app.js
js/admin.js
css/style.css
```
