ANON = {}       // names to be redacted in exports
ABUSE_PAGE = "" // link to abuse documentation

// prints pretty table
// this can no longer use rtvs cos they're missing from the source table reads,
// current workaround: links are set using range.setFormula("=HYPERLINK(url,text)")
function exportTable(data, sheet, rStart, cStart, displayScore) {
  // for standalone calls
  if (!data) {
    var data = importData(SpreadsheetApp.openById(FILE_OUT_DATA).getSheetByName("JSONCache"))
    annotate(data,"points")
  }
  if (!sheet) {var sheet = SpreadsheetApp.openById(FILE_OUT_TABLE).getSheetByName("SMS Accurate")}
  if (!rStart && !cStart) {var [rStart, cStart] = [4, 7] }

  // parameters
  let P_START = rStart+1; let L_START = cStart+1  // legacy code; P_START/L_START are row/col numbers not indices
  let colourMedal = [null, '#e8b600', '#999999', '#b35c00'] // indexed by rank
  let colourError = '#ff0000'
  let borderStyle = SpreadsheetApp.BorderStyle.SOLID_MEDIUM

  // function
  let {levels, runs} = data
  let L = levels.names.length
  let [headValues, bodyFormulas, notes, colours] = [[], [], [], []]
  for (let [p, _] of runs.entries()) {
    let [head,body] = [runs[p].head, runs[p].body]
    headValues.push([ head.name, head[displayScore], head[1], head[2], head[3], head.v, head.n ])
    bodyFormulas.push([])
    if (head.name in ANON) { head.note =
      `(${ANON[head.name]}). This name has been hidden per the abuse policy; visit ${ABUSE_PAGE} to find out why and for more on the policy.`
    }
    notes.push([head.note])
    colours.push([head.colour])
    for (let l = 0; l < L; l++) {
      notes[p][l + L_START - 1] = body[l].note
      bodyFormulas[p][l] = body[l].link ? `=HYPERLINK("${body[l].link}","${body[l].value}")` : `"${body[l].value}"`
      colours[p][l + L_START - 1] = [1,2,3].includes(body[l].rank) ? colourMedal[body[l].rank] // medal colour
                                  : ((body[l].value && !body[l].time) ? colourError : null)    // error colour
    }
  }
  let bolds = colours.map(row => row.map(x => x ? "bold" : null))
  for (let row of colours) { for (let i of [1,2,3]) { row[i+1] = colourMedal[i] } } // medal colours
  for (let row of bolds) { for (let i of [0,1,2,3,4,6]) { row[i] = "bold" } }        // head bolds

  let P = runs.length
  // sheet.getRange(1, L_START, 1, L).setValues([levels.codes]) // set levels to 1st row (enable for sm64)
  let rangeFull = sheet.getRange(P_START, 1, P, L_START + L - 1)
  let rangeHead = sheet.getRange(P_START, 1, P, L_START - 1)
  let rangeBody = sheet.getRange(P_START, L_START, P, L)
  rangeFull.clear().clearFormat()
  rangeHead.setValues(headValues)
  rangeBody.setFormulas(bodyFormulas)
  rangeFull.setNotes(notes).setFontColors(colours).setFontWeights(bolds).setFontStyle(null).setFontLine(null)
  rangeFull.setVerticalAlignment("middle").setHorizontalAlignment("center").setFontSize(9).setFontFamily("Arial")
  sheet.getRange(P_START,1,P,1).setHorizontalAlignment("right")
  sheet.getRange(P_START,6,P,1).setFontStyle("italic")
  sheet.getRange(4, L_START, 1, L).setValues([levels.cutoffs]) // set cutoffs to 4th row (enable for sms)
  for (let p = 0; p < P; p++) { for (let l = 0; l < L; l++) { if (runs[p].body[l].rank == 1) { // border highlights
    rangeBody.getCell(p+1, l+1).setBorder(null,null,true,null,false,false,"black",borderStyle)
  }}}
  try {sheet.deleteRows(P_START + P, sheet.getMaxRows() - (P_START + P - 1))} catch(e) {} // prune empty rows
  console.log(`exported table to ${sheet.getName()}`)
}


// saves data to data api sheet
function exportData(data, sheet) {
  // for standalone calls: regenerate data (cos pointless to load from api and store back to api)
  if (!data) {var data = generateData()[0]}
  if (!sheet) {var sheet = SpreadsheetApp.openById(FILE_OUT_DATA).getSheetByName("JSONCache")}

  // function
  // generate export data
  let {levels, runs} = data
  let {entries, cutoffs, ...levelExport} = levels // remove entries and cutoffs from level before export
  let dataExport = {
    levels:  levelExport,
    players: {names: runs.map(row => row.head.name), anon: ANON, anonHTML: genAnonHTML()},
    body:    levels.names.map((_,l) => runs.map(row => [row.body[l].value, row.body[l].link, row.body[l].note])),
  }
  let dataString = JSON.stringify(dataExport)
  // shard data
  let dataStringShards = []
  const shardSize = 50000 - 1 // cell char limit 50000, 1 for added ' below
  for (let i = 0; i < Math.ceil(dataString.length/shardSize); i++) {
    let shard = "'" + dataString.substring(i*shardSize, (i+1)*shardSize) // ' prevents interpretation as formula
    dataStringShards.push([shard])
  }
  // print data to api sheet
  if (sheet.getLastRow() >= 2) { sheet.getRange(2,1,sheet.getLastRow()-1,1).clear() }
  sheet.getRange(2,1,dataStringShards.length,1).setValues(dataStringShards)
  console.log(`exported data to ${sheet.getName()}`)
}


// used to generate players.anonHTML (information about anonymisation for the settings tab of the viewer app)
function genAnonHTML() { return `
  <p><b>Hidden names</b>: Some player names are hidden by default (to an initial followed by a period, like <code>A.</code>) for abuse-related reasons. This leaderboard provides full data about all known speedrun records, and so has the option to show these names, but it is considered important for readers to be informed of why these names were hidden before using this option. Please click <a href="${ABUSE_PAGE}">here</a> for this info and more on the abuse policy.</p>
`}
