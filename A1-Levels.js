// level parsing script: derives level info from sheet headers

// info for parsing levels
SM64_LEVELS = {
  worldNames: {                 // names parsed from ultimate sheet, converted to titles
    "Bob-omb Battlefield":      "BOB",
    "Whomp's Fortress":         "WF",
    "Jolly Roger Bay":          "JRB",
    "Cool, Cool Mountain":      "CCM",
    "Big Boo's Haunt":          "BBH",
    "Hazy Maze Cave":           "HMC",
    "Lethal Lava Land":         "LLL",
    "Shifting Sand Land":       "SSL",
    "Dire, Dire Docks":         "DDD",
    "Snowman's Land":           "SL",
    "Wet-Dry World":            "WDW",
    "Tall, Tall Mountain":      "TTM",
    "Tiny-Huge Island":         "THI",
    "Tick Tock Clock":          "TTC",
    "Rainbow Ride":             "RR",
    "Castle Secret Stars":      "Castle",
    "Castle (Lobby)":           "Lobby",
    "Castle (Basement)":        "Basement",
    "Castle (Upstairs, Tippy)": "Up/Tippy",
  },
  levelNames: {                 // names of stars, in star-select order
    "Bob-omb Battlefield": ["", "Big Bob-omb on the Summit", "Footrace with Koopa the Quick", "Shoot to the Island in the Sky", "Find the 8 Red Coins", "Mario Wings to the Sky", "Behind Chain Chomp's Gate"],
    "Whomp's Fortress":    ["", "Chip off Whomp's Block", "To the Top of the Fortress", "Shoot into the Wild Blue", "Red Coins on the Floating Isle", "Fall onto the Caged Island", "Blast Away the Wall"],
    "Jolly Roger Bay":     ["", "Plunder in the Sunken Ship", "Can the Eel Come Out to Play?", "Treasure of the Ocean Cave", "Red Coins on the Ship Afloat", "Blast to the Stone Pillar", "Through the Jet Stream"],
    "Cool, Cool Mountain": ["", "Slip Slidin' Away", "Li'l Penguin Lost", "Big Penguin Race", "Frosty Slide for 8 Red Coins", "Snowman's Lost His Head", "Wall Kicks Will Work"],
    "Big Boo's Haunt":     ["", "Go on a Ghost Hunt", "Ride Big Boo's Merry-Go-Round", "Secret of the Haunted Books", "Seek the 8 Red Coins", "Big Boo's Balcony", "Eye to Eye in the Secret Room"],
    "Hazy Maze Cave":      ["", "Swimming Beast in the Cavern", "Elevate for 8 Red Coins", "Metal-Head Mario Can Move!", "Navigating the Toxic Maze", "A-Maze-ing Emergency Exit", "Watch for Rolling Rocks"],
    "Lethal Lava Land":    ["", "Boil the Big Bully", "Bully the Bullies", "8-Coin Puzzle with 15 Pieces", "Red-Hot Log Rolling", "Hot-Foot-It into the Volcano", "Elevator Tour in the Volcano"],
    "Shifting Sand Land":  ["", "In the Talons of the Big Bird", "Shining Atop the Pyramid", "Inside the Ancient Pyramid", "Stand Tall on the Four Pillars", "Free Flying for 8 Red Coins", "Pyramid Puzzle"],
    "Dire, Dire Docks":    ["", "Board Bowser's Sub", "Chests in the Current", "Pole-Jumping for Red Coins", "Through the Jet Stream", "The Manta Ray's Reward", "Collect the Caps..."],
    "Snowman's Land":      ["", "Snowman's Big Head", "Chill with the Bully", "In the Deep Freeze", "Whirl from the Freezing Pond", "Shell Shreddin' for Red Coins", "Into the Igloo"],
    "Wet-Dry World":       ["", "Shocking Arrow Lifts!", "Top o' the Town", "Secrets in the Shallows & Sky", "Express Elevator--Hurry Up!", "Go to Town for Red Coins", "Quick Race Through Downtown!"],
    "Tall, Tall Mountain": ["", "Scale the Mountain", "Mystery of the Monkey Cage", "Scary 'Shrooms, Red Coins", "Mysterious Mountainside", "Breathtaking View from Bridge", "Blast to the Lonely Mushroom"],
    "Tiny-Huge Island":    ["", "Pluck the Piranha Flower", "The Tip Top of the Huge Island", "Rematch with Koopa the Quick", "Five Itty Bitty Secrets", "Wiggler's Red Coins", "Make Wiggler Squirm"],
    "Tick Tock Clock":     ["", "Roll into the Cage", "The Pit and the Pendulums", "Get a Hand", "Stomp on the Thwomp", "Timed Jumps on Moving Bars", "Stop Time for Red Coins"],
    "Rainbow Ride":        ["", "Cruiser Crossing the Rainbow", "The Big House in the Sky", "Coins Amassed in a Maze", "Swingin' in the Breeze", "Tricky Triangles!", "Somewhere over the Rainbow"],
  },
  castleLevelCodes: {                           // castle levels parsed from ultimate sheet, converted to codes
    "Tower of the Wing Cap":                    "wc",
    "Vanish Cap under the Moat":                "vc",
    "Fade of the CotMC entry":                  "mce",
    "Cavern of the Metal Cap":                  "mc",
    "The Secret Aquarium":                      "sa",
    "Wing Mario over the Rainbow":              "cloud",
    "The Princess's Secret Slide Under 21\"0":  "pss",
    "Bowser in the Dark World":                 "bitdw",
    "Bowser in the Dark World Red Coins":       "bitdwr",
    "BitDW Battle":                             "bitdwb",
    "Bowser in the Fire Sea":                   "bitfs",
    "Bowser in the Fire Sea Red Coins":         "bitfsr",
    "BitFS Battle":                             "bitfsb",
    "Bowser in the Sky":                        "bits",
    "Bowser in the Sky Red Coins":              "bitsr",
    "BitS Battle":                              "bitsb",
  },
  // detected in either sheet; the strat numbers of #size rows starting here will be incremented by #stratOffset
  // so that they don't clash with previous strat numbers for the same level
  // see wf104 on ultimate sheet for how this should look in the original data source
  levelTextReplacement: {
    "[1] Race + 100c atmpas special route (JP)":      { size: 5, stratOffset: 2 },  // ccm103
    "[1] Go on a Ghost Hunt (US)":                    { size: 3, stratOffset: 4 },  // bbh1
    "[1] Reds + 100c Pond spindrift early (JP)":      { size: 4, stratOffset: 2 },  // sl105
    "[1] Reds + 100c Spawn red star late route (JP)": { size: 6, stratOffset: 2 },  // ttm103
    "[1] Reds + 100c 5 coins pole route (JP)":        { size: 4, stratOffset: 2 },  // thi105
    "[1] Reds + 100c 11 coins route (JP)":            { size: 4, stratOffset: 4 },  // thi105
    "[1] Thwomp + 100c w/ safety red (JP)":           { size: 4, stratOffset: 2 },  // ttc104
  },
  // these levels (from the extensions sheet) will be appended to level blocks in the ultimate sheet
  levelSplices: {
    "[1] KtQ w/o cannon cutscene (JP)":                    "bob2",
    "[1] Island hop w/ TJ":                                "bob3",
    "[1] Bomb Clip Throw + Backflip":                      "bob6",
    "[1] Tower Elevator triple jump (No quickturn)":       "wf2",
    "[1] Reds + 100c Ultimate cycle (JP)":                 "wf104",
    "[1] Cage Sideflip + Wallkick":                        "wf5",
    "[1] Cannonless Clip onto the bridge":                 "wf6",
    "[1] Sunken Ship Ending punch strat":                  "jrb1",
    "[1] Eel w/ Cannon BLJ":                               "jrb2",
    "[1] Cave w/ Cannon BLJ":                              "jrb3",
    "[1] Cannonless Longjump from the ship (US)":          "jrb5",
    "[1] Slide + 100c Blue coin switch route (JP)":        "ccm101",
    "[1] Lil penguin Pingu trick (JP)":                    "ccm2",
    "[1] Race + 100c No teleporter route (JP)":            "ccm103",
    "[1] Reds Teleporter red late (Old route)":            "ccm4",
    "[1] Snowman Slide + SJ beginning (JP)":               "ccm5",
    "[1] WKWW Single jump strat":                          "ccm6",
    "[1] Go on a Ghost Hunt (JP, Text skip)":              "bbh1",
    "[1] Book phantaxx ending":                            "bbh3",
    "[1] Reds + 100c w/o Salt clip (JP)":                  "hmc102",
    "[1] Metal-Head BLJ strat (w/ Air BLJ)":               "hmc3",
    "[1] Toxic Maze Instant clip":                         "hmc4",
    "[1] Exit Left LJ + TJ (Expert)":                      "hmc5",
    "[1] Rocks C-Up slide strat (Right side)":             "hmc6",
    "[1] Big Bully Double burn + Rollout onto platform":   "lll1",
    "[1] Bullies LJ onto sinking platform + DJ dive":      "lll2",
    "[1] Log Double jump + Longjump strat":                "lll4",
    "[1] Volcano + 100c Lava boost route (JP)":            "lll105",
    "[1] Talons Speed punch x2 strat":                     "ssl1",
    "[1] Pillarless Nuts":                                 "ssl3",
    "[1] Pazzle Pillarless Nuts":                          "ssl6",
    "[1] Reds Get the pond red #6 (Speed wing)":           "ssl5",
    "[1] Puzzle + 100c 4th pillar first route (JP)":       "ssl106",
    "[1] DDD Side sub":                                    "ddd1",
    "[1] Chest down warp strat":                           "ddd2",
    "[1] Snowman Singlestar strat":                        "sl1",
    "[1] Bully Dive + Z strat":                            "sl2",
    "[1] Pond Slide + Jump x1 strat (Intermediate strat)": "sl4",
    "[1] Reds Slide + Jump x2 dive strat":                 "sl5",
    "[1] Into the Igloo (phantaxx inside)":                "sl6",
    "[1] Lift Mid water level strat":                      "wdw1",
    "[1] Top o' the Town (Sideflip)":                      "wdw2",
    "[1] Express Elevator--Hurry Up! (Sideflip)":          "wdw4",
    "[1] Monkey Cage wallkick strat (JP)":                 "ttm2",
    "[1] Lonely Mushroom No setup box strat":              "ttm6",
    "[1] Box w/ ledgegrab cancel":                         "thi2",
    "[1] RKtQ Mountain clip route (JP)":                   "thi3",
    "[1] 100c Enter the pipe good RNG (- 16c)":            "thi105",
    "[1] Rematch with Koopa the Quick + 100c (JP)":        "thi103",
    "[1] Cage Low dive ending":                            "ttc1",
    "[1] Get a Hand LJ x3 strat":                          "ttc3",
    "[1] Bars Time moving (Fast)":                         "ttc5",
    "[1] Reds Rollout ending":                             "ttc6",
    "[1] Cruiser w/ Assless (w/ Small DJ)":                "rr1",
    "[1] Big House + 100c w/ Carpetless (JP, PAUSE TIME INCLUDED)": "rr102",
    "[1] Reds w/ GWK beginning":                           "rr3",
    "[1] Breeze Beginning down / Triple jump ending":      "rr4",
    "[1] Cannon w/ Assless (w/ Small DJ)":                 "rr6",
    "[1] TotWC Reds Rollout onto the switch":              "wc",
    "[1] WMotR Reds #2 late":                              "cloud",
    "[1] PSS U21 Late wall bounce strat":                  "pss",
    "[1] BitS Reds Early cycle (JP)":                      "bitsr",
  },
  // these levels will be split into a separate level for levelsIl specifically, by these search strings
  splitLevels: {
    "bob3": "Island hop",
    "lll4": "Capless"
  }
}


