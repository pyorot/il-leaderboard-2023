// Global Variables

// == 1 | PARAMS ==
// File IDs (where URL = https://docs.google.com/spreadsheets/d/<ID>):
FILE_THIS      = "1c5dAcjdofMc1Ux2rOP00vJWtVPQpqr3Eq5X2Lr3EvOQ"
FILE_IN_OFF    = "12wDUXjLqmcUuWSEXWc1fHNJc24KlfyCh0pvibZYEQM0" // import sheet: 1
FILE_IN_ALT    = "1Ibq5m31pU1ZVfh4Dlo2r2Mnmk3WBiZwt6lja5bZSE1Q" // import sheet: 2
FILE_OUT_TABLE = "1M_X3fvZPhbeQ2H1Arm24sHbtwWY5LEozQ4SBcMWiGPw" // export sheet: table
FILE_OUT_DATA  = "1kCgI8ljPl-KocfQ1HpL-Up579TG_e37n6eOyyIATQRo" // export sheet: data
               //"11_d9qnkhQABmHGsPRUPrc1kl0nLMixe7wOif4-WpAyk" // decommissioned backend sheet

// == 2 | I/O ==
// id: sheet id, tab: tab name, r,c: row/col index of first run (first = 0), pAxis: "r"/"c" if players have rows/cols
// dataIndex: index of data unit produced to export to this destination
SRC_ADDRESSES = [ // source tables
  {id: FILE_IN_OFF, tab: "ILs", r: 4, c: 7, pAxis:"r"},         // original sheet
  {id: FILE_IN_ALT, tab: "ILs", r: 4, c: 7, pAxis:"r"},         // alt sheet
  {id: FILE_THIS,   tab: "Add", r: 4, c: 7, pAxis:"r"},         // mod add sheet
]
DST_ADDRESSES = [ // destination data/tables // index: 0 = sms/il
  {type: "data" , index: 0, id: FILE_OUT_DATA,  tab: "JSONCache"},
  {type: "table", index: 0, id: FILE_OUT_TABLE, tab: "SMS Accurate", r:4, c:7, score:"points"},
]
VCACHE_ADDRESS = {id: FILE_THIS, tab: "VCache", r: 4, c: 7, pAxis:"r"} // verification cache table

// == 3 | LOGS ==
var SHEET_DASH = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dash")   // used for status logging
var [LOG_NAME_CHANGE, LOG_TIME_REVERT, LOG_ERROR] = [[], [], []]                // logged to Dash sheet
console.log("initialised")
