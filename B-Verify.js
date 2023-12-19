// loads in new unverified ILs from live sheet
function detect(liveData) {
  // load data
  let cacheSource = importTables(VCACHE_ADDRESS)[0]
  let cacheData = {levels: generateLevels(cacheSource), runs: generateRuns(cacheSource)}
  let [ liveLevels,  liveRuns,  livePlayers] = [ liveData.levels,  liveData.runs, generatePlayers( liveData)]
  let [cacheLevels, cacheRuns, cachePlayers] = [cacheData.levels, cacheData.runs, generatePlayers(cacheData)]
  let sheetVerify = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Verify")
  let verifyValues = sheetVerify.getRange(1, 1, sheetVerify.getLastRow(), sheetVerify.getLastColumn())
                        .getDisplayValues().slice(1)
  console.log("loaded verify sheet")
  let width = 8 // convention: exclude timestamp column
  let freeCounter = 0
  
  // compare live and cache to determine news
  let news = [] // the list of entries to add to/edit on the verification sheet
  for (let [p, player] of livePlayers.names.entries()) {
    let q = cachePlayers.indices[player]                     // look up player in cache; undefined if new player
    for (let [l, level] of liveLevels.names.entries()) {
      let m = cacheLevels.indices[level]                     // look up level in cache; undefined if new level
      let known = q !== undefined && m !== undefined         // if player+level are in cache, find times/links that
      let post = known ?                                     // _ don't match cache, else find any non-blank time
        (    liveRuns[p].body[l].value != cacheRuns[q].body[m].value
          || liveRuns[p].body[l].link  != cacheRuns[q].body[m].link  )
        : !!liveRuns[p].body[l].value
      if (post) {
        console.log(`> p[${p}] q[${q}] l[${l}] m[${m}] | ${player} ${level} |`,
                    `"${q !== undefined ? cacheRuns[q].body[m].value : '?'}" → "${liveRuns[p].body[l].value}"`)
        let validTime = !!liveRuns[p].body[l].time
        news.push([
          player,
          level,
          known ? cacheRuns[q].body[m].value : '?',
          liveRuns[p].body[l].value,
          known ? cacheRuns[q].body[m].link  : '',
          liveRuns[p].body[l].link,
          validTime ? (liveRuns[p].body[l].rankQuality * 100).toFixed(1).concat("%") : "-",
          validTime ? liveRuns[p].body[l].rank : "-",
          new Date().toISOString().replace('T',' ').split('.')[0].substring(5, 16).replace('-','/')
        ])
        // rankQuality must be formatted to text to be correctly compared with existing values on verify sheet
      }
    }
    delete cachePlayers.indices[player] // for next loop
  }
  for (let [player,q] of Object.entries(cachePlayers.indices)) {  // any players in the cache but not live sheet
    console.log(`x q[${q}] | ${player}`)
    news.push([
      player, "(row deleted)", '-', '-', '-', '-', '-', '-',
      new Date().toISOString().replace('T',' ').split('.')[0].substring(5, 16).replace('-','/')
    ])
  }
  console.log("detect 1/2: compared: changes:", news.length)
  
  // print news to verificaton sheet
  let detectedIndices = Array(verifyValues.length).fill(false)
  for (newItem of news) {
    let done = false // for-else construct
    for (let [i, oldItem] of verifyValues.entries()) {
      if (newItem[0] == oldItem[0] && newItem[1] == oldItem[1]) { // find entry by matching player and level
        // edit entry
        newItem.pop() // entry already exists, so remove timestamp to avoid overwriting it in next step
        if (!newItem.every((el, i) => el == oldItem[i])) { // edit sheet if newItem doesn't fully match oldItem
          sheetVerify.getRange(i+2, 1, 1, width).setValues([newItem])
          sheetVerify.getRange(i+2, 7, 1, 1).setNumberFormat("##0.0%")
          console.log('posted (edit):', oldItem, "→", newItem, 'to row', i+2)
        }
        detectedIndices[i] = true  // entry is accounted for
        done = true
        break
      }
    }
    if (!done) { // for-else construct
      // new entry
      while (verifyValues[freeCounter] && verifyValues[freeCounter][0]) {freeCounter++} // find free row
      sheetVerify.getRange(freeCounter+2, 1, 1, width+1).setValues([newItem])
      sheetVerify.getRange(freeCounter+2, 7, 1, 1).setNumberFormat("##0.0%")
      console.log('posted (new):', newItem, 'to row', freeCounter+2)
      freeCounter++
    }
  }
  for ([i, x] of detectedIndices.entries()) {
    // delete entry (obsolete news)
    if (!x && verifyValues[i][0]) {
      sheetVerify.getRange(i+2, 1, 1, width+1).clearContent()
      console.log('deleted (stale): from row', i, "|", verifyValues[i])
    }
  }
  console.log("detect 2/2: printed news")
}


