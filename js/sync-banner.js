/** 同步狀態列（前台／後台共用） */
async function initSyncBanner(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const configured =
    typeof isCloudConfigured === "function" && isCloudConfigured();

  if (!configured) {
    el.className = "sync-banner warn";
    el.innerHTML = `
      <strong>尚未開啟跨裝置同步</strong>
      請編輯 <code>js/config.js</code>，填入 Firebase 設定（步驟見 README）。
      目前訂單只存在這台裝置的瀏覽器。
    `;
    return;
  }

  el.className = "sync-banner loading";
  el.innerHTML = `<strong>連線雲端中…</strong>`;

  try {
    const result = await OrderStore.ready();
    if (result.mode === "cloud") {
      el.className = "sync-banner ok";
      el.innerHTML = `<strong>雲端同步已開啟</strong> 不同裝置的前台／後台會自動共用同一份訂單。`;
    } else {
      el.className = "sync-banner warn";
      el.innerHTML = `<strong>雲端連線失敗</strong> 已暫時改用本機儲存。請檢查 Firebase 設定與資料庫規則。`;
    }
  } catch (err) {
    el.className = "sync-banner warn";
    el.innerHTML = `<strong>雲端連線失敗</strong> ${err.message || ""}`;
  }
}
