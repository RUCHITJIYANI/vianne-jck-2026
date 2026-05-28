/**
 * Vianne JCK 2026 — Daily backup to Google Sheets + Drive folder
 *
 * Setup: see GOOGLE-SHEETS-DAILY-BACKUP.md
 *
 * Script properties:
 *   FIREBASE_DB_URL  = https://vianne-jck-2026-default-rtdb.firebaseio.com
 *   PATH_PREFIX      = vianne-jck-2026-prod
 *   BACKUP_SECRET    = (optional) same as cloud-config.js googleSheetBackup.secret
 *   DRIVE_FOLDER_NAME = Vianne JCK 2026  (optional, this is the default)
 */

var DEFAULT_DRIVE_FOLDER = 'Vianne JCK 2026';

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

  var folder = getOrCreateDriveFolder_();
  ensureSpreadsheetInFolder_(ss, folder);
  saveCsvToDrive_(folder, history, users);
  ensureReadmeInFolder_(folder);

  SpreadsheetApp.flush();
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('BACKUP_SECRET') || '';
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'invalid json' });
  }
  if (secret && body.secret !== secret) {
    return jsonOut_({ ok: false, error: 'unauthorized' });
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

  var folder = getOrCreateDriveFolder_();
  ensureSpreadsheetInFolder_(ss, folder);
  saveCsvToDrive_(folder, history, users);

  return jsonOut_({ ok: true, rows: historyArr.length, folderUrl: folder.getUrl() });
}

function getOrCreateDriveFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderName = props.getProperty('DRIVE_FOLDER_NAME') || DEFAULT_DRIVE_FOLDER;
  var folderId = props.getProperty('DRIVE_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    var existing = folders.next();
    props.setProperty('DRIVE_FOLDER_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(folderName);
  props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function ensureSpreadsheetInFolder_(ss, folder) {
  var file = DriveApp.getFileById(ss.getId());
  var parents = file.getParents();
  var inFolder = false;
  while (parents.hasNext()) {
    if (parents.next().getId() === folder.getId()) inFolder = true;
  }
  if (!inFolder) folder.addFile(file);
  try {
    var root = DriveApp.getRootFolder();
    if (root.getId() !== folder.getId()) root.removeFile(file);
  } catch (e) {}
}

function saveCsvToDrive_(folder, historyObj, users) {
  var tz = Session.getScriptTimeZone();
  var dateStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var csv = buildFullCsv_(historyObj, users);
  var name = 'VianneJCK_Backup_' + dateStr + '.csv';
  trashFilesByName_(folder, name);
  folder.createFile(name, csv, MimeType.CSV);
}

function buildFullCsv_(historyObj, users) {
  var lines = [];
  lines.push('=== SEARCHES ===');
  lines.push('Date,Time,Code,Style,Design,Collection,Metal,Customer,Price,Method,User,User Name,Role');
  var list = Object.keys(historyObj || {}).map(function (k) { return historyObj[k]; });
  list.sort(function (a, b) { return (b.ts || '').localeCompare(a.ts || ''); });
  list.forEach(function (e) {
    if (!e) return;
    var d = e.ts ? new Date(e.ts) : new Date();
    lines.push([
      csvCell_(Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd')),
      csvCell_(Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm:ss')),
      csvCell_(e.code), csvCell_(e.style), csvCell_(e.design), csvCell_(e.col),
      csvCell_(e.kt), csvCell_(e.cust), csvCell_(e.price), csvCell_(e.method),
      csvCell_(e.user), csvCell_(e.userName), csvCell_(e.userRole)
    ].join(','));
  });
  lines.push('');
  lines.push('=== USERS (no passwords) ===');
  lines.push('Name,Username,Role,Active');
  (Array.isArray(users) ? users : []).forEach(function (u) {
    lines.push([csvCell_(u.n), csvCell_(u.u), csvCell_(u.r), csvCell_(u.active ? 'Yes' : 'No')].join(','));
  });
  lines.push('');
  lines.push('Exported,' + new Date().toISOString());
  return lines.join('\n');
}

function csvCell_(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}

function trashFilesByName_(folder, name) {
  var files = folder.getFilesByName(name);
  while (files.hasNext()) files.next().setTrashed(true);
}

function ensureReadmeInFolder_(folder) {
  var name = 'README — Vianne JCK 2026.txt';
  if (folder.getFilesByName(name).hasNext()) return;
  var text = [
    'Vianne JCK 2026 — Data folder',
    '',
    'This folder is updated automatically every night from the jewelry lookup app.',
    '',
    'Files:',
    '  • Vianne JCK 2026 — Daily Backup (Google Sheet) — live tabs + summary',
    '  • VianneJCK_Backup_YYYY-MM-DD.csv — daily Excel-ready export',
    '',
    'Live data (real-time): Firebase Console',
    '  https://console.firebase.google.com/project/vianne-jck-2026/database',
    '',
    'App: https://ruchitjiyani.github.io/vianne-jck-2026/'
  ].join('\n');
  folder.createFile(name, text, MimeType.PLAIN_TEXT);
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
  sh.getRange(1, 1, 7, 2).setValues([
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

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once: sets daily trigger ~11pm */
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

/** Run once after setup — creates folder + README, prints folder URL in logs */
function setupDriveFolder() {
  var folder = getOrCreateDriveFolder_();
  ensureReadmeInFolder_(folder);
  Logger.log('Drive folder ready: ' + folder.getUrl());
}
