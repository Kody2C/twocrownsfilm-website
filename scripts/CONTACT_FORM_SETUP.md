# Contact form → Google Sheet

## What you need

- A Google account
- This repo’s `.env` (local) and GitHub Actions secrets (production)

## Part A — Google Sheet + Apps Script

1. **Create a spreadsheet**  
   [Google Sheets](https://sheets.google.com) → Blank. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

2. **Open Apps Script**  
   From the sheet: **Extensions → Apps Script** (or [script.google.com](https://script.google.com) → New project).

3. **Replace** `Code.gs` with the contents of `scripts/google-apps-script/Code.gs` in this repo (copy–paste the whole file).

4. **Script properties**  
   Project **Settings** (gear) → **Script properties** → **Add script property**:
   - `SPREADSHEET_ID` = the ID from step 1  

   Optional (recommended for spam/abuse):  
   - `CONTACT_FORM_SECRET` = a long random string (same value you will use locally as `VITE_CONTACT_FORM_SECRET`).

5. **Create the header row**  
   In the Apps Script editor, select function **`setupSheet`** → **Run**.  
   Authorize the app when prompted.  
   Refresh the Sheet: you should see a tab **Contact** with column headers.

6. **Deploy as web app**  
   **Deploy → New deployment** → gear → **Web app**:
   - **Execute as:** Me  
   - **Who has access:** Anyone  

   **Deploy**, then **Copy** the **Web app URL** (it ends with `/exec`).

## Part B — Local site (Vite)

1. In the project root, copy `.env.example` to `.env` (or `.env.local`).

2. Set:
   ```env
   VITE_CONTACTS_WEB_APP_URL=https://script.google.com/macros/s/XXXX/exec
   ```
   Use your real `/exec` URL from step A.6.

3. Optional:
   ```env
   VITE_CONTACT_FORM_SECRET=the_same_string_as_CONTACT_FORM_SECRET
   ```

4. Run `npm run dev` and submit the form. A new row should appear on the **Contact** sheet.

## Part C — GitHub Pages (CI)

1. Repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_CONTACTS_WEB_APP_URL` = same web app URL  
   - Optional: `VITE_CONTACT_FORM_SECRET` = same secret as in Apps Script  

2. Push to `main`. The workflow injects these at **build** time so the live site can POST to Google.

## Troubleshooting

- **CORS / blocked request:** The site uses `fetch` with `no-cors` and `Content-Type: text/plain` so the browser does not send a JSON preflight (Google Apps Script does not return `Access-Control-Allow-Origin` for typical JSON POSTs). If you still see errors, confirm the deployment is **Anyone**, the URL ends with `/exec`, and check the Network tab that the POST reaches `script.google.com`.
- **Sheet not updating:** Re-run `setupSheet` once; check **Executions** in Apps Script for errors; confirm `SPREADSHEET_ID` is correct.
- **Empty `VITE_CONTACTS_WEB_APP_URL` in production:** Secrets must be set **before** the workflow run that builds the site; rebuild after adding secrets.
- **Old “Honeypot” column in the sheet:** New scripts only use five columns (Timestamp … Message). You can delete the extra **Honeypot** column in Google Sheets if you still have it from an earlier version. Paste the updated `Code.gs` into Apps Script and **Deploy** a new version so `appendRow` matches your headers.