// saves verified ILs to cache and clears them
function save() {
  console.log('saving...')

  let cacheSource = importTables(VCACHE_ADDRESS)[0]
  let [P_START, L_START] = [cacheSource.rStart+1, cacheSource.cStart+1]
  // legacy code; P_START/L_START are row/col numbers not indices
  let sheetCache   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("VCache")
  let sheetVerify  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Verify")
  let verifyValues = sheetVerify.getRange(1, 1, sheetVerify.getLastRow(), sheetVerify.getLastColumn())
                       .getDisplayValues().slice(1)
  let cacheLevels  = generateLevels(cacheSource)
  let cachePlayers = generatePlayers(
    {runs: cacheSource.table.slice(cacheSource.rStart).map(row => ({head: {name: row[0].value}}))}
  )

  for (let [i, item] of verifyValues.entries()) {
    if (item[9] == 'o' && item[0] && item[1]) { // any player/level pair that's been marked as 'o' in verify col.
      let m = cacheLevels.indices[item[1]]      // look up column index of level in cache; can't save unknown level
      if (m !== undefined) {
        let q = cachePlayers.indices[item[0]]   // look up row index of player in cache; can't save unknown player
        if (q !== undefined) {
          let rtv = SpreadsheetApp.newRichTextValue().setText(item[3])                  // new cell value
          if (item[5]) { rtv.setLinkUrl(item[5]) }                                      // add link
          sheetCache.getRange(P_START+q, L_START+m)   // get target cell
            .setNumberFormat('@')                     // reformat cell as plain text (helps with link detection)
            .setRichTextValue(rtv.build())            // then save value to cell (including applying link)
          sheetVerify.getRange(i+2, 1, 1, sheetVerify.getLastColumn()).clearContent()  // clear row
          console.log('saved', item)
        } else {
          console.log('save failed on unknown name', item)
          SpreadsheetApp.getUi().alert('Couldn\'t verify unknown name: ' + item[0]
            + '\nPut it in a blank row/column in the cache.')
          return false // error
        }
      } else if (item[1] == "(row deleted)") {
        console.log('save failed on deleted row', item)
        SpreadsheetApp.getUi().alert('Couldn\'t verify deleted row: ' + item[0]
          + '\nManually move it from cache to Add sheet, or manually delete from cache.')
        return false // error
      } else {
        console.log('save failed on unknown level', item)
        SpreadsheetApp.getUi().alert('Couldn\'t verify unknown level: ' + item[1]
          + '\nPut it in a blank row/column in the cache.')
        return false // error
      }
    }
  }

  sheetVerify.getRange('L1').setValue(new Date().toISOString().replace('T',' ').split('.')[0]) // last saved
  return true // success
}


// creates bidirectional player ↔ index map from data
function generatePlayers(data) {
  return {
    names:   data.runs.map(row => row.head.name),
    indices: Object.fromEntries(data.runs.map((row,p) => [row.head.name, p])),
  }
}
