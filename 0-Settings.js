// Global Variables

// == 1 | PARAMS ==
// File IDs (where URL = https://docs.google.com/spreadsheets/d/<ID>):
FILE_THIS      = "1jGGJ6cGqdc3iMg8TDwD_0B_p6PMRmS6cz2t_OxDmIDY"
FILE_IN_ULT    = "1J20aivGnvLlAuyRIMMclIFUmrkHXUzgcDmYa31gdtCI" // import sheet: xcam ultimate
FILE_IN_EXT    = "1X06GJL2BCy9AXjiV9Y8y-7KKkj4d9YI3dtTb2HVOyRs" // import sheet: xcam extensions
FILE_OUT_TABLE = "1M_X3fvZPhbeQ2H1Arm24sHbtwWY5LEozQ4SBcMWiGPw" // export sheet: table

// == 2 | I/O ==
// id: sheet id, tab: tab name, r,c: row/col index of first run (first = 0), pAxis: "r"/"c" if players have rows/cols
// dataIndex: index of data unit produced to export to this destination
SRC_ADDRESSES = [ // source tables
  {id: FILE_IN_ULT, tab: "Ultimate Star Spreadsheet v2", r:1, c:6, pAxis:"c"},
  {id: FILE_IN_EXT, tab: "Ultimate Sheet Extensions"   , r:1, c:6, pAxis:"c"},
]
DST_ADDRESSES = [ // destination data/tables // index: 0 = sm64/ult, 1 = sm64/il
  {type: "data" , index: 0, id: "this", tab: "DataStrats"},
  {type: "data" , index: 1, id: "this", tab: "DataLevels"},
  {type: "table", index: 1, id: FILE_OUT_TABLE, tab: "SM64 XCam", r:1, c:7, score:"l1"},
]

// function for reducing multiple runs into a best run
REDUCE_FUNCTION = (r1, r2) => (r2.time ?? Infinity) < (r1.time ?? Infinity) ? r2 : r1  // best time wins
              //= (r1, r2) => r2                                                       // last run in data wins
              //= (r1, r2) => (!r2.time && r2.value) ? r2 : r1, new Run()              // misformatted wins

// == 3 | LOGS ==
var SHEET_DASH = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dash")   // used for status logging
var [LOG_NAME_CHANGE, LOG_TIME_REVERT, LOG_ERROR] = [[], [], []]                // logged to Dash sheet
console.log("initialised")
