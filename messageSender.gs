const CHANNEL_ACCESS_TOKEN = 'jVJ2Kkvis06PneljMM3K3IoJutzVVnrs9dM9B6lbt82Kim72ViEmfrAg3ftcEn1paUTWqrZkHJF2HUc+Q/2J/ddSTn+gRu9pxaavjVkovGgqxhSqun3RQCMrbzHC/wQel7oBZgoVJ+vsXGLUN9GS0QdB04t89/1O/w1cDnyilFU='; 
const line_endpoint = 'https://api.line.me/v2/bot/message/reply';
const GET_SHOPPING_LIST = '確認'
const ADD_SHOPPING_LIST = '追加'
const DELETE_SHOPPING_LIST = '削除'
const HAS_BOUGHT = '買ったよ'
var listSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('list');

function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  console.log("get a request");

  //返信Token
  var reply_token= json.events[0].replyToken;
  if (typeof reply_token === 'undefined') {
    return;
  }
  //メッセージ取得
  var message = json.events[0].message.text;  
  var replyContent = makeMessage(message);
  // メッセージを返信    
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': [{
        'type': 'text',
        'text': replyContent,
      }],
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function makeMessage(message) {
  if (message.indexOf(GET_SHOPPING_LIST) != -1) {
    return sendShopList();
  }
  if (message.indexOf(ADD_SHOPPING_LIST) != -1) {
    return addShopList(message);
  }
  if (message.indexOf(DELETE_SHOPPING_LIST) != -1) {
    return deleteShopList(message);
  }
  if (message.indexOf(HAS_BOUGHT) != -1) {
    return deleteShopList(message);
  }
  return "ちょっと何言ってるか分かんない。";
}

function sendShopList() {
  var shoppingListRange = listSheet.getRange(2, 1, 100, 3);
  var resultList = makeResultList(shoppingListRange);

  var replyContent = 'お買い物リストはこんな感じにゃ \n';
  for(var row of resultList) {
    replyContent += '\n'
    replyContent += row[0];
    replyContent += '.'
    replyContent += row[1];
    if(row[2] != ''){
      replyContent += '  '
      replyContent += row[2];
    }
  }
  replyContent += '\n\n'
  replyContent += 'お買い物よろしくにゃん'
  return replyContent;
}

function makeResultList(shoppingListRange) {
  var allList = shoppingListRange.getValues();
  var result = [];
  for(var list of allList) {
    if(list[1] != "") {
      result.push(list);
    }
  }
  return result;
}


function addShopList(message) {
  var itemInMessage = message.split(/[、を]/)[0];
  var shoppingListRange = listSheet.getRange(2, 1, 100, 3);
  for (var i = 0; i < shoppingListRange.getValues().length; i++) {
    if(shoppingListRange.getValues()[i][1] == '') {
      var rowNum = i+2;
      if(itemInMessage.split('$').length > 1) {
        listSheet.getRange(rowNum, 3).setValue(itemInMessage.split('$')[1]);
        itemInMessage = itemInMessage.split('$')[0];
      }
      listSheet.getRange(rowNum, 2).setValue(itemInMessage);
      break;
    }
  }
  return itemInMessage + 'をリストに加えたにゃん \n' + sendShopList();
}


function deleteShopList(message) {
  var indexInMessage = message.split(/[、を]/)[0];
  var listSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('list');
  var shoppingListRange = listSheet.getRange(2, 1, 100, 3);
  for (var j = 0; j < shoppingListRange.getValues().length; j++) {
    if(shoppingListRange.getValues()[j][0] == indexInMessage) {
      var itemFromIndex = shoppingListRange.getValues()[j][1];
      if(itemFromIndex == '') {
        return indexInMessage + '番目には何も入っていないにゃん、アホ！';
      }
      var rowNum = j + 2;
      listSheet.deleteRows(rowNum, 1);
      listSheet.getRange(99,1,1,1).copyTo(listSheet.getRange(100,1,1,1));
      break;
    }
  }
  return itemFromIndex + 'をリストから削除したにゃん \n' + sendShopList();
}