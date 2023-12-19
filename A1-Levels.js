// creates level data from header (top few rows) of sheet
function generateLevels(source) {
  let header = source.table.slice(0, source.rStart).map(row => row.slice(source.cStart).map(cell => cell.value))
  let worldCodes = {"Bianco":"b","Ricco":"r","Gelato":"g","Pinna":"p",
                    "Sirena":"s","Noki":"n","Pianta":"q","Delfino":""}
  let levels = {                                      // this is the layout of data.levels
    names: [], indices: {}, reversed: [], codes: [],  // statically computed here
    entries: [], cutoffs: [],                         // computed later as part of processing (not exported)
    aggregates: undefined,                            // statically computed; for leaderboard viewer
    isotopes:   {"peyg": "peygj", "s6": "s6j"},       // for calculation adjustments
    medalless:  ["bp"],                               // for calculation adjustments
    cutoffLimits: {rq: 0.85, r: 3},                   // thresholds: rankQuality >= rq, rank <= r
    helpHTML:   genHelpHTML(),                        // statically computed; for leaderboard viewer
  }
  for (let l = 0; l < header[0].length; l++) {
    if (!header.map(row => row[l]).every(x => !x)) {  // if not a divider (= non-blank header column)
      let world = header[0][l]
      for (let k = l; world === ""; k--, world = header[0][k]) {} // seek backwards in merged cell to get value
      let episode = header[1][l]
      for (let k = l; episode === ""; k--, episode = header[1][k]) {}
      let sublevel = header[2][l]
      levels.names[l]    = genName(world, episode, sublevel)
      levels.reversed[l] = genReversed(world, episode)
      levels.codes[l]    = genCode(levels.names[l], worldCodes)
    } else {                                          // if divider
      levels.names[l]    = `divider at ${l}`          // viewer app excludes from level nav by "divider" substring
      levels.reversed[l] = false
      levels.codes[l]    = ""                         // viewer app excludes from hashes by empty code
    }
    levels.indices[levels.names[l]] = l
  }
  levels.aggregates = genAggregates(levels.codes, levels.isotopes)
  console.log(`generated levels`)
  return levels
}


// used to generate levels.names
function genName(world, episode, sublevel) { // this is pass by value
  world = world.substr(0, world.indexOf(' '))
  for (let word of ['Ep. ', ' Coins', '\n']) {episode = episode.replace(word, ' ').trim()}
  for (let word of [' Level', ' Only', ' Route', '\n']) {sublevel = sublevel.replace(word, '')}
  return `${world} ${episode} ${sublevel}`.trim()
}


// used to generate levels.reversed
function genReversed(world, episode) {
  switch(world){
    case "Bianco Hills":                 return ["Ep. 3 Reds", "Ep. 6 Reds"].includes(episode)
    case "Ricco Harbor":                 return ["Ep. 6",      "Ep. 4 Reds"].includes(episode)
    case "Gelato Beach / Mamma Beach":   return episode === "Ep. 1 Reds"
    case "Pinna Park":                   return ["Ep. 2 Reds", "Ep. 6 Reds"].includes(episode)
    case "Sirena Beach":                 return ["Ep. 6", "Ep. 8", "Ep. 2 Reds", "Ep. 4 Reds"].includes(episode)
    case "Noki Bay / Mare Bay":          return episode === "Ep. 6 Reds"
    case"Pianta Village / Monte Village":return ["Ep. 6",      "Ep. 5 Reds"].includes(episode)
    case "Delfino Plaza":                return episode === "Airstrip Reds" || episode.slice(0,8) === "Box Game"
    default: throw `unknown world: "${world}"`
  }
}


