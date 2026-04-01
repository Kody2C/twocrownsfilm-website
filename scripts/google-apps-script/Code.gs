/**
 * Two Crowns Film — contact form → Google Sheet
 *
 * 1. Create a Google Sheet. Copy its ID from the URL:
 *    https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
 * 2. In Apps Script: Project Settings → Script properties → Add:
 *    - SPREADSHEET_ID = your sheet ID
 *    - (optional) CONTACT_FORM_SECRET = same string you put in VITE_CONTACT_FORM_SECRET
 * 3. Run setupSheet() once from the editor (select function → Run) to create headers.
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL (ends in /exec) into .env as VITE_CONTACTS_WEB_APP_URL
 */

var SHEET_NAME = "Contact";

function setupSheet() {
  var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) {
    throw new Error("Set Script property SPREADSHEET_ID to your Google Sheet ID.");
  }
  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Email",
      "Project type",
      "Message",
    ]);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse({ ok: false, error: "busy" });
  }

  try {
    var payload = parsePayload(e);
    if (!payload) {
      return jsonResponse({ ok: false, error: "invalid" });
    }

    // Honeypot filled = likely bot — pretend success, do not store
    if (payload.website && String(payload.website).trim() !== "") {
      return jsonResponse({ ok: true });
    }

    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("CONTACT_FORM_SECRET");
    if (expected && String(expected).length > 0) {
      if (payload.secret !== expected) {
        return jsonResponse({ ok: false, error: "unauthorized" });
      }
    }

    var id = props.getProperty("SPREADSHEET_ID");
    if (!id) {
      return jsonResponse({ ok: false, error: "missing_spreadsheet_id" });
    }

    var ss = SpreadsheetApp.openById(id);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    sheet.appendRow([
      new Date(),
      String(payload.name || "").trim(),
      String(payload.email || "").trim(),
      String(payload.type || "").trim(),
      String(payload.message || "").trim(),
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function parsePayload(e) {
  var raw = e.postData && e.postData.contents;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (ignore) {
      return null;
    }
  }
  if (e.parameter) {
    return {
      name: e.parameter.name,
      email: e.parameter.email,
      type: e.parameter.type,
      message: e.parameter.message,
      website: e.parameter.website,
      secret: e.parameter.secret,
    };
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Optional: open the web app URL in a browser to confirm deployment responds. */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, hint: "POST JSON to submit the contact form." }),
  ).setMimeType(ContentService.MimeType.JSON);
}
