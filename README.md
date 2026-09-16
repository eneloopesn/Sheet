# 烤食煮盒 ROAST & COOK

純靜態點餐網頁，不需 Node.js。直接開啟 `index.html`，或上傳整個資料夾到任何靜態空間即可上線。

## 使用

- 點餐：雙擊 `index.html`，或用瀏覽器開啟
- 後台：開啟 `admin.html`

## 檔案

```
index.html      點餐頁
admin.html      後台統計
css/style.css
js/menu.js      菜單資料
js/store.js     訂單（localStorage）
js/app.js
js/admin.js
```

訂單存在瀏覽器 `localStorage`，同一台裝置、同一個瀏覽器才能看到前後台資料。
