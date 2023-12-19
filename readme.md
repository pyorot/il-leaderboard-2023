# IL Leaderboard (2023)

This is a leaderboard for individual-level (IL) speedruns based on Google Sheets/Google Apps Script (GAS). This repository itself contains a GAS project that can live on a sheet or independently (I think), which loads and stores data from several spreadsheets with different purposes.

Different parts of the leaderboard code can be forked and adapted to one's needs, and the codebase is meant to inspire variants rather than be used literally. The actual code here is all directly from live leaderboards, with an SMS variant and an SM64 variant, which can be seen here:

[Table View](https://docs.google.com/spreadsheets/d/1M_X3fvZPhbeQ2H1Arm24sHbtwWY5LEozQ4SBcMWiGPw) | [App View (SMS)](https://smsilview.netlify.app) | [App View (SM64)](https://sm64--smsilview.netlify.app)

The app is at a [separate repository](https://github.com/pyorot/sms-il-viewer). It polls via HTTP the data endpoint these scripts provide (at `0-Endpoint/API.js`).

The SMS and SM64 variants are kept in separate branches of this repository. The `A-`-named files substantially differ, as well as the parameters in `0-Settings.js`, but the rest of the code is identical, other than default parameters for non-endpoint functions (there for ease of testing), switches in features and text literal differences.

## Data Overview

The basic data being handled is speedrun records, which are times belonging to a player and a level, that may also have extra metadata, notably links and notes. Dates of submission are not tracked by this project. These times live on **record sheets**, whose axes are players and levels in different orders.

A. **Import**: Several such sheets are synthesised into a single data unit, taking for example best times across merged levels, or times from higher-priority sheets.

B. **Process**/**Verify**: The leaderboard engine then generates ranks, different rank-based aggregation metrics to give players overall ranks over (subsets of) the levels, as well as perhaps displaying numbers of entries and video-proof-requirement cutoff boundaries. There is also a feature that tracks changes to the leaderboard from a cached copy, and so allows moderators to verify runs one-by-one (i.e. commit them to the cache).

C. **Export**: The final data units are exported as JSON for the app to display, and/or into its own spreadsheet.

## Structure (Files)

An explanation, in the order of data flow and files that handle it. I tried to make the data flow simple and split up nicely between files.

**0-Settings.js** isn't included in the flow since it just contains basic configuration, mostly locations and metadata about different spreadsheets.

### Endpoints

**Submit.js**  
This is code attached to a Google Form that triggers on submission, and is installed as an Installable Trigger on the spreadsheet linked to the form. It allows a user to authenticate onto the form via a Google account, submit an edit to eir record for a level, and have that edited onto a record sheet that's included in the leaderboard. The user's email address is matched to a player name via a lookup-table sheet.

**Engine.js**  
This wraps the leaderboard engine, which is tasked with (A) importing record sheets, (B) processing their data (calculating metrics and verifying changes) and (C) exporting the result to JSON data and spreadsheet endpoints. These steps match the three in the previous section. It exposes an `update()` function that runs the engine, and a `tick()` function that wraps this with checking the source record sheets for edits via file last modified.

**API.js**  
One of the types of export endpoint is a JSON data store, which is in practice a spreadsheet whose cells are written to in order with literal JSON split into shards. This file turns that sheet into a HTTP endpoint, that recombines the shards and serves the JSON data to a URL.

**Stats.js**  
This loads data (either generating it directly with `Engine.js` or loading from a data store with `API.js`) and displays different kinds of data, like for example listing records above a certain rank/percentile that don't have video proof, or listing all videos of such ranking records so that they can be archived via `ytdlp --download-archive`.

### Engine Breakdown

**A-Import.js**  
This contains functions for fetching data from records sheets, parsing it into `Source` objects that wrap the raw tables and `Run` objects representing each detected run. It is responsible for producing `Data` objects that contain a 2D table of `Run`s, indexed by levels and players. The routines for parsing levels and players from the raw tables are kept in **A1-Levels.js** and **A2-Players.js**. These files are naturally very individualised to the source material, which is why two sets are included in this repository, for SM64 and SMS.

The levels generation also produces level metadata such as **Aggregates**, which are groups of levels that the viewer app exposes as a filter option for subsetting the leaderboard and ranking metrics.

*For SM64:* runs are loaded from two sheets, which partition the set of levels. One produced data unit keeps each level distinct, while the other merges levels that represent the same full star, taking best times across them, and discards partial stars. The levels headers on the sheets are very hard to parse so the code is quite long. For players, the same name can appear anywhere on the two sources, and some names must be parsed from combined columns. As such, the SM64 import code is the most general, constructing inverse indices that link a player or level to the row/column number it appears in in either sheet, then constructs and returns a combined data unit.

*For SMS:* runs are loaded from three sheets, which have identical level headers. These are run by different people and have data at different states of updatedness, so the records sheets cascade with later sheets overriding runs from earlier ones. This means the code is much more straightforward, with no need for a general inverse index, instead simply successively overwriting runs as each sheet and player row is processed.

**B-Process.js**  
This annotates runs, players and levels with overall stats. It generates **ranks** (number of runs a run is strictly beaten by + 1) and **points** (number of runs a run strictly beats + 1), which are the same except for tying runs upwards vs downwards. In other words, where e.g. a leaderboard comprises times of [0.01, 0.02, 0.02, 0.03], the 0.02 times have rank 2 and points 2, so are closer to 0.01 by rank and 0.03 by points. These can be normalised by dividing by total entries to get **points/rank quality**.

Different scores can be used to rank players, like **total points**, **l1 norm** (total error, where error = rank - 1), **l∞ norm** (maximum error), and **normalised metrics** that divide these by the total entries across the levels. The data is sorted by one of these scores. There are also **medal counts** (rank 1/2/3 counts), as well as entry counts and video proof counts (counting links). Levels have **total entries** and **cutoffs** (rank/rank quality-based limits intended for video proof cutffs).

The SMS leaderboard has some extra tweaks whereby some (version-variant) levels fit pairs where only the better-scoring one is included in total scores, and some (degenerate) levels are ignored from medal counts.

**B-Verify.js**  
This compares a completed data unit to a copy cached on a spreadsheet (this could also be implemented using a JSON data cached copy, but the spreadsheet has the advantage of tracking per-cell edit history). Differences are listed on a verification spreadsheet, which has the option to commit them into the cache. That's how leaderboard verification is done.

**C-Export.js**  
Contains functions that export a data unit to a JSON data cache (by sharding it and saving to a spreadsheet that's read by **0-Endpoint/API.js**) or to a spreadsheet, which is neatly formatted for presentation.

## Vs Previous Version
Compared to the previous version of this project, [il-leaderboard-2021](https://github.com/pyorot/il-leaderboard-2021), the leaderboard has taken the direction of separating model from view, so the integrated spreadsheet where submissions are edited into a table and update stats in its headers has been replaced by separate [submission forms](https://docs.google.com/forms/d/1GdC3QNtlsd8Xr1i47V0VOI2Tz5__McBZzRKH42u2KiM), [source sheets](https://docs.google.com/spreadsheets/u/0/d/1Ibq5m31pU1ZVfh4Dlo2r2Mnmk3WBiZwt6lja5bZSE1Q), [presentation sheets](https://docs.google.com/spreadsheets/d/1M_X3fvZPhbeQ2H1Arm24sHbtwWY5LEozQ4SBcMWiGPw) and [viewer apps](https://smsilview.netlify.app/). This makes the code much simpler and less prone to desyncs. Hence, there is no need for protected ranges anymore, and the form system can be extended to remove the need for a single sheet owner to add people as editors, by automating email registration.

Source loading is now done using `UrlFetchApp` via Sheets API and an API key, which is [orders of magnitude faster](https://stackoverflow.com/a/77683430/6149041) than any other known method. API keys only grant read-only access, so table export still uses `SpreadsheetApp` (which is not needed for the viewer app – processing to only output JSON for the app is blazingly fast). Hence, there is no need for a backend sheet anymore.
