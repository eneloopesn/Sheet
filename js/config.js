/**
 * Firebase 設定（跨裝置共用訂單必填）
 *
 * 設定步驟見 README.md
 * 把下方物件改成 Firebase 主控台複製的設定即可。
 * databaseURL 必填（Realtime Database）。
 */
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "https://console.firebase.google.com/project/project-5284780330097518053/database/project-5284780330097518053-default-rtdb/data/~2F",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/** 是否已填好可用的雲端設定 */
function isCloudConfigured() {
  return Boolean(
    FIREBASE_CONFIG &&
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.databaseURL && 
      !String(FIREBASE_CONFIG.apiKey).includes("請填")
  );
}
