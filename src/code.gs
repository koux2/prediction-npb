function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.initialPage = e.parameter.page || 'input';
  
  return template.evaluate()
    .setTitle('NPB順位予想ツール')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('predictions');
  if (!sheet) {
    return JSON.stringify({ status: 'error', message: 'Sheet not found' });
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return JSON.stringify(result);
}

function saveData(dataObj) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('predictions');
    if (!sheet) {
      return JSON.stringify({ status: 'error', message: 'Sheet not found' });
    }

    const timestamp = new Date();
    const name = dataObj.name;
    const central = dataObj.central || []; 
    const pacific = dataObj.pacific || []; 
    
    // バリデーション
    if (!name || central.length !== 6 || pacific.length !== 6) {
       return JSON.stringify({ status: 'error', message: 'Invalid data' });
    }
    
    // 重複チェック (Update)
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === name) { // Index 1 is 'Name'
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    const newRow = [
      timestamp,
      name,
      ...central,
      ...pacific
    ];

    if (rowIndex > 0) {
      // Update
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      // Insert
      sheet.appendRow(newRow);
    }

    return JSON.stringify({ status: 'success', message: 'Data saved' });

  } catch (error) {
    return JSON.stringify({ status: 'error', message: error.toString() });
  }
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('predictions');
  if (!sheet) {
    sheet = ss.insertSheet('predictions');
  }
  
  const headers = [
    'Timestamp', 'Name', 
    'Central1', 'Central2', 'Central3', 'Central4', 'Central5', 'Central6',
    'Pacific1', 'Pacific2', 'Pacific3', 'Pacific4', 'Pacific5', 'Pacific6'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
