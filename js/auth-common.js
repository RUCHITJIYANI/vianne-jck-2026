const AUTH_STORAGE_KEY = "vianne_jck_request_id";

function getApprovedRequestId() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY);
}

function setApprovedRequestId(requestId) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, requestId);
}

function clearApprovedRequestId() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function generateAccessLines(count = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const lines = [];
  for (let n = 0; n < count; n++) {
    let part = "";
    for (let i = 0; i < 8; i++) {
      part += chars[Math.floor(Math.random() * chars.length)];
    }
    lines.push(part.slice(0, 4) + "-" + part.slice(4));
  }
  return lines;
}

function formatLinesForCopy(lines) {
  return lines.join("\n");
}

function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  return firebase.database();
}
