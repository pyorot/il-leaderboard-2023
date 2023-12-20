SM64_ALIAS = {}

// input format: []Source
// output format: []PlayerHeader (index of output data block → player header of output data block)
// LevelHeader = []Player: {name, index: []Int (index of source → index of player in source)}
// this mutates tables in sources (it expands out column 0 (Best Times) of data)
function genPlayers(sources) {
  // default parameters
  if (!sources) { sources = importTables(
    {id:"1J20aivGnvLlAuyRIMMclIFUmrkHXUzgcDmYa31gdtCI", tab:"Ultimate Star Spreadsheet v2", r:1, c:6, pAxis:"x"},
    {id:"1X06GJL2BCy9AXjiV9Y8y-7KKkj4d9YI3dtTb2HVOyRs", tab:"Ultimate Sheet Extensions"   , r:1, c:6, pAxis:"x"}
  )}

  // generate from player columns
  let playerDict = {} // {name, index: []}}
  for (let [i, source] of sources.entries()) {
    let header = source.table[0].map(cell => cell.value != "---" ? cell.value : cell.note).slice(source.cStart+1)
    for (let [p,name] of header.entries()) {
      let newName = SM64_ALIAS[name]
      if (newName || newName === null) { // rename / delete respectively
        LOG_NAME_CHANGE.push(`${name} → ${newName ?? "ø"}`)
        name = newName
        if (name == "ø") {continue}
      }
      if (!(name in playerDict)) { playerDict[name] = { name: name, index: [] } }
      playerDict[name].index[i] = p + 1
    }
  }

  // generate from best times column
  let playerDictBest = {} // as above but for Best Times players; also has lists of row indices for their runs
  for (let [i, source] of sources.entries()) {
    let bestNames = source.table.map(row => row[source.cStart]).slice(1).map(cell => cell.note.split(/[\s\:]/)[0])
    for (let [rowIndex,name] of bestNames.entries()) {
      if (!name) {continue}
      let newName = SM64_ALIAS[name]
      if (newName || newName === null) { // rename / delete respectively
        LOG_NAME_CHANGE.push(`${name} → ${newName ?? "ø"}`)
        name = newName
        if (name == "ø") {continue}
      }
      if (!(name in playerDictBest)) { playerDictBest[name] = { name: name, index: [], rows: [[], []] } }
      playerDictBest[name].rows[i].push(rowIndex + 1)
    }
  }
  // mutate tables: expand out best times column
  for (let [i, source] of sources.entries()) {
    for (let [name,player] of Object.entries(playerDictBest)) {
      playerDictBest[name].index[i] = source.table[0].length - source.cStart // index = length before push
      source.table[0].push(new Run(name)) // not really a run, just player name data
      for (let rowIndex = 1; rowIndex < source.table.length; rowIndex++) {
        source.table[rowIndex].push(
          player.rows[i].includes(rowIndex) ? source.table[rowIndex][source.cStart] : new Run()
        )
        source.table[rowIndex].at(-1).note = "" // clear note
      }
    }
  }
  console.log("generated players")
  let playerIndex = Object.values(Object.assign(playerDict,playerDictBest))
  SHEET_DASH.getRange("A3").setValue(LOG_NAME_CHANGE.sort().join("\n"))
  return [playerIndex, playerIndex]
}
