SMS_ALIAS = {}
// see C-Export.gs for identifiers of hidden players
// when changing anons, remember to update Add and VCache tabs


// replaces names according to ALIAS dictionary
function nameFix(data) {
  for (let row of data.runs) {
    let newName = SMS_ALIAS[row.head.name]
    if (newName || newName === null) { // rename / delete respectively
      LOG_NAME_CHANGE.push(`${row.head.name} → ${newName ?? "ø"}`)
      row.head.name = newName
    }
  }
  data.runs = data.runs.filter(row => row.head.name)
}


// merges tables (performs overwrites)
function nameMerge(data) {
  let runs2 = {} // runs2 will be data.runs but merged
  for (let row of data.runs) {
    let name = row.head.name
    if (!runs2[name]) {  // add
      runs2[name] = row
    } else {             // merge
      let row2 = runs2[name]
      if (row.head.note) {row2.head.note = row.head.note }
      // overwrite non-black name colours; beware that the hex codes are sometimes #aarrggbb (hence slice(-6))
      if (row.head.colour.slice(-6) != "000000") {row2.head.colour = row.head.colour}
      for (let l = 0; l < data.levels.names.length; l++) {
        let [oldValue, newValue] = [row2.body[l].value, row.body[l].value]
        let [oldLink , newLink ] = [row2.body[l].link , row.body[l].link ]
        if (newValue) {
          if (newValue == "x") {                  // delete
            row2.body[l] = new Run()
            // console.log("-", name, "|", data.levels.codes[l], ":", (oldValue ? oldValue : "ø"), "→ ø")
          } else {                                // overwrite
            row2.body[l] = row.body[l]
            // console.log("+", name, "|", data.levels.codes[l], ":", (oldValue ? oldValue : "ø"), "→", newValue)
          }
          // warnings about overrides
          let reversed = data.levels.reversed[l]
          let [oldTime, newTime] = [parseTime(oldValue), parseTime(newValue)]
          if (oldTime && (                                                // warn if an override is a:
            newValue == "x" ||                                            // - deleted time
            (reversed ? -1 : 1) * (oldTime - newTime) < 0 ||              // - inferior time
            (oldTime == newTime && oldLink == newLink)                    // - identical time + link
          )) {
            LOG_TIME_REVERT.push(`${name} | ${data.levels.codes[l]}: ${oldValue} → ${newValue}`)
          }
        } else if (row.body[l].note) {
          row2.body[l].note = row.body[l].note    // override note only (specified on empty cell)
        }
      }
    }
  }
  data.runs = Object.values(runs2) // runs2 converted back into an array
}