// used to generate levels.codes (short codes for levels)
function genCode(name, worldCodes) {
  let world = name.split(" ")[0]
  let code = worldCodes[world]
  code += name.substring(name.indexOf(" ")+1)
    .replace(" Full", "").replace(" Secret", "s").replace(" Sandbird", "s")
    .replace("Hidden 1", "h").replace("Hidden 2", "h")
    .replace(" Reds", "r").replace(" Non- Hover", "*").replace(" Hover", "")
    .replace("6 (EYG)", "eyg").replace(" US/PAL", "").replace(" JP", "j")
    .replace(" RTA", "").replace(" Non-RTA", "*")
    .replace(" No Setup", "").replace(" No Hyper-Hover", "")
    .replace("Airstrip", "a").replace("Corona Mountain", "c").replace(" Bowser", "b")
    .replace("Box Game ", "box")
    .replace("Beach Pipe", "bp").replace("Beach Shine", "beach")
    .replace("Chuckster", "chuck").replace("Gold Bird", "gbird").replace("Grass Pipe", "grass")
    .replace("Jails", "jail").replace("Light- house", "light").replace("Lilypad", "lily")
    .replace("Pachinko", "pach").replace("Shine Gate", "sgate")
    .replace("Left Bell", "lbell").replace("Right Bell", "rbell").replace("Underbell", "ubell")
    .replace("a 100", "a100")
  return code
}


// used to generate levels.aggregates (sets of levels by which the leaderboard viewer can be filtered)
function genAggregates(codes, isotopes) {
  let c = codes.filter(code => code != "") // copy of full code list
  for (let iso in isotopes) { c.splice(c.indexOf(iso)+1,1) } // removes all second isotopes from c
  let aggregates = {
    "Total"       : c,
    "Movement"    : `b3 b3s b4 b6 b6s r1 r2 r3 r4 r4s r5 g1s p2 p2s p3 p6s `
                  + `s2 s2s s3 s4 s4s n1 n2 n6 n6s q3 q4 q6 c`,
    "Any%"        : `b2 b3 b3s b4 b5 b6 b6s b7 r1 r2 r3 r4 r4s r5 r6 r7 g7 g8 `
                  + `p1 p2 p2s p3 p4 p6s peyg p7 s1 s2 s2s s3 s4 s4s s5 s6 s7 `
                  + `n1 n2 n3 n4 n6 n6s n7 q1 q3 q4 q5 q5s q6 q7 a c cb`,
    "NotAny%"     : `b1 b8 b3r* b3r b6r* b6r b100 r6* r8 r4r* r4r r100 `
                  + `g1 g1s g2 g3 g4 g4s g5 g6 gh g1r* g1r g100 p5 p6 p8 p2r p6r p100 `
                  + `s8 s2r s4r s100 n5 n8 nh n6r* n6r n100 q2 q8 q5r qh q100 ar* ar a100 `
                  + `bp beach box1 box2 box3 chuck gbird grass jail lbell light lily pach rbell sgate ubell`,
    "Secrets"     : `b3s b6s r4s g1s p2s p6s s2s s4s n6s q5s`,
    "SMs"         : `b7 r7 g7 p7 s7 n7 q7`,
    "Bianco"      : c.slice(c.indexOf("b1"), c.indexOf("r1")),
    "Ricco"       : c.slice(c.indexOf("r1"), c.indexOf("g1")),
    "Gelato"      : c.slice(c.indexOf("g1"), c.indexOf("p1")),
    "Pinna"       : c.slice(c.indexOf("p1"), c.indexOf("s1")),
    "Sirena"      : c.slice(c.indexOf("s1"), c.indexOf("n1")),
    "Noki"        : c.slice(c.indexOf("n1"), c.indexOf("q1")),
    "Pianta"      : c.slice(c.indexOf("q1"), c.indexOf("a")),
    "Delfino"     : c.slice(c.indexOf("a")),
    "SecretReds"  : c.filter(code => code[2] == "r"),
    "100s"        : c.filter(code => code.slice(1) == "100"),
  }
  for (let [k,v] of Object.entries(aggregates)) { if (typeof(v) == "string") { aggregates[k] = v.split(" ") } }
  return aggregates
}


// used to generate levels.helpHTML (level-specific information for the help tab of the viewer app)
function genHelpHTML() { return `
  <p>The <b>version pairs</b> are <code>s6/s6j</code> and <code>peyg/peygj</code>;
    the <b>medalless level</b> is <code>bp</code>.</p>
  <p>The level groupings are mostly obvious;
    the <b>movement</b> group is intended to be hover-based/fluddless movement levels,
    and was defined in Nov 2020 as:</p>
  <p><code>b3 b3s b4 b6 b6s r1 r2 r3 r4 r4s r5
    <br>g1s p2 p2s p3 p6s s2 s2s s3 s4 s4s
    <br>n1 n2 n6 n6s q3 q4 q6 c</code></p>
`}
