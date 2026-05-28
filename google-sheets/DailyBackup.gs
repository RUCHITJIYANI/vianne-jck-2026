/**
 * Vianne JCK 2026 — Daily backup to Google Sheets
 *
 * Setup: see GOOGLE-SHEETS-DAILY-BACKUP.md in the repo root.
 *
 * Script properties (Project settings → Script properties):
 *   FIREBASE_DB_URL  = https://vianne-jck-2026-default-rtdb.firebaseio.com
 *   PATH_PREFIX      = vianne-jck-2026-prod
 *   BACKUP_SECRET    = (optional) same as cloud-config.js googleSheetBackup.secret
 */

function dailyBackupFromFirebase() {
  var props = PropertiesService.getScriptProperties();
  var dbUrl = props.getProperty('FIREBASE_DB_URL');
  var prefix = props.getProperty('PATH_PREFIX') || 'vianne-jck-2026-prod';
  if (!dbUrl) throw new Error('Set FIREBASE_DB_URL in Script properties');

  var base = dbUrl.replace(/\/$/, '') + '/' + prefix;
  var history = fetchJson_(base + '/history.json') || {};
  var users = fetchJson_(base + '/users.json') || [];
  var meta = fetchJson_(base + '/meta.json') || {};

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeHistorySheet_(ss, history);
  writeUsersSheet_(ss, users);
  writeSummarySheet_(ss, history, users, meta);
  writeLogSheet_(ss, 'firebase-daily', Object.keys(history).length);

  SpreadsheetApp.flush();
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('BACKUP_SECRET') || '';
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'invalid json' }, 400);
  }
  if (secret && body.secret !== secret) {
    return jsonOut_({ ok: false, error: 'unauthorized' }, 403);
  }

  var historyArr = body.history || [];
  var history = {};
  historyArr.forEach(function (row) {
    if (row && row.id) history[String(row.id)] = row;
  });
  var users = body.users || [];

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeHistorySheet_(ss, history);
  writeUsersSheet_(ss, users);
  writeSummarySheet_(ss, history, users, { updatedAt: body.exportedAt || new Date().toISOString() });
  writeLogSheet_(ss, 'app-push', historyArr.length);

  return jsonOut_({ ok: true, rows: historyArr.length });
}

function fetchJson_(url) {
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() >= 400) return null;
  var text = resp.getContentText();
  if (!text || text === 'null') return null;
  return JSON.parse(text);
}

function writeHistorySheet_(ss, historyObj) {
  var name = 'Searches';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  var headers = [
    'Date', 'Time', 'Code', 'Style', 'Design', 'Collection', 'Metal',
    'Customer', 'Price', 'Method', 'User', 'User Name', 'Role'
  ];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  var rows = [];
  var list = Object.keys(historyObj || {}).map(function (k) { return historyObj[k]; });
  list.sort(function (a, b) { return (b.ts || '').localeCompare(a.ts || ''); });
  list.forEach(function (e) {
    if (!e) return;
    var d = e.ts ? new Date(e.ts) : new Date();
    rows.push([
      Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm:ss'),
      e.code || '', e.style || '', e.design || '', e.col || '', e.kt || '',
      e.cust || '', e.price != null ? e.price : '', e.method || '',
      e.user || '', e.userName || '', e.userRole || ''
    ]);
  });
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

function writeUsersSheet_(ss, users) {
  var name = 'Users';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  var headers = ['Name', 'Username', 'Role', 'Active'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  var arr = Array.isArray(users) ? users : [];
  var rows = arr.map(function (u) {
    return [u.n || '', u.u || '', u.r || '', u.active ? 'Yes' : 'No'];
  });
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
}

function writeSummarySheet_(ss, historyObj, users, meta) {
  var name = 'Summary';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  var list = Object.keys(historyObj || {}).map(function (k) { return historyObj[k]; });
  var codes = {}, custs = {}, scans = 0;
  list.forEach(function (e) {
    if (!e) return;
    if (e.code) codes[e.code] = 1;
    if (e.cust) custs[e.cust] = 1;
    if (e.method === 'scan') scans++;
  });
  var uarr = Array.isArray(users) ? users : [];
  sh.getRange(1, 1, 6, 2).setValues([
    ['Backup time', new Date()],
    ['Cloud meta', (meta && meta.updatedAt) || ''],
    ['Total searches', list.length],
    ['Unique items', Object.keys(codes).length],
    ['Unique customers', Object.keys(custs).length],
    ['QR scans', scans],
    ['Active users', uarr.filter(function (u) { return u.active; }).length]
  ]);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold');
}

function writeLogSheet_(ss, source, rowCount) {
  var name = 'Backup_Log';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 4).setValues([['When', 'Source', 'Rows', 'Spreadsheet']]).setFontWeight('bold');
  }
  sh.appendRow([new Date(), source, rowCount, ss.getUrl()]);
}

function jsonOut_(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  return out;
}

/** Run once: Triggers → Add → Time-driven → Day timer → 11pm–midnight */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyBackupFromFirebase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyBackupFromFirebase')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();
}
