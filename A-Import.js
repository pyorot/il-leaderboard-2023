// data format/naming conventions:
// Data   = {levels, runs}
// levels = (see function body below)
// runs   = []player → { head: {name, note?, colour?, points?, l1?, 1?, 2?, 3?, v?, n?} ,
//                       body: []level → run}                                           }
// run    = {value, link, note, time, rank?, rankQuality?, points?}
///// values/notes/links are all text (null is "" in each case)
///// in exported data, runs is called body (for backwards compatibility; my bad)


// == DATA IMPORT ==

// imports data from api
function importData(sheet) {
  if (!sheet) {var sheet = SpreadsheetApp.openById(FILE_OUT_DATA).getSheetByName("JSONCache")}
  // function
  let shards = sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues()
  let {levels, players, body} = JSON.parse(shards.map(shard => shard[0] == "'" ? shard.slice(1) : shard).join(""))
  levels = {...levels, entries: [], cutoffs: []}
  let runs = players.names.map((_,p) => ({
    head: {name: players.names[p]},
    body: levels.names.map((_,l) => new Run(...body[l][p]))
  }))
  return {levels, runs} // format: Data
}


// == DATA GENERATION ==

// generates data from import sheets
function generateData(srcAddresses) {
  // for standalone calls
  if (!srcAddresses) {srcAddresses = SRC_ADDRESSES}
  // load
  let sources = importTables(...srcAddresses)
  let colours = importColours("A:A", ...srcAddresses)
  sources.forEach((_, i) => sources[i].assignColours(colours[i]))
  
  // generate levels from all tables and verify they're identical
  let levels
  for (let levelsImport of sources.map(generateLevels)) {
    let [str1, str2] = [JSON.stringify(levels?.names), JSON.stringify(levelsImport?.names)]
    if (levels && str1 != str2 ) {
      let text = `fatal level error: mismatch in imported level headers; compare:\n${str1}\n${str2}`
      LOG_ERROR.push(text); SHEET_DASH.getRange("C3").setValue(LOG_ERROR.join("\n")); throw text
    }
    levels = levelsImport
  }
  // generate runs and data + flatten
  let runs = sources.map(generateRuns).flat()
  let data = {levels, runs}

  // process players
  nameFix(data)                                             // correct names
  nameMerge(data)                                           // merge tables by name (overwrite ils)

  // return
  SHEET_DASH.getRange("A3:B3").setValues([[LOG_NAME_CHANGE.sort().join("\n"), LOG_TIME_REVERT.join("\n")]])
  console.log("generated data")
  return [data] // standard format: []Data
}


// sheet data imports now run using HTTP/REST (UrlFetchApp, Sheets API, API key)
// this is BY FAR the fastest method
// using SpreadsheetApp (native Google Apps Script) is slow for values and extremely slow for links
// using advanced SheetsAPI service (Google Apps Script) is also slow + unreliable
// create an API key on any Google account (needn't be script executor) at https://console.cloud.google.com/apis/
// these are always read-only, for public unauthenticated access (but they are still generated from Google accounts)
// OAuth2 Client IDs are slow + extremely laborious + unnecessary

// call with as many arguments as desired, each in the format {
//   id:    google spreadsheet id
//   tab:   name of (tab)
//   r,c:   row/column indices of first run in body (first col/row has index 0)
//   pAxis: "r" if players have rows, "c" if columns; levels is the other axis
// }
function importTables(...sheetInfo) {
  // url parameters
  let apiKey    = "AIzaSyBzIeBTJkfb_Prn6qMSELT8hFuOml26mhI"
  let fieldMask = "sheets.data.rowData.values(formattedValue,hyperlink,note)"   // selects data
  // http fetch
  let responses = UrlFetchApp.fetchAll(sheetInfo.map(item => 
    `https://sheets.googleapis.com/v4/spreadsheets/${item.id}?ranges=${item.tab}&fields=${fieldMask}&key=${apiKey}`
  ))
  let output = sheetInfo.map((tag,i) => new Source(tag.r, tag.c, tag.pAxis, JSON.parse(responses[i])))
  console.log(`fetched text; http codes: ${responses.map(r => r.getResponseCode()).join(", ")}`)
  return output
} // format: []Source


