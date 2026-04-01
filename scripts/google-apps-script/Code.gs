/**
 * Two Crowns Film — contact form → Google Sheet
 *
 * 1. Create a Google Sheet. Copy its ID from the URL:
 *    https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
 * 2. In Apps Script: Project Settings → Script properties → Add:
 *    - SPREADSHEET_ID = your sheet ID
 *    - (optional) CONTACT_FORM_SECRET = same string you put in VITE_CONTACT_FORM_SECRET
 *    - (optional) NOTIFY_EMAIL = address to receive an email on each new submission (e.g. Kody)
 *    - (optional) NOTIFY_FROM_NAME = display name on the notification (e.g. "Kody — Two Crowns Film").
 *      The actual From address is always the Google account that deploys the web app (Execute as: Me).
 *      To show kody@… as From, that account must own the deployment (or use Gmail "Send mail as" / Workspace).
 * 3. Run setupSheet() once from the editor (select function → Run) to create headers.
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL (ends in /exec) into .env as VITE_CONTACTS_WEB_APP_URL
 *
 * Debugging: "Cloud logs" is often greyed out unless you link a Google Cloud project.
 * Use testNotifyEmail() from the editor + View → Logs, or expand an Execution row and
 * look for an in-page log / transcript (not Cloud).
 */

var SHEET_NAME = "Contact";

/** Writes to both Logger (editor: View → Logs) and console (Cloud Logging when enabled). */
function logNotify(msg) {
  Logger.log(msg);
  console.log(msg);
}

function logNotifyError(msg) {
  Logger.log(msg);
  console.error(msg);
}

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

    try {
      notifyNewSubmission(payload);
    } catch (notifyErr) {
      // Row is saved; do not fail the HTTP response if mail quota or send fails
      logNotifyError(
        "notify: MailApp failed — " +
          (notifyErr && notifyErr.message ? notifyErr.message : String(notifyErr)),
      );
    }

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

/**
 * Optional: NOTIFY_EMAIL receives one notification per submission.
 * The submitter is NOT cc'd; replyTo is set to their address so you can reply in one click.
 * Sender "From" = deployer's Google account; optional NOTIFY_FROM_NAME sets the friendly name only.
 */
function notifyNewSubmission(payload) {
  var to = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
  if (!to || String(to).trim() === "") {
    logNotify(
      "notify: skipped — set Script property NOTIFY_EMAIL to enable notification emails.",
    );
    return;
  }
  to = String(to).trim();

  var name = String(payload.name || "").trim();
  var email = String(payload.email || "").trim();
  var type = String(payload.type || "").trim();
  var message = String(payload.message || "").trim();

  var subject = "New Two Crowns contact" + (name ? ": " + name : "");
  var body =
    "New contact form submission (row added to Sheet)\n\n" +
    "Name: " +
    name +
    "\n" +
    "Email: " +
    email +
    "\n" +
    "Project type: " +
    type +
    "\n\n" +
    "Message:\n" +
    message;

  var options = {};
  var fromName = PropertiesService.getScriptProperties().getProperty("NOTIFY_FROM_NAME");
  if (fromName && String(fromName).trim() !== "") {
    options.name = String(fromName).trim();
  }
  if (email.indexOf("@") !== -1) {
    options.replyTo = email;
  }
  logNotify("notify: sending MailApp email to " + to);
  MailApp.sendEmail(to, subject, body, options);
  logNotify("notify: MailApp.sendEmail finished OK");
}

/**
 * Run from the editor: choose testNotifyEmail → Run. Then View → Logs (or Ctrl+Enter).
 * Confirms NOTIFY_EMAIL + MailApp without using the website. Cloud Logging not required.
 */
function testNotifyEmail() {
  notifyNewSubmission({
    name: "Apps Script test",
    email: "test@example.com",
    type: "Other",
    message: "If you receive this email, MailApp and NOTIFY_EMAIL are working.",
  });
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
