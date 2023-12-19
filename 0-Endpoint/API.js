// API endpoint: serve JSON from JSON export sheets at URLs that can be polled by HTTP
// set the sheet below, then deploy as WebApp and take note of URLs
// SMS (https://smsilview.netlify.app/ult) (API Sheet / JSONCache)
// https://script.google.com/macros/s/AKfycbz3ihGMcxM65F3tfhXq38V_tkVdiLLJ9aIUl2sYSWiKQVALD1QTaHOPBsIQQQukrjE8ow/exec

function pollData() {
  // parameter
  let sheet = SpreadsheetApp.openById(FILE_OUT_DATA).getSheetByName("JSONCache") // set for a given deployment
  // function
  let output = "".concat(...sheet.getRange(2,1,sheet.getLastRow(),1).getValues().map(row=>row[0]))
  console.log(`export data loaded: ${sheet.getName()}`)
  return output
}

// specially-named function exposing a Web App endpoint
function doGet() { return ContentService.createTextOutput(pollData()).setMimeType(ContentService.MimeType.JSON)}