// fetching colours via the above would ×6 the data fetched so we'll use SpreadsheetApp for that separately
// this function is much slower than importTables lol
// this isn't guaranteed synced with the rest of the sheet data, but they're only colours, harmless if wrong
function importColours(rangeQuery, ...sheetInfo) {
  let output = sheetInfo.map((tag,i) =>
    SpreadsheetApp.openById(tag.id).getSheetByName(tag.tab).getRange(rangeQuery).getFontColorObjects().map(
      r => r.map(c => c.getColorType() == SpreadsheetApp.ColorType.RGB ? c.asRgbColor().asHexString() : "#000000")
      // what the fuck is this google? if someone sets a theme colour then you literally can't access it
      // not only that but the code fucking crashes if you try. hence the ColorType.RGB check. verbose af
    )
  )
  console.log(`fetched colours`)
  return output
}


function generateRuns(source) {
  return source.table.slice(source.rStart).map(row => ({
    head: { name: row[0].value, note: row[0].note, colour: row[0]?.colour },
    body: row.slice(source.cStart)
  }))
}


// converts raw data into runs, with parsed times
class Run {
  constructor(value, link, note) {
    this.value = value ?? ""
    this.link  = link  ?? ""
    this.note  = note  ?? ""
    this.time  = parseTime(value ?? "")
  }
  toString() {
    return `[${this.value?this.value:"/"} | ${this.link?this.link:"/"} | ${this.note?this.note.slice(0,10):"/"}]`
  }
}


// converts time string into number (in seconds)
const TIME_REGEX = /^(?!0)(?:(?:(\d?\d)\:(?=\d\d))?([0-5]?\d)\:(?=\d\d))?([0-5]?\d)\.(\d\d)$/
function parseTime(input) {
  // run regex, validate and convert values
  let matches = input.match(TIME_REGEX) // returns null or [fullMatch, hrs, mins, secs, centisecs]
  // return result in seconds
  if (matches) {
    for (let i=1; i<matches.length; i++) { matches[i] = matches[i] ? parseInt(matches[i]) : 0 }
    return parseInt(matches[1]*60*60 + matches[2]*60 + matches[3]) + matches[4]/100    
  } // else return undefined
}
// == regex explanation ==
/*
(?!0)				   // no leading zero
(?:            // optional minutes+hours block
	(?:          // optional hours block
		(\d?\d)		 // hours digits
		\:(?=\d\d) // : (only if two digits follow)
	)?
	([0-5]?\d)	 // mins digits
	\:(?=\d\d)	 // : (only if two digits follow)
)?
([0-5]?\d)		 // secs digits
\.			       // .
(\d\d)	       // centisecs digits
*/


// a source sheet + metadata
class Source {
  constructor(rStart, cStart, pAxis, apiData) {
    this.rStart = rStart    // row    number of first data (run) entry (first is 1)
    this.cStart = cStart    // column number of first data (run) entry (first is 1)
    this.pAxis  = pAxis     // "r" or "c" depending on which is player axis (other is level axis)
    this.table  = apiData.sheets[0].data[0].rowData.map(row => row.values?.map(  // whole table in [][]Run format
      cell => new Run(cell.formattedValue, cell.hyperlink, cell.note)
    ) ?? []) // row.values is undefined for empty rows
    // fill out table rows since otherwise they may not span table
    let width = Math.max(...(this.table.map(row => row.length)))
    this.table.forEach(row => row.push(...Array(width - row.length).fill(new Run())))
  }
  assignColours(colours) {
    for (let i = 0; i < Math.min(colours.length, this.table.length); i++) {
      for (let j = 0; j < Math.min(colours[i].length, this.table[i].length); j++) {
        this.table[i][j].colour = colours[i][j]
      }
    }
  }
}
