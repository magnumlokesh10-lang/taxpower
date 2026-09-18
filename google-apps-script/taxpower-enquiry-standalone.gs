/**
 * TaxPower – Demo / Enquiry form backend (STANDALONE version)
 *
 * Ye version Sheet ke andar nahi, aapke Google account mein alag project ke
 * roop mein save hota hai — Sheet band karne ya delete karne par bhi ye
 * script kabhi nahi hatega.
 *
 * SETUP (sirf ek baar):
 *  1. Browser mein kholein: https://script.google.com  (magnumlokesh10@gmail.com se login)
 *  2. Top-left "New project" (+) par click karein.
 *  3. Code.gs ka purana content delete karke YE PURA FILE paste karein, Save (Ctrl+S).
 *  4. Neeche SHEET_ID mein apni Google Sheet ki ID paste karein
 *     (Sheet ke URL se: docs.google.com/spreadsheets/d/YE_WALA_HISSA/edit).
 *  5. Deploy -> New deployment -> type "Web app"
 *       Execute as: Me
 *       Who has access: Anyone
 *     Copy karein naya /exec URL.
 *  6. Wo URL mujhe (Lokesh ko) bhej dein ya public/js/form-backend.js mein
 *     TAXPOWER_FORM_ENDPOINT mein paste kar dein.
 *
 * CallMeBot WhatsApp API key: WhatsApp par +34 644 51 95 23 ko
 * "I allow callmebot to send me messages" bhejein — reply mein apikey milegi,
 * neeche WHATSAPP_APIKEY mein paste karein.
 */

// >>> Sheet URL se ID yahan paste karein <<<
var SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';

var SHEET_NAME = 'Enquiries';
var NOTIFY_EMAIL = 'magnumlokesh10@gmail.com';
var WHATSAPP_PHONE = '918080631102';          // country code + number, no +
var WHATSAPP_APIKEY = 'PASTE_YOUR_CALLMEBOT_APIKEY';

var FIELDS = [
  ['submittedAt', 'Submitted At'],
  ['name', 'Full Name'],
  ['company', 'Company'],
  ['mobile', 'Mobile'],
  ['email', 'Email'],
  ['gstin', 'GSTIN'],
  ['address', 'Address'],
  ['city', 'City'],
  ['state', 'State'],
  ['product', 'Products'],
  ['purpose', 'Purpose'],
  ['page', 'Page URL']
];

function doPost(e) {
  try {
    var data = parseRequest(e);
    if (!data.submittedAt) {
      data.submittedAt = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MM-yyyy HH:mm:ss');
    }

    saveToSheet(data);
    sendEmailAlert(data);
    sendWhatsAppAlert(data);

    return jsonOut({ result: 'success' });
  } catch (err) {
    return jsonOut({ result: 'error', message: String(err) });
  }
}

function doGet() {
  return jsonOut({ result: 'ok', message: 'TaxPower enquiry endpoint is live.' });
}

function parseRequest(e) {
  var data = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) { data[key] = e.parameter[key]; });
  }
  if (e && e.postData && e.postData.type === 'application/json' && e.postData.contents) {
    var json = JSON.parse(e.postData.contents);
    Object.keys(json).forEach(function (key) { data[key] = json[key]; });
  }
  return data;
}

function saveToSheet(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS.map(function (f) { return f[1]; }));
    sheet.getRange(1, 1, 1, FIELDS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow(FIELDS.map(function (f) { return data[f[0]] || ''; }));
}

function sendEmailAlert(data) {
  var lines = FIELDS.map(function (f) {
    return '<tr><td style="padding:6px 12px;font-weight:bold;">' + f[1] +
      '</td><td style="padding:6px 12px;">' + escapeHtml(data[f[0]] || '-') + '</td></tr>';
  }).join('');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New TaxPower Enquiry: ' + (data.name || 'Unknown') + ' (' + (data.company || '-') + ')',
    htmlBody: '<h2 style="font-family:Arial">New enquiry from the TaxPower website</h2>' +
      '<table style="font-family:Arial;font-size:14px;border-collapse:collapse;">' + lines + '</table>'
  });
}

function sendWhatsAppAlert(data) {
  if (!WHATSAPP_APIKEY || WHATSAPP_APIKEY.indexOf('PASTE') === 0) return;

  var text = 'New TaxPower Enquiry\n' + FIELDS.map(function (f) {
    return f[1] + ': ' + (data[f[0]] || '-');
  }).join('\n');

  var url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(WHATSAPP_PHONE) +
    '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(WHATSAPP_APIKEY);

  UrlFetchApp.fetch(url, { muteHttpExceptions: true });
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function jsonOut(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