// input format: []Source
// output format: []LevelHeader (index of output data block → level header of output data block)
// LevelHeader = []Level: {name, code, index: []Int (index of source → index of level in source)}
function genLevels(sources) {
  // default parameters
  if (!sources) { sources = importTables(
    {id:"1J20aivGnvLlAuyRIMMclIFUmrkHXUzgcDmYa31gdtCI", tab:"Ultimate Star Spreadsheet v2", r:1, c:6, pAxis:"x"},
    {id:"1X06GJL2BCy9AXjiV9Y8y-7KKkj4d9YI3dtTb2HVOyRs", tab:"Ultimate Sheet Extensions"   , r:1, c:6, pAxis:"x"}
  )}

  // extract level headers (level column from original sheets in []String format)
  let header0 = sources[0].table.map(row => row[0].value).slice(sources[0].rStart)  // ultimate sheet
  let header1 = sources[1].table.map(row => row[0].value).slice(sources[1].rStart)  // extensions sheet
  
  // run levelTextReplacement on ultimate sheet
  for (let [text, fix] of Object.entries(SM64_LEVELS.levelTextReplacement)) {
    let l = header0.indexOf(text); if (l == -1) {throw `text fix not found: ${text}`}
    for (let l_ = l; l_ < l + fix.size; l_++) {
      let oldNumbers = header0[l_].trim().slice(0, header0[l_].trim().indexOf(" ")) // e.g. "[1|2]"
      let numbers = oldNumbers
      for (let i=1; i<=fix.stratOffset; i++) {numbers = numbers.replaceAll(String(i), String(i + fix.stratOffset))}
      header0[l_] = header0[l_].replace(oldNumbers, numbers) // e.g. "[1|2]" → "[3|4]"
    }
  }

  // process ultimate sheet
  let levelDict = {} // map to track detected levels: {worldCode: worldEntry}
  class WorldEntry { // map to track detected levels {levelCode: levelEntry}
    constructor(name) {
      this.name = name // will also contain levelCode-s
    }
  }
  class LevelEntry {
    constructor(name) { // full vs part means whether it represents the whole star; x is for extensions sheet strats
      this.name = name
      Object.assign(this, { full: [], part: [], fullx: [], partx: []})
    } 
  }
  {
    let world, worldName, worldCode, levelName, levelCode // state variables, between iterations
    for (let [l,text] of header0.entries()) {
      let match = text.match(/^\s*(\[[\d\|]+\])\s+(.+)(?<![\)\s])(\s+\(.+\))?\s*$/)
      if (match) {  // if not a divider (= non-blank header column)
        let [_, stratNumbers, name, details] = match
        let [hundo, nameRaw] = [name.includes(" + 100c"), name.replace(" + 100c", "")]
        // console.log(`${stratNumbers}/${name}/${details}/1${hundo?"00":""}`) // regex log
        // detect new level
        if (stratNumbers == "[1]") {
          if (world.substring(0,6) != "Castle") {
            let levelNumber = SM64_LEVELS.levelNames[world].indexOf(nameRaw) // index in star select, 1–6
            if (name.includes("RTA")) {                       // bob-rta
              levelCode = `${worldCode}-rta`
            } else if (levelNumber >= 1) {                    // bob1, bob104 etc.
              levelCode = `${worldCode}${hundo?"10":""}${levelNumber}`
            }
          } else if (world == "Castle Secret Stars") {        // special dictionary
            levelCode = SM64_LEVELS.castleLevelCodes[name]
          } else {                                            // castle movement: name to initials
            levelCode = name.split(/[\s\-]+/).map(word=>word[0]).join("").replaceAll("☆","*")
          }
          if (!(levelCode in levelDict[worldCode])) { levelDict[worldCode][levelCode] = new LevelEntry(name) }
          levelName = levelDict[worldCode][levelCode].name // so levelName = name if newly found, else persists
        }
        // process strat
        let full = parseInt(stratNumbers[1]) > levelDict[worldCode][levelCode].full.length && stratNumbers[2] == "]"
        let levelGroup = levelDict[worldCode][levelCode][full ? "full" : "part"]
        levelGroup.push({
          name:  `${worldName} | ${levelName} | ${text.replace(" "+levelName,"").trim()}`,
          code:  `${levelCode}-${full ? levelGroup.length+1 : String.fromCharCode(levelGroup.length+1 + 96)}`,
          index: [l, undefined],
        })
        //console.log(`${levelGroup.at(-1).index[0]} | ${levelGroup.at(-1).code} | ${levelGroup.at(-1).name}`)//out
      } else {  // if divider
        // detect new world
        if (text && text[0] != "★") {
          world = text.trim().split(" ").slice(1).join(" ")
          worldName = SM64_LEVELS.worldNames[world]
          worldCode = worldName?.toLowerCase()
          if (worldCode && !(worldCode in levelDict)) { levelDict[worldCode] = new WorldEntry(worldName) }
          // console.log(`world: ${worldCode} | ${world}`) // world log
        }
      }
    }
  }

  // process extensions sheet based on ultimate sheet
  {
    let world, worldCode, worldName, levelCode, levelName // state variables, between iterations
    for (let [l,text] of header1.entries()) {
      let match = text.match(/^\s*(\[[\d\|]+\])\s+(.+)(?<![\)\s])(\s+\(.+\))?\s*$/) // exact same regex as before
      if (match) {  // if not a divider (= non-blank header column)
        let [_, stratNumbers, name] = match
        // detect new level (the bottom 2 lines don't change anything if levelCode stays the same)
        if (stratNumbers == "[1]") {
          if (SM64_LEVELS.levelSplices[text]) {              // splice: override level code
            levelCode = SM64_LEVELS.levelSplices[text]
          } else if (world.substring(0,8) == "Castle (") {  // castle movement: name to initials
            levelCode = name.split(/[\s\-]+/).map(word=>word[0]).join("").replaceAll("☆","*")
          }
          if (!(levelCode in levelDict[worldCode])) { levelDict[worldCode][levelCode] = new LevelEntry(name) }
          levelName = levelDict[worldCode][levelCode].name // so levelName = name if newly found, else persists
        }
        // process strat
        let full = parseInt(stratNumbers[1]) > levelDict[worldCode][levelCode].fullx.length && stratNumbers[2]=="]"
        let levelGroup = levelDict[worldCode][levelCode][full ? "fullx" : "partx"]
        levelGroup.push({
          name: `${worldName} ¦ ${levelName} | ${text.replace(" "+levelName,"").trim()}`,
          code: `${levelCode}-${full ? levelGroup.length+1 : String.fromCharCode(levelGroup.length+1 + 96)}x`,
          index: [undefined, l],
        })
        // console.log(`${levelGroup.at(-1).index[1]} | ${levelGroup.at(-1).code} | ${levelGroup.at(-1).name}`)//out
      } else {  // if divider
        // detect new world
        if (text && text[0] != "★") {
          world = text.trim().split(" ").slice(1).join(" ")
          worldName = SM64_LEVELS.worldNames[world]
          worldCode = worldName?.toLowerCase()
          if (worldCode && !(worldCode in levelDict)) { levelDict[worldCode] = new WorldEntry(worldName) }
          // console.log(`world: ${SM64_LEVELS.worldNames[world]?.toLowerCase()} | ${world}`) // world log
        }
      }
    }
  }

  // apply splitLevels
  for (let [levelCode, searchString] of Object.entries(SM64_LEVELS.splitLevels)) {
    let worldCode = levelCode.split(/\d/)[0]
    let levelEntry = levelDict[worldCode][levelCode]
    let newLevelEntry = new LevelEntry(`${levelEntry.name} (Capless)`)
    for (let key in levelEntry) {
      if (key == "name") {continue}
      newLevelEntry[key] = levelEntry[key].filter(level =>  level.name.includes(searchString))
         levelEntry[key] = levelEntry[key].filter(level => !level.name.includes(searchString))
    }
    levelDict[worldCode][`${levelCode}*`] = newLevelEntry
  }

  // generate combined indices for Ult and Il data
  let [levelsUlt, levelsIl] = [[], []]
  for (let worldEntry of Object.values(levelDict)) {
    let levelEntries = Object.entries(worldEntry).filter(e => e[0] != "name")
    // sort stage levels by last digit of code, hundos second
    if (!["Castle","Lobby","Basement","Up/Tippy"].includes(worldEntry.name)) { levelEntries.sort((le0,le1) => {
      if (le1[0].slice(-3) == "rta") { return -1 }
      let m = [le0,le1].map(le => le[0].match(/^([a-z]+)(\d+)(\*)?/))
      let levelDiff = m[0][2].at(-1) - m[1][2].at(-1); if (levelDiff != 0) {return levelDiff}
      let hundoDiff = m[0][2].length - m[1][2].length; if (hundoDiff != 0) {return hundoDiff}
      return !!m[0][3] - !!m[1][3] // starDiff
    })}
    for (let [levelCode, levelEntry] of levelEntries) {
      // levelsUlt
      let ult0 = [...levelEntry.full, ...levelEntry.part].sort((lvl1, lvl2) => lvl1.index[0] - lvl2.index[0])
      let ult1 = [...levelEntry.fullx, ...levelEntry.partx].sort((lvl1, lvl2) => lvl1.index[1] - lvl2.index[1])
      levelsUlt.push(...ult0, ...ult1)
      // levelsIl (first, skip rta + castle movement)
      if (levelCode.includes("rta")) {continue}
      if (["Lobby","Basement","Up/Tippy"].some(x => worldEntry.name.split(" ")[0] == x)) {continue}
      levelsIl.push({
        code: levelCode,
        name: `${worldEntry.name} | ${levelEntry.name}`,
        index: [levelEntry.full.map(level => level.index[0]), levelEntry.fullx.map(level => level.index[1])]
      })
    }
  }
  console.log("generated levels")
  return [levelsUlt, levelsIl]
}


function genLevelMetadata(codes) {
  let aggregates = {"All": codes}
  if (codes.includes("bob1")) { // meaning il output rather than ult output
    aggregates["16*"] = (`wf3 wf5 wf6 hmc1 hmc5 hmc6 lll1 lll3 lll4* lll5 ssl1 ssl2 ssl3 ddd1 `
                      +  `bitdwr bitdwb bitfs bitfsb bits bitsb`).split(" ")
  }
  return {
    aggregates: aggregates, // leaderboard viewer
    isotopes:   {},         // for calculation adjustments
    medalless:  [],         // for calculation adjustments
    helpHTML:   `None.`,    // statically computed; for leaderboard viewer
  }
}
