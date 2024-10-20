// these routines run points/rank/aggregation calculations, and edit the results into the data variable

// performs calc on all levels, then aggregate on all players, then prune + sort (by sortScore)
function annotate(data, sortScore) {
  let [L,P] = [data.levels.names.length, data.runs.length]
  for (let l=0; l<L; l++) {      calc(data, l) }     // add points/ranks to runs + entries/cutoffs to levels
  for (let p=0; p<P; p++) { aggregate(data, p) }     // add head stats to runs
  data.runs = data.runs.filter(r => r.head.n>0)      // prune players with no runs
                       .sort((r,s) => ((sortScore == "l1" ? 1 : -1)*(r.head[sortScore]-s.head[sortScore]))) // sort
  console.log(`processed data (sorted by ${sortScore})`)
}


// for a level's runs: assigns rank, rankQuality, points to each run + fills out levels.entries, levels.cutoffs
function calc(data, l) {
  let series = data.runs.map(row => row.body[l]).filter(x => x.time)
                        .sort((x,y) => (data.levels.reversed[l] ? -1 : 1) * (x.time - y.time))
  // recall the standard rank algorithm: given a sorted list,
  // its rank = its index+1 unless it's tied (repeated value), whence the rank persists
  { // ranks
    let prevTime, rank
    for (let [i, x] of series.entries()) {
      if (x.time != prevTime) { rank = i+1 } // if changed then set rank to index+1 else persist rank
      x.rank = rank
      x.rankQuality = 1 - (x.rank-1)/series.length
      prevTime = x.time
    }
  }
  { // points
    let prevTime, points
    for (let [i, x] of series.slice().reverse().entries()) { // slice just makes a copy
      if (x.time != prevTime) { points = i+1 }
      x.points = points
      prevTime = x.time
    }
  }
  // entry counts and video cutoffs
  data.levels.entries[l] = series.length
  // data.levels.cutoffs[l] = series[cutoffRank(series.length)-1]?.time   // cutoff times (undefined means no cutoff)
}


// for a player: assigns stats to .head (points, l1, 1, 2, 3 //medals//, v, n //entry/video counts//)
function aggregate(data, p) {
  let row = data.runs[p]
  let stats = {points: 0, l1: 0, "1": 0, "2": 0, "3": 0, v: 0, n: 0}
  for (let l = 0; l < data.levels.names.length; l++) {
    stats.points += row.body[l].points ?? 0
    stats.l1 += (row.body[l].rank ?? data.levels.entries[l] + 1) - 1
    for (let i of [1,2,3]) {stats[i] += (row.body[l].rank == i)}
    stats.v += !!row.body[l].time && !!row.body[l].link
    stats.n += !!row.body[l].time
  }
  // special level adjustments (used in SMS)
  for (let pair of  Object.entries(data.levels.isotopes)) {   // isotopes (adjust points, l1)
    let [i,j] = pair.map(code => data.levels.codes.indexOf(code))
    stats.points -= Math.min(row.body[i].points ?? 0, row.body[j].points ?? 0)
    stats.l1     -= Math.max(row.body[i].l1     ?? 0, row.body[j].l1     ?? 0)
  }
  for (let code of data.levels.medalless) {                   // medalless (adjust medals)
    for (let i of [1,2,3]) {stats[i] -= (row.body[data.levels.codes.indexOf(code)].rank == i)}
  }
  // output
  Object.assign(row.head, stats)
}
