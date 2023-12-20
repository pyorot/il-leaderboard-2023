// API endpoint: serve JSON from JSON export sheets at URLs that can be polled by HTTP
// set the sheet below, then deploy as WebApp and take note of URLs
// SM64 Ult (https://sm64--smsilview.netlify.app/ult) (this sheet / DataStrats)
// https://script.google.com/macros/s/AKfycbzXptfe9DjPP7ouDcLFBkYKm0Fg229CMbkUbCupw8IDmZE5Bckmju5JST9zhJaszBWYoQ/exec
// SM64 Il  (https://sm64--smsilview.netlify.app/il)  (this sheet / DataLevels)
// https://script.google.com/macros/s/AKfycbwIJHLK0Ybt0bHSMy-gEl05jqUVg4OKAVg1PiSMHdTP5WOjQdtfJHjvd0ucc9wfYbpebw/exec

function pollData() {
  // parameter
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DataStrats") // set for a given deployment
  // function
  let output = "".concat(...sheet.getRange(2,1,sheet.getLastRow(),1).getValues().map(row=>row[0]))
  console.log(`export data loaded: ${sheet.getName()}`)
  return output
}

// specially-named function exposing a Web App endpoint
function doGet() { return ContentService.createTextOutput(pollData()).setMimeType(ContentService.MimeType.JSON)}
