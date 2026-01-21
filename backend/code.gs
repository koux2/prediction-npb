function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('predictions');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
      .setMimeType(ContentService.MimeType.JSON);
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

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('predictions');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // POSTデータはJSON形式で送られてくると仮定、もしくはパラメータとして受け取る
    // 今回はapplication/jsonでの送信を想定
    let params;
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter;
    }

    const timestamp = new Date();
    const name = params.name;
    const central = params.central || []; // Array of 6 teams
    const pacific = params.pacific || []; // Array of 6 teams
    
    // バリデーション
    if (!name || central.length !== 6 || pacific.length !== 6) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 同一ユーザー名の既存データがあれば更新、なければ新規追加
    // ここではシンプルに追記のみとするが、要望があればUpdate処理を入れる
    // 重複チェック
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

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
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
