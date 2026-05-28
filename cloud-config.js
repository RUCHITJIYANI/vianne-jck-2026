window.VIANNE_CLOUD_CONFIG = {
  enabled: true,

  appName: "vianne-jck-cloud",
  pathPrefix: "vianne-jck-2026-prod",

  // Optional: daily / on-demand backup to Google Sheets (see GOOGLE-SHEETS-DAILY-BACKUP.md)
  googleSheetBackup: {
    enabled: false,
    webAppUrl: "",
    secret: ""
  },

  firebaseConfig: {
    apiKey: "AIzaSyCmdgFnglJvzZ43iPAS65LevUOjKY714Wc",
    authDomain: "vianne-jck-2026.firebaseapp.com",
    databaseURL: "https://vianne-jck-2026-default-rtdb.firebaseio.com",
    projectId: "vianne-jck-2026",
    storageBucket: "vianne-jck-2026.firebasestorage.app",
    messagingSenderId: "617616841848",
    appId: "1:617616841848:web:69a622927cf894584fa18d"
  }
};
