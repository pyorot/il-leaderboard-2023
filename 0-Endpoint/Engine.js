// engine endpoint: functions to import/process/export data
// can be run from here or connected to trigger

// timer trigger
function tick() {
  let thisUpdated = new Date(SHEET_DASH.getRange("C1").getDisplayValue().replace(" ", "T").concat("Z")) // ISO format
  console.log(`update last run:    ${thisUpdated.toUTCString()}`)
  let srcUpdated = SRC_ADDRESSES.filter(t => t.id != FILE_THIS).map(t => DriveApp.getFileById(t.id).getLastUpdated())
  srcUpdated.forEach(date => console.log(`source last edited: ${date.toUTCString()}`))
  let lastSourceUpdated = Math.max(...srcUpdated.map(date => date.getTime()))
  let stale = thisUpdated < new Date(lastSourceUpdated + 3*60000)   // 3 min leeway
  if (stale || SHEET_DASH.getRange("A1").getValue() == "[updating]") {
    update()
  }
}


// full update routine
function update() {
  var lock = LockService.getScriptLock(); lock.waitLock(180000); console.log("locked")
  // A | import
  let datas = generateData(SRC_ADDRESSES)
  // B | process
  annotate(datas[0], "points") // annotate sms data for verification + sheet export
  SHEET_DASH.getRange("A1").setValue("[updating]")
  detect(datas[0]) // il verification (sms only)
  // C | export
  for (let dst of DST_ADDRESSES) {
    let ss = dst.id == "this" ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(dst.id)
    switch (dst.type) {
      case "data":  exportData (datas[dst.index], ss.getSheetByName(dst.tab))                         ; break
      case "table": exportTable(datas[dst.index], ss.getSheetByName(dst.tab), dst.r, dst.c, dst.score); break
    }
  }
  // dashboard logging
  if (SHEET_DASH.getRange("C3").getValue().substring(0,5) == "fatal") { SHEET_DASH.getRange("C3").clear() }
  SHEET_DASH.getRange("C1").setValue(new Date().toISOString().replace('T',' ').split('.')[0])
  SHEET_DASH.getRange("A1").setValue("Dashboard")
  lock.releaseLock()
}
