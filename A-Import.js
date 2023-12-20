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
  // for standalone calls
  if (!sheet) {var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DataLevels")}
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

// return type: []Data; provide custom genLevels and genPlayers functions
// a levelIndex/playerIndex specifies a canonical ordering (via index in the array) of levels/players,
// and links each index to an object specifying the indices in the source tables of the level/player
// levelIndices/playerIndices are arrays of these, one for each output data unit
function generateData(srcAddresses) {
  // for standalone calls
  if (!srcAddresses) {srcAddresses = SRC_ADDRESSES}

  // function
  let sources  = importTables(...srcAddresses)    // fetches sources, return type []Source
  let lIndices = genLevels(sources)               // generates level header,  return type []{name, code, index: []}
  let pIndices = genPlayers(sources)              // generates player header, return type []{name, index: []}
  let datas    = lIndices.map((_,i) => compileData(sources, lIndices[i], pIndices[i])) // packs Data
  console.log("generated data")
  return datas // format: []Data
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


function compileData(sources, levelIndex, playerIndex) {
  // create runs tables from raw tables + level and player indices
  let runs = playerIndex.map(player => levelIndex.map(level => {
    let group = []  // a group of all runs with same player and level
    for (let [j, source] of sources.entries()) {
      let lArr = level.index[j]; if (typeof lArr == "number") {lArr = [lArr]} else if (!lArr) {lArr = []}
      if (typeof l == "number") {l = [level.index[j]]}   // l is now always an array of indices
      let p = player.index[j]
      if (player.index[j] >= 0) {
        switch (source.pAxis) {
          case "r": group.push(...lArr.map(l => source.table[source.rStart + p][source.cStart + l])); break
          case "c": group.push(...lArr.map(l => source.table[source.rStart + l][source.cStart + p])); break
        }
      }
    }
    // merge runs, selecting best one; a blank one is created if all are invalid
    return group.reduce(REDUCE_FUNCTION, new Run())
  }))

  let levels = {
    names:      levelIndex.map(level => level.name),
    indices:    Object.fromEntries(levelIndex.map((level,l)=>[level.name,l])),
    reversed:   levelIndex.map(_ => false),
    codes:      levelIndex.map(level => level.code),
    entries:    [], cutoffs: [],                              // computed later as part of processing
  }
  levels = Object.assign(levels, genLevelMetadata(levels.codes))
  return {levels: levels, runs: runs.map((row,p) => ({head: {name: playerIndex[p].name}, body: row}))}
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
}
