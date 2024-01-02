// standalone stats routines: can be run from here, output to execution log
// the video routines are extremely useful for backing up videos, combined with yt-dlp --download-archive

// shows the top ils in every level that lack video
function listMissingVideos() {
  let propThreshold = 0.9 // e.g. top 85%
  let absThreshold  = 3   // e.g. top 3 (medals)

  let {levels, runs} = importData()
  annotate({levels, runs}, "points")
  let [outProp, outAbs] = [[`== prop: ${propThreshold} ==`], [`== abs: ${absThreshold} ==`]]
  for (let [l, level] of levels.names.entries()) {
    for (let [p,run] of runs.map(row => row.body[l]).entries()) {
      if (run.rankQuality >= propThreshold && !run.link) {outProp.push(`${runs[p].head.name.padEnd(20)} | ${level}`)}
      if (run.rank        <= absThreshold  && !run.link) { outAbs.push(`${runs[p].head.name.padEnd(20)} | ${level}`)}
    }
  }
  console.log(outProp.join("\n")); console.log(outAbs.join("\n"))
}


// lists links to top n videos for every level
// useful for backup: run yt-dlp with download archive enabled periodically on this list
function listTopVideos() {
  let n = 3 // e.g. top 3 (medals)

  let {levels, runs} = importData()
  annotate({levels, runs}, "points")
  let output = ""
  for (let l = 0; l < levels.names.length; l++) {
    let levelRuns = runs.map(row => row.body[l])
    for (let run of levelRuns) { if (run.rank <= n && run.link) { output += run.link + "\n"} }
    if (output.length > 7500) {Logger.log(output); output = ""}
  }
  console.log(output)
}


// lists links to top n videos for every level (useful for backup)
function listPlayerVideos() {
  let name = ""

  let data = importData()
  let players = generatePlayers(data)
  let p = players.indices[name] ?? 0
  let output = players.names[p] + ":\n"
  for (let link of data.runs[p].body.map(run => run.link)) {
    if (link) { output += link + "\n" }
    if (output.length > 7500) {Logger.log(output); output = ""}
  }
  console.log(output)
}
