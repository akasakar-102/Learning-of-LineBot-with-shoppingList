const CHANNEL_ACCESS_TOKEN = 'jVJ2Kkvis06PneljMM3K3IoJutzVVnrs9dM9B6lbt82Kim72ViEmfrAg3ftcEn1paUTWqrZkHJF2HUc+Q/2J/ddSTn+gRu9pxaavjVkovGgqxhSqun3RQCMrbzHC/wQel7oBZgoVJ+vsXGLUN9GS0QdB04t89/1O/w1cDnyilFU='; 
const line_endpoint = 'https://api.line.me/v2/bot/message/reply';
const GET_SHOPPING_LIST = '確認'
const ADD_SHOPPING_LIST = '追加'
const DELETE_SHOPPING_LIST = '削除'
const HAS_BOUGHT = '買ったよ'
const HELP = '使い方'
const OTHER_KEYWORD = ['とら','なでなで','にゃ']
const OTHER_MESSAGE = ['にゃ～ん','にゃ～～ん','にゃ～～～ん','にゃ～～～～ん','ゴロゴロ','めし(ΦωΦ)','どうも、とらです','ちょっと何言ってるか分かんない。']
var listSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('shopping');

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
  
  if(replyContent == "") {
    return;
  }
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
  if (message.indexOf(HELP) != -1) {
    return sendHelp();
  }
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
  if (matchedOtherKeyWord(message)) {
    return otherMessage();
  }
  return "";
}

function sendHelp() {
  var helpText = '使い方にゃん \n'
  helpText += 'リストを確認\n　…「"確認"」\n'
  helpText += 'リストに追加\n　…「○○ "を" "追加"」\n'
  helpText += '　または「○○ "、" "追加"」\n'
  helpText += 'リストから削除\n　…「n(数字) "を" "削除"」\n'
  helpText += '　または「n(数字) "、" "削除"」\n'
  helpText += '※"削除"の代わりに"買ったよ"でもいいにゃん'
  return helpText;
}

function matchedOtherKeyWord(message) {
  for(var keyWord of OTHER_KEYWORD) {
    if(message.indexOf(keyWord) != -1) {
      return true;
    }
  }
  return false;
}


function otherMessage() {
  var index = Math.floor(Math.random() * OTHER_MESSAGE.length);
  return OTHER_MESSAGE[index];
}

function sendShopList() {
  var shoppingListRange = listSheet.getRange(2, 1, 100, 3);
  var resultList = makeResultList(shoppingListRange);
  if(resultList.length < 1) {
    return 'お買い物リストは空だにゃん、早く帰ってきて～(=￣ω￣=)';
  }

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
  var returnMessage = '';
  var toBeDeleteRowsList = [];
  var indexInMessage = message.split(/[、を]/)[0].split(',');
  var shoppingListRange = listSheet.getRange(2, 1, 100, 3);
  for(var index of indexInMessage) {
    for(var j = 0; j < shoppingListRange.getValues().length; j++) {
      if(shoppingListRange.getValues()[j][0] == index) {
        var itemFromIndex = shoppingListRange.getValues()[j][1];
        if(itemFromIndex == '') {
          returnMessage += '番目には何も入っていないにゃん、アホ！';
          continue;
        }
        var rowNum = j + 2;
        toBeDeleteRowsList.push(rowNum);
        returnMessage += itemFromIndex + 'をリストから削除したにゃん \n'
        break;
      }
    }
  }
  deleteList(listSheet,toBeDeleteRowsList);
  return returnMessage + sendShopList();
}

function deleteList(listSheet,toBeDeleteRowsList) {
  //toBeDeleteRowsListを降順にする
  var list = toBeDeleteRowsList.sort(sorting_desc);
  for(var delRow of list) {
    listSheet.deleteRows(delRow, 1);
    listSheet.getRange(99,1,1,1).copyTo(listSheet.getRange(100,1,1,1));
  }
}

function sorting_desc(a, b){
  if(a > b){
    return -1;
  }else if(a[0] < b[0] ){
    return 1;
  }else{
   return 0;
  }
}