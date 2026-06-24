/**
 * Google Apps Script for Everlasting Memories Form
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://sheets.new and create a new spreadsheet
 * 2. Name the first sheet "Form Responses"
 * 3. Add these headers in row 1:
 *    Timestamp | Name | Email | Phone | Event Type | Event Date | Message
 * 4. Go to Extensions > Apps Script
 * 5. Delete the default myFunction() code
 * 6. Paste ALL of this code below
 * 7. Click Save (floppy disk icon), name it "EverlastingMemoriesForm"
 * 8. Click Deploy > New deployment
 * 9. Type: Web app
 * 10. Execute as: Me
 * 11. Who has access: Anyone
 * 12. Click Deploy
 * 13. Copy the Web App URL (looks like https://script.google.com/macros/s/.../exec)
 * 14. Send that URL to me and I'll update your site
 */

const SHEET_NAME = 'Form Responses';

function doPost(e) {
  // Handle CORS preflight
  if (e.parameter && e.parameter.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      newSheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Event Type', 'Event Date', 'Message']);
      return writeRow(newSheet, data);
    }
    
    return writeRow(sheet, data);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return handleCORS();
}

function writeRow(sheet, data) {
  const timestamp = new Date().toISOString();
  sheet.appendRow([
    timestamp,
    data.name || '',
    data.email || '',
    data.phone || '',
    data.event_type || '',
    data.event_date || '',
    data.message || ''
  ]);
  
  // Also send email notification
  const subject = 'New Quote Request - Everlasting Memories';
  const body = `
New form submission received:

Name: ${data.name || 'N/A'}
Email: ${data.email || 'N/A'}
Phone: ${data.phone || 'N/A'}
Event Type: ${data.event_type || 'N/A'}
Event Date: ${data.event_date || 'N/A'}
Message: ${data.message || 'N/A'}

Timestamp: ${timestamp}

View all responses: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
  `;
  
  MailApp.sendEmail('getclients001@gmail.com', subject, body);
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success', message: 'Form submitted successfully' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleCORS() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}
