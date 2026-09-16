# Jabari

純靜態點餐網頁。訂單存在雲端，任何裝置、任何瀏覽器都能同步。

## 使用

1. 用瀏覽器開啟 `admin.html`
2. 按「建立訂單庫」
3. 複製「點餐連結／後台連結」分享給其他裝置（網址含 `?sid=...`）
4. （可選）把 ID 填進 `js/config.js` 的 `storageId`，之後直接開 `index.html` 即可

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
