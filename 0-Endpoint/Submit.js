function submit(e) {
  let SHEET_USERS = {id: "1c5dAcjdofMc1Ux2rOP00vJWtVPQpqr3Eq5X2Lr3EvOQ", tab: "Users"}
  let SHEET_ILS   = {id: "1Ibq5m31pU1ZVfh4Dlo2r2Mnmk3WBiZwt6lja5bZSE1Q", tab: "ILs"  }

  // get user
  let submission = e.namedValues
  let sheetUsers = SpreadsheetApp.openById(SHEET_USERS.id).getSheetByName(SHEET_USERS.tab)
  let userTable = sheetUsers.getRange(1, 1, sheetUsers.getLastRow(), 2).getDisplayValues()
  let [userDict, userList] = [Object.fromEntries(userTable), userTable.map(row => row[1])]
  let email = submission["Email Address"][0]
  let name = userDict[email]
  if (!name) {
    let requestedName = submission["Registration Name"][0]
    if (requestedName && !userList.includes(requestedName)) {
      name = requestedName                                                                // accept name
      sheetUsers.getRange(sheetUsers.getLastRow()+1, 1, 1, 2).setValues([[email, name]])  // register name
      console.log(`registered new player "${name}"`)
    } else {
      LOG_ERROR = `Unknown user ${email} submitted an IL with invalid reg. name: ${JSON.stringify(submission)}`
      SHEET_DASH.getRange("C3").setValue(LOG_ERROR)
      console.log(`submit failed: unknown user ${email} (registration name: "${requestedName}")`)
      return
    }
  }
  console.log(`user: ${name} @ ${email}`)

  // validate time
  console.log(`submission: ${JSON.stringify(submission)}`)
  let levelCode = submission["Level Code"][0]
  let [time, link, note] = [submission["Time"][0].match(/"(.+)"/)?.[1], submission["Link"][0], submission["Note"][0]]
  if (time && !parseTime(time)) {console.log(`submit failed: invalid time "${time}"`); return}
  
  // get player + level
  let sheetILs = SpreadsheetApp.openById(SHEET_ILS.id).getSheetByName(SHEET_ILS.tab)
  let players = sheetILs.getRange(1, 1, sheetILs.getLastRow(), 1).getDisplayValues().map(row=>row[0]?.toLowerCase())
  let levels  = sheetILs.getRange(4, 1, 1, sheetILs.getLastColumn()).getDisplayValues()[0]
  let [r, c] = [players.indexOf(name.toLowerCase()), levels.indexOf(levelCode)]
  let newPlayer
  if (c != -1 && r == -1) { // valid level yet player not found
    r = sheetILs.getLastRow(); newPlayer = true
  }
  console.log(`cell: (${r}${newPlayer? " (new)" : ""}, ${c})`)
  if (c == -1) {console.log(`submit failed: invalid level "${levelCode}"`); return}

  // update cell
  if (newPlayer) {sheetILs.getRange(r+1, 1).setValue(name)}
  let rtv = SpreadsheetApp.newRichTextValue().setText(time ?? "")
  if (link) {rtv.setLinkUrl(link)}
  sheetILs.getRange(r+1, c+1).setFontLine(null).setFontColor("black").setRichTextValue(rtv.build()).setNote(note)
  SpreadsheetApp.flush()
  console.log(`submit succeeded`)

  update()
}
