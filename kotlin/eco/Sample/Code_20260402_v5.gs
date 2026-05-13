/**
 * 구글 시트 메뉴 생성
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('주식 DB 관리')
      .addItem('종목 관리', 'showStockForm')
      .addItem('Dashboard', 'updateDashboard')
      .addItem('ISA DashBoard', 'updateISADashboard')
      .addItem('IRP DashBoard', 'updateIRPDashboard')
      .addItem('연금저축 DashBoard', 'updatePensionDashboard')
      .addItem('일반계좌 DashBoard', 'updateNormalDashboard')
      .addItem('포트폴리오 요약 업데이트', 'updatePortfolioSummary')
      .addItem('연금저축2 DashBoard', 'updatePension2Dashboard')
      .addToUi();

  ui.createMenu('주식 관리')
      .addItem('주식 매수/매도 입력', 'showTradeForm')
      .addItem('배당금 입력', 'showDividendForm')
      .addItem('이전 매매 이력 불러오기', 'loadPreviousTrades')
      .addToUi();
}

/**
 * 네이버 금융에서 실시간 주가 가져오기
 */
function NAVER_PRICE(code) {
  if (!code) return "N/A";
  try {
    var url = "https://finance.naver.com/item/sise.naver?code=" + code;
    var response = UrlFetchApp.fetch(url);
    var html = response.getContentText();
    var priceMatch = html.match(/<span class="blind">([\d,]+)<\/span>/);
    return priceMatch ? priceMatch[1] : "N/A";
  } catch (e) {
    return "Error";
  }
}

/**
 * 종목 관리 팝업 (HTML 서브셋 호출)
 */
function showStockForm() {
  var html = HtmlService.createHtmlOutputFromFile('StockForm')
      .setWidth(400)
      .setHeight(500)
      .setTitle('종목 관리');
  SpreadsheetApp.getUi().showModalDialog(html, '종목 관리');
}

// 매수/매도 입력 팝업 띄우기
function showTradeForm() {
  var html = HtmlService.createHtmlOutputFromFile('TradeForm')
      .setWidth(500)
      .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '주식 매수/매도 입력');
}

// 배당금 입력 팝업 띄우기
function showDividendForm() {
  var html = HtmlService.createHtmlOutputFromFile('DividendForm')
      .setWidth(500)
      .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '배당금 입력');
}

// 주식 종목 정보 추가
function addStock(stockName, type, ticker) {
  var sheetName = '종목 관리';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  // 시트가 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Index', '종목명', '해외/국내', 'Ticker']);
  }

  // 인덱스 자동 증가
  var lastRow = sheet.getLastRow();
  var newIndex = lastRow;

  sheet.appendRow([newIndex, stockName, type, `'${ticker}`]); // Ticker를 문자열로 처리
}

// 해외/국내 정보 가져오기
function getStockMarketType(stockName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('종목 관리');
  if (sheet) {
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][1] === stockName) {
        return data[i][2];
      }
    }
  }
  return '';
}

// 주식 매수/매도 정보 추가
// BUG⑥ 수정: 가격/금액을 문자열이 아닌 숫자로 저장. 포맷은 시트 셀 서식으로 처리
function addTrade(year, month, day, stockName, tradePrice, stockAmount, /*totalAmount,*/ /*marketType,*/ tradeType, accountType, broker) {
  var sheetName = '매수/매도';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  var marketType = getStockMarketType(stockName);
  var tradePriceNum = parseFloat(tradePrice);
  var stockAmountNum = parseFloat(stockAmount);
  var totalAmount = tradePriceNum * stockAmountNum;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['년도', '월', '일', '종목명', '매수/매도 가격', '주식 수', '총 금액', '해외/국내', '거래유형', '매수/매도 계좌', '증권사']);
  }

  // 숫자로 저장하고 포맷만 설정 (기존에는 "$123.45" 문자열로 저장하여 수식 연산 불가)
  var newRow = sheet.getLastRow() + 1;
  sheet.appendRow([year, month, day, stockName, tradePriceNum, stockAmountNum, totalAmount, marketType, tradeType, accountType, broker]);

  if (marketType === '해외') {
    sheet.getRange(newRow, 5).setNumberFormat('$#,##0.00'); // 가격
    sheet.getRange(newRow, 7).setNumberFormat('$#,##0.00'); // 총금액
  } else {
    sheet.getRange(newRow, 5).setNumberFormat('#,##0'); // 가격
    sheet.getRange(newRow, 7).setNumberFormat('#,##0'); // 총금액
  }
}

function getStockNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('종목 관리');
  if (sheet) {
    var data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    return data.flat();
  }
  return [];
}


// 배당금 직접 입력
// BUG④ 수정: 파라미터 오타 수정(borker→broker, accoutType→accountType), appendRow 컬럼 순서 수정
function addDividendDirect(year, month, day, stockName, stockAmount, dividendAmount, broker, accountType) {
  var sheetName = '배당금 입력';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['년도', '월', '일', '종목명', '주식 수', '배당금', '해외/국내', '주당배당금', '매수/매도 계좌', '증권사']);
  }

  var marketType = getStockMarketType(stockName);

  if (marketType === '해외') {
    dividendAmount = `$${parseFloat(dividendAmount).toFixed(2)}`;
  } else {
    dividendAmount = parseFloat(dividendAmount).toLocaleString('ko-KR');
  }

  // 헤더 순서: 년도, 월, 일, 종목명, 주식 수, 배당금, 해외/국내, 주당배당금, 매수/매도 계좌, 증권사
  sheet.appendRow([year, month, day, stockName, stockAmount, dividendAmount, marketType, '', accountType, broker]);
}

// 배당 알림 문자를 넣어서 추가하기
function addDividendFromMessage(year, month, day, message, brokerage, accountDefinition) {
  var parsedData;
  var bokerageKor="";

  switch(brokerage) {
    case 'samsung':
      parsedData = parseSamsungSecuritiesDividendMessage(message);
      bokerageKor = "삼성"
      break;
    case 'nh':
      parsedData = parseNHInvestmentSecuritiesDividendMessage(message);
      bokerageKor = "NH"
      break;
    case 'shinhanc':
      parsedData = parseShinhanInvestmentSecuritiesDividendMessage(message);
      bokerageKor = "신한"
      break;
    case 'toss':
      // BUG⑤(개선) 수정: Toss 미구현 시 에러 대신 명확한 안내
      SpreadsheetApp.getUi().alert('Toss증권 배당금 문자 파싱은 아직 구현되지 않았습니다.\n직접 입력 방식을 사용해주세요.');
      return;
    case 'kiwoom':
      parsedData = parseKiwoomSecuritiesDividendMessage(message);
      bokerageKor = "키움"
      break;
    default:
      throw new Error('Unknown brokerage: ' + brokerage);
  }

  var stockName = parsedData.stockName;
  var dividendAmount = parsedData.dividendAmount;
  var stockAmount, dividendPerShareMatch = 0;//(dividendAmount / parsedData.dividendPerShare).toFixed(2);
  dividendPerShareMatch = parsedData.dividendPerShareMatch;
  var marketType = getStockMarketType(stockName);

  if (marketType === '해외') {
    dividendAmount = `$${dividendAmount.toFixed(2)}`;
  } else {
    dividendAmount = dividendAmount.toLocaleString('ko-KR');
  }

  var sheetName = '배당금 입력';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['년도', '월', '일', '종목명', '주식 수', '배당금', '해외/국내', '주당배당금', '증권사', '매수/매도 계좌']);
  }

  sheet.appendRow([year, month, day, stockName, stockAmount, dividendAmount, marketType, dividendPerShareMatch, bokerageKor, accountDefinition]);
}

function createRowData(match, today, brokerage, message) {
  console.log("createRowData E. brokerage : " + brokerage);
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // 0-indexed to 1-indexed
  var day = today.getDate();
  var stockAmount, dividendPerShare = 0;
  var stockName, totalDividendPreTax, dividendAmount, currency, taxes;

  switch (brokerage) {
    case 'Samsung':
      var stockNameRegex = /- 종목명\s*:\s*([^,\n]+)/;
      var dividendAmountRegex = /- 배당금\s*:\s*([\d.]+)\(USD\)/;
      var dividendPerShareRegex = /- 주당배당금\s*:\s*([\d.]+)\(USD\)/;

      var stockNameMatch = message.match(stockNameRegex);
      var dividendAmountMatch = message.match(dividendAmountRegex);
      var dividendPerShareMatch = message.match(dividendPerShareRegex);

      var stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
      var dividendAmount = dividendAmountMatch ? parseFloat(dividendAmountMatch[1].trim()) : 0;
      var dividendPerShare = dividendPerShareMatch ? parseFloat(dividendPerShareMatch[1].trim()) : 0;
      break;
    case 'Shinhan':
      stockName = match[1];
      totalDividendPreTax = match[2];
      currency = match[3];
      dividendAmount = match[4];
      taxes = '';
      break;
    case 'NH':
      stockName = match[5].trim();
      totalDividendPreTax = match[4];
      currency = match[3];
      dividendAmount = '';
      taxes = '';
      break;
    case 'Kiwoom':
      stockName = match[1];
      totalDividendPreTax = match[2];
      currency = match[3];
      dividendAmount = match[4];
      taxes = match[5]; // 외국납부세액
      break;
  }

  var sheetName = '배당금 입력';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['년도', '월', '일', '종목명', '주식 수', '배당금', '해외/국내', '주당배당금']);
  }

  var marketType = getStockMarketType(stockName);

  if (marketType === '해외') {
    dividendAmount = `$${parseFloat(dividendAmount).toFixed(2)}`;
  } else {
    dividendAmount = parseFloat(dividendAmount).toLocaleString('ko-KR');
  }

  sheet.appendRow([year, month, day, stockName, stockAmount, dividendAmount, marketType, dividendPerShare]);
}

function parseSamsungSecuritiesDividendMessage(message) {
  if (message.includes('퇴직연금')) {
    return parseSamsungSecuritiesPensionDividendMessage(message);
  }
  
  // 정규 표현식을 사용하여 종목명, 배당금, 주당 배당금을 추출합니다.
  var stockNameRegex = /- 종목명\s*:\s*([^,\n]+)/;
  var dividendAmountRegex = /- 배당금\s*:\s*([\d.]+)\(USD\)/;
  var dividendPerShareRegex = /- 주당배당금\s*:\s*([\d.]+)\(USD\)/;

  var stockNameMatch = message.match(stockNameRegex);
  var dividendAmountMatch = message.match(dividendAmountRegex);
  var dividendPerShareMatch = message.match(dividendPerShareRegex);

  var stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
  var dividendAmount = dividendAmountMatch ? parseFloat(dividendAmountMatch[1].trim()) : 0;
  var dividendPerShare = dividendPerShareMatch ? parseFloat(dividendPerShareMatch[1].trim()) : 0;

  return {
    stockName: stockName,
    dividendAmount: dividendAmount,
    dividendPerShare: dividendPerShare
  };
}

// 삼성증권 퇴직연금 배당금 문자 메시지를 파싱하는 함수
function parseSamsungSecuritiesPensionDividendMessage(message) {
  var stockNameMatch = message.match(/- 상품명 : (.+)/);
  var dividendAmountMatch = message.match(/- 입금액 : ([\d,]+)원/);

  var stockName = stockNameMatch ? stockNameMatch[1] : '';
  var dividendAmount = dividendAmountMatch ? parseFloat(dividendAmountMatch[1].replace(',', '')) : 0;

  return {
    stockName: stockName,
    dividendAmount: dividendAmount,
    perShareDividend: 0 // 퇴직연금의 경우 주당 배당금 정보는 없음
  };
}

function parseNHInvestmentSecuritiesDividendMessage(message) {
  var stockNameRegex = /1\. 종목명\s*:\s*([^,\n]+)/;
  var dividendAmountRegex = /세후금액\s*:\s*([\d,]+)원/;
  var dividendPerShareRegex = /주당 배당금\s*:\s*([\d,]+)원/;  // 주당 배당금이 명시된 경우

  var stockNameMatch = message.match(stockNameRegex);
  var dividendAmountMatch = message.match(dividendAmountRegex);
  var dividendPerShareMatch = message.match(dividendPerShareRegex);

  var stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
  var dividendAmount = dividendAmountMatch ? parseInt(dividendAmountMatch[1].replace(/,/g, '').trim()) : 0;
  var dividendPerShare = dividendPerShareMatch ? parseInt(dividendPerShareMatch[1].replace(/,/g, '').trim()) : 0;

  return {
    stockName: stockName,
    dividendAmount: dividendAmount,
    dividendPerShare: dividendPerShare
  };
}

function parseShinhanInvestmentSecuritiesDividendMessage(message) {
  var stockNameRegex = /종목\s*:\s*([^,\n]+)/;
  var dividendAmountRegex = /해외배당금\s*:\s*\(세전\)\s*([\d.]+)\s*USD\s*\/\s*\(세후\)\s*([\d.]+)\s*USD/;
  var dividendPerShareRegex = /해외배당금\s*:\s*\(세전\)([\d.]+)\s*USD/;

  var stockNameMatch = message.match(stockNameRegex);
  var dividendAmountMatch = message.match(dividendAmountRegex);
  var dividendPerShareMatch = message.match(dividendPerShareRegex);

  var stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
  var dividendAmount = dividendAmountMatch ? parseFloat(dividendAmountMatch[2].trim()) : 0;
  var dividendPerShare = 0;//dividendPerShareMatch ? parseFloat(dividendPerShareMatch[1].trim()) : 0;

  return {
    stockName: stockName,
    dividendAmount: dividendAmount,
    dividendPerShare: dividendPerShare
  };
}

function parseKiwoomSecuritiesDividendMessage(message) {
  var stockNameRegex = /종목명\s*:\s*([^\n]+)/;
  var dividendAmountRegex = /배당금액\s*:\s*([\d.]+)\s*USD\s*\(세전\)\s*\/\s*([\d.]+)\s*USD\s*\(세후\)/;

  var stockNameMatch = message.match(stockNameRegex);
  var dividendAmountMatch = message.match(dividendAmountRegex);

  var stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
  var dividendAmount = dividendAmountMatch ? parseFloat(dividendAmountMatch[1].trim()) : 0;

  return {
    stockName: stockName,
    dividendAmount: dividendAmount
  };
}

// Dash board 시트를 업데이트하는 함수
// 매수/매도 시트의 데이터를 기반으로 종목별 총 주식수, 평균 단가를 계산합니다.
// 종목별 데이터를 Dash board 시트에 추가하고, 현재가, 수익률, 수익금액, 자산가치를 계산합니다.
function updateDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // 현재 활성 스프레드시트를 가져옴
  var tradeSheet = ss.getSheetByName('매수/매도'); // 매수/매도 시트를 가져옴
  var dashboardSheet = ss.getSheetByName('Dash board'); // Dash board 시트를 가져옴
  
  // Dash board 시트가 없으면 새로 생성하고, 있으면 기존 내용을 지움
  if (!dashboardSheet) {
    dashboardSheet = ss.insertSheet('Dash board');
  } else {
    dashboardSheet.clear(); // 기존 내용을 지우고 새로 작성
  }

  // 환율 가져오기
  var exchangeRate = getExchangeRate('Dash board');

  // Dash board 시트의 헤더 작성
  dashboardSheet.appendRow(['Index', '종목명', '총 주식수', '평균 단가', '총 투자금', '현재가', '자산가치', '수익금액', '수익률', '투자금 (USD)', '자산 (USD)', '자산 (KRW)', '비중']);

  var trades = tradeSheet.getDataRange().getValues(); // 매수/매도 시트의 모든 데이터를 가져옴
  var profile = {}; // 각 종목별 데이터를 저장할 객체
  
  var totalInvestmentUSD = 0;
  var totalAssetValueUSD2222 = 0; // 20240610
  var totalProfitAmountUSD = 0;
  
  // 매수/매도 데이터를 기반으로 종목별 총 주식수, 평균 단가 계산
  for (var i = 1; i < trades.length; i++) {
    var trade = trades[i];

    var stock = trade[3]; // 종목명
    var type = trade[8];  // 매수/매도
    var amount = trade[5]; // 주식수
    var price = trade[4]; // 메수, 매도 가격
    // var account = trade[9]; // 필요 시 계좌별 필터링용
	
    if (!profile[stock]) {
      // 종목별로 데이터를 초기화
      profile[stock] = { totalAmount: 0, totalCost: 0, ticker: getStockTicker(stock) };
    }
    
    if (type === '매수') {
      // 매수인 경우 총 주식수와 총 비용에 더함
      profile[stock].totalAmount += amount;
      profile[stock].totalCost += amount * price;
    } else if (type === '매도') {
	  // 에러 발생 지점: 이 윗줄에 var currentAvgPrice 선언이 없으면 에러가 납니다.
      var currentAvgPrice = profile[stock].totalCost / profile[stock].totalAmount;
	  
      // 매도인 경우 총 주식수와 총 비용에서 뺌
      profile[stock].totalAmount -= amount;
      //profile[stock].totalCost -= amount * price;
	  // 매도 가격이 아닌 '기존 평단'만큼 비용 상계 (실제 이동평균법 원리)	  
      profile[stock].totalCost -= (amount * currentAvgPrice);
    }
  }

  var index = 1;
  var currentRow = 2; // 현재가를 위한 행 인덱스

  // 각 종목별로 계산된 데이터를 Dash board 시트에 추가
  for (var stock in profile) {
    var data = profile[stock];

    var totalAmount = data.totalAmount;
    var avgPrice = totalAmount ? data.totalCost / totalAmount : 0;  // 평균 단가 계산
    var totalInvestment = data.totalCost;
    var marketType = getStockMarketType(stock); // 해외/국내 정보 가져오기
    var avgPriceFormatted, totalInvestmentFormatted, totalInvestmentUSDFormatted, assetValueUSDFormatted;

    // 평균 단가 포맷팅
    if (marketType === '해외') {
      avgPriceFormatted = `$${avgPrice.toFixed(2)}`;
      totalInvestmentFormatted = `$${totalInvestment.toFixed(2)}`;
      totalInvestmentUSDFormatted = totalInvestment.toFixed(2);
      assetValueUSDFormatted = ''; // 초기화 20240610
    } else {
      avgPriceFormatted = avgPrice.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      totalInvestmentFormatted = totalInvestment.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      totalInvestmentUSDFormatted = (totalInvestment / exchangeRate).toFixed(2);
      assetValueUSDFormatted = ''; // 초기화 20240610
    }

    // GOOGLEFINANCE 함수를 사용하여 현재가를 가져오는 공식 설정 NAVER_PRICE
    var currentPriceFormula =`=IFERROR(GOOGLEFINANCE("${data.ticker}", "price"), NAVER_PRICE("${data.ticker}"))`;
    
    // Dash board 시트에 행 추가
    dashboardSheet.appendRow([index++, stock, totalAmount, avgPriceFormatted, totalInvestmentFormatted, currentPriceFormula, '', '', '', totalInvestmentUSDFormatted, assetValueUSDFormatted]);
    currentRow++;
  }

  // 수익률, 수익금액, 자산가치 계산을 위한 셀 공식 설정
  for (var i = 3; i <= dashboardSheet.getLastRow(); i++) {
    var totalAmountCell = dashboardSheet.getRange(i, 3).getA1Notation(); // 총 주식수 셀
    var avgPriceCell = dashboardSheet.getRange(i, 4).getA1Notation(); // 평균 단가 셀
    var totalInvestmentCell = dashboardSheet.getRange(i, 5).getA1Notation(); // 총 투자금 셀

    var currentPriceCell = dashboardSheet.getRange(i, 6).getA1Notation(); // 현재가 셀    
    var assetValueCell = dashboardSheet.getRange(i, 7).getA1Notation(); // 자산가치 셀

    var profitAmountCell = dashboardSheet.getRange(i, 8).getA1Notation(); // 수익금액 셀
    var profitRateCell = dashboardSheet.getRange(i, 9).getA1Notation(); // 수익률 셀

    var totalInvestmentUSDCell = dashboardSheet.getRange(i, 10).getA1Notation(); // 투자금 (USD) 셀
    var assetValueUSDCell = dashboardSheet.getRange(i, 11).getA1Notation(); // 자산 (USD) 셀
    var assetValueKRWCell = dashboardSheet.getRange(i, 12).getA1Notation(); // 자산 (KRW) 셀

    var marketType = getStockMarketType(dashboardSheet.getRange(i, 2).getValue()); // 종목명으로 해외/국내 정보 가져오기
 
    var assetValueFormula = `=${currentPriceCell}*${totalAmountCell}`;
    var profitAmountFormula = `=${assetValueCell}-${totalInvestmentCell}`;
    var profitRateFormula = `=IF(${totalInvestmentCell}>0, ${profitAmountCell}/${totalInvestmentCell}, 0)`;
    // 자산 (KRW) 공식 설정
    var assetValueKRWFormula = marketType === '해외' ? `=${assetValueUSDCell}*${exchangeRate}` : `=${assetValueCell}`;

    
    dashboardSheet.getRange(i, 7).setFormula(assetValueFormula); // 자산가치 공식 설정
    dashboardSheet.getRange(i, 8).setFormula(profitAmountFormula); // 수익금액 공식 설정
    dashboardSheet.getRange(i, 9).setFormula(profitRateFormula); // 수익률 공식 설정
    dashboardSheet.getRange(i, 12).setFormula(assetValueKRWFormula); // 자산 (KRW) 공식 설정

    // 포맷팅 설정
    dashboardSheet.getRange(i, 3).setNumberFormat('0.00'); // 총 주식수 포맷팅 설정 20240610

    if (marketType === '해외') {
      dashboardSheet.getRange(i, 6).setNumberFormat('$0.00'); // 현재가 포맷팅 (달러)
      dashboardSheet.getRange(i, 7).setNumberFormat('$0.00'); // 자산가치 포맷팅 (달러)
      dashboardSheet.getRange(i, 8).setNumberFormat('$0.00'); // 수익금액 포맷팅 (달러)
      dashboardSheet.getRange(i, 11).setValue(dashboardSheet.getRange(i, 7).getValue().toFixed(2)).setNumberFormat('$0.00'); // 자산가치 (USD) 설정 20240610
    } else {
      dashboardSheet.getRange(i, 6).setNumberFormat('#,##0'); // 현재가 포맷팅 (원화)
      dashboardSheet.getRange(i, 7).setNumberFormat('#,##0'); // 자산가치 포맷팅 (원화)
      dashboardSheet.getRange(i, 8).setNumberFormat('#,##0'); // 수익금액 포맷팅 (원화)
      
      dashboardSheet.getRange(i, 11).setFormula(`=${assetValueCell}/${exchangeRate}`).setNumberFormat('$0.00'); // 자산가치 (USD) 설정 20240610
    }

    dashboardSheet.getRange(i, 9).setNumberFormat('0.00%'); // 수익률 포맷팅 (소수점 둘째자리까지 %)
    dashboardSheet.getRange(i, 10).setNumberFormat('$0.00'); // 투자금(USD) 포맷팅 (달러)
    dashboardSheet.getRange(i, 12).setNumberFormat('#,##0');

    // 합계 계산을 위해 값을 저장
    totalInvestmentUSD += parseFloat(dashboardSheet.getRange(i, 10).getValue());
    totalAssetValueUSD2222 += parseFloat(dashboardSheet.getRange(i, 11).getValue());
    totalProfitAmountUSD = totalAssetValueUSD2222 - totalInvestmentUSD;
  }

  // BUG⑨ 수정: 전체 Dashboard 비중(12열) 계산 추가
  var dataLastRow = dashboardSheet.getLastRow();
  var totalAssetKRWSumFormula = `=SUM(L3:L${dataLastRow})`;
  
  // 비중은 자산(KRW) 기준 (12열)으로 계산 — 합계 임시 셀 없이 SUM 참조
  var tempSumCell = `SUM(L3:L${dataLastRow})`;
  for (var wi = 3; wi <= dataLastRow; wi++) {
    var krwCell = dashboardSheet.getRange(wi, 12).getA1Notation();
    dashboardSheet.getRange(wi, 13).setFormula(`=IFERROR(${krwCell}/(${tempSumCell}), 0)`).setNumberFormat('0.00%');
  }
  
  // 총합계 정보를 마지막 행에 추가
  dashboardSheet.appendRow(['', '총 투자금', `$${totalInvestmentUSD.toFixed(2)}`]);
  dashboardSheet.appendRow(['', '총 자산가치', `$${totalAssetValueUSD2222.toFixed(2)}`]);
  dashboardSheet.appendRow(['', '총 수익금액', `$${totalProfitAmountUSD.toFixed(2)}`]);
  var totalProfitRate = totalInvestmentUSD > 0 ? (totalProfitAmountUSD / totalInvestmentUSD) * 100 : 0;
  dashboardSheet.appendRow(['', '총 수익률', `${totalProfitRate.toFixed(2)}%`]);
}

// 주식 심볼을 주식명으로부터 가져오는 함수
function getStockSymbol(stockName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('주식 DB 관리');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === stockName) { // 종목명이 있는 열 (예: 1번 열)
        return data[i][0]; // 주식 심볼이 있는 열 (예: 0번 열)
      }
    }
  }
  return '';
}

// 주식 Ticker를 종목명으로부터 가져오는 함수
function getStockTicker(stockName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('종목 관리');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === stockName) { // 종목명이 있는 열 (예: 1번 열)
        return data[i][3]; // Ticker가 있는 열 (예: 3번 열)
      }
    }
  }
  return '';
}

// ISA 계좌 Dashboard를 업데이트하는 함수
function updateISADashboard() {
  updateAccountDashboard('ISA DashBoard', 'ISA');
}

// IRP 계좌 Dashboard를 업데이트하는 함수
function updateIRPDashboard() {
  updateAccountDashboard('IRP DashBoard', 'IRP');
}

// 연금 계좌 Dashboard를 업데이트하는 함수
function updatePensionDashboard() {
  updateAccountDashboard('연금저축DashBoard', '연금저축');
}

// 연금 계좌2 Dashboard update 함수
function updatePension2Dashboard() {
  updateAccountDashboard('연금저축2 DashBoard', '연금저축2');
}

// 연금 계좌 Dashboard를 업데이트하는 함수
function updateNormalDashboard() {
  updateAccountDashboard('일반 DashBoard', '일반계좌');
}

function getExchangeRate(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var range = sheet.getRange('B1');
  
  // 환율 수식 입력 및 값 확정
  range.setFormula('=GOOGLEFINANCE("CURRENCY:USDKRW")');
  SpreadsheetApp.flush(); 
  
  var exchangeRate = range.getValue();
  // 환율을 가져오지 못한 경우 기본값 설정
  return (typeof exchangeRate === 'number' && exchangeRate > 0) ? exchangeRate : 1350;
}

// IRP, 연금저축 시트 업데이트 함수
function updateAccountDashboard(sheetName, accountType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();	// 현재 활성 스프레드시트를 가져옴
  var tradeSheet = ss.getSheetByName('매수/매도');	// 매수/매도 시트를 가져옴
  var dashboardSheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  dashboardSheet.clear(); // 시트 전체 초기화
  var exchangeRate = getExchangeRate(sheetName);	// 환율 가져오기
  
  // 1. 헤더 설정 (2행)
  var header = ['Index', '종목명', '총 주식수', '평균 단가', '총 투자금', '현재가', '자산가치', '수익금액', '수익률', '비중'];
  dashboardSheet.appendRow(header);
  dashboardSheet.getRange(2, 1, 1, header.length).setBackground('#f3f3f3').setFontWeight('bold');

  var trades = tradeSheet.getDataRange().getValues();	// 매수/매도 시트의 모든 데이터를 가져옴
  var profile = {};	// 각 종목별 데이터를 저장할 객체
  
  
  var totalInvestment = 0;  // 총 투자금 총합
  var totalAsset = 0; // 20240610 // 현재 자산가치 총합
  var totalProfitAmount = 0;

  // 1. 데이터 집계 (루프 내에서 시트 접근 최소화)
  for (var i = 1; i < trades.length; i++) {
    var [year, month, day, stock, priceStr, amount, total, market, type, account] = trades[i];
    if (account !== accountType) continue;

    // 통화 기호($)나 콤마 제거 후 숫자로 변환
    var price = typeof priceStr === 'string' ? parseFloat(priceStr.replace(/[$,]/g, '')) : priceStr;
    
    if (!profile[stock]) {
      profile[stock] = { totalAmount: 0, totalCost: 0, ticker: getStockTicker(stock) };
    }
    
    if (type === '매수') {
      profile[stock].totalAmount += amount;
      profile[stock].totalCost += (amount * price);
    } else if (type === '매도') {
      profile[stock].totalAmount -= amount;
      profile[stock].totalCost -= (amount * price);
    }
  }

  // 2. 출력용 배열 생성
  var outputData = [];
  var idx = 1;

  for (var stock in profile) {
    var data = profile[stock];
    if (data.totalAmount === 0) continue; // 잔고 없는 종목 제외

    var avgPrice = data.totalCost / data.totalAmount;	// 평균 단가 계산
    var ticker = data.ticker;

    // 환율이 1행, 헤더가 2행이므로, 데이터의 첫 번째 행은 3행부터 시작함 (rowIdx 계산)
    // 🔥 중요: 데이터는 3행부터 들어가므로 rowIdx는 (현재 배열길이 + 3)입니다.
    var rowIdx = outputData.length + 3; 

    // 공식 삽입 (A1Notation 활용)
    var currentPriceFormula = `=IFERROR(GOOGLEFINANCE("${ticker}", "price"), NAVER_PRICE("${ticker}"))`;
    
    outputData.push([
      idx++,               // 1. Index
      stock,               // 2. 종목명
      data.totalAmount,    // 3. 총 주식수
      avgPrice,            // 4. 평균 단가
      data.totalCost,      // 5. 총 투자금
      currentPriceFormula, // 6. 현재가
      `=F${rowIdx}*C${rowIdx}`,          // 7. 자산가치
      `=G${rowIdx}-E${rowIdx}`,          // 8. 수익금액
      `=IF(E${rowIdx}<>0, H${rowIdx}/E${rowIdx}, 0)`, // 9. 수익률
      ""                                 // 12. 비중 (일단 빈칸)
    ]);
  } // <-- for 루프가 여기서 정확히 닫혀야 합니다.

  if (outputData.length > 0) {
    // 💡 에러 해결의 핵심: outputData.length를 그대로 numRows에 사용합니다.
    // 🔥 데이터 시작행은 3행입니다. (1행은 헤더)
    var startRow = 3;
    var startCol = 1;
    var numRows = outputData.length;
    var numCols = header.length; // 12
    var lastRow = startRow + numRows - 1;

    // 범위를 (시작행, 시작열, 행개수, 열개수)로 정확히 지정
    dashboardSheet.getRange(startRow, startCol, numRows, numCols).setValues(outputData);

    // 2. 비중 계산을 위한 전체 자산가치 합계 구하기 (데이터 바로 아래 행)
    var totalAssetRow = lastRow + 1;
    var totalAssetCell = `$G$${totalAssetRow}`; // 절대 참조($)를 추가하여 모든 행이 같은 셀을 바라보게 합니다.

    dashboardSheet.getRange(totalAssetRow, 6).setValue("총 자산합계:");
    dashboardSheet.getRange(totalAssetRow, 7).setFormula(`=SUM(G${startRow}:G${lastRow})`);

    // 3. 비중 열(J열)에 수식 입력 (현재행 자산가치 / 전체 자산합계)
    // $를 붙여서 합계 셀 주소를 고정합니다.
    var weightRange = dashboardSheet.getRange(startRow, 10, numRows, 1);

    /**
 * 수정된 수식 설명:
 * =IF(합계셀=0, 0, 현재행자산/합계셀)
 * 합계가 0(또는 로딩 중)이면 0%로 표시하고, 아니면 비중을 계산합니다.
 */
weightRange.setFormula(`=IF(${totalAssetCell}=0, 0, G${startRow}/${totalAssetCell})`);
    
    // 3. 포맷팅 (데이터가 들어있는 만큼만 적용)   
    dashboardSheet.getRange(startRow, 3, numRows, 1).setNumberFormat('#,##0.00'); // 주식수
    dashboardSheet.getRange(startRow, 4, numRows, 5).setNumberFormat('#,##0');    // 단가~수익금액
    dashboardSheet.getRange(startRow, 9, numRows, 1).setNumberFormat('0.00%');   // 수익률
    dashboardSheet.getRange(startRow, 10, numRows, 1).setNumberFormat('0.00%');
  }

  // 주식별 비중을 원형 그래프로 시각화
  createPieChart(dashboardSheet);
}

// 주식별 비중을 원형 그래프로 생성하는 함수
function createPieChart(sheet) {
  var lastRow = sheet.getLastRow(); // 시트의 마지막 행을 가져옵니다.
  if (lastRow < 3) return; // 데이터가 없으면 중단

  // 1. 데이터 범위 지정 (헤더 제외, 합계행 제외)
  // 종목명은 B열(2), 비중은 J열(10)입니다. (앞선 코드 기준)
  // 합계행이 마지막 행이므로 lastRow - 1 까지 가져옵니다.
  var stockNames = sheet.getRange(2, 2, lastRow - 2, 1).getValues(); // B2부터 종목명
  var weights = sheet.getRange(2, 10, lastRow - 2, 1).getValues();   // J2부터 비중

  var chartData = [['종목명', '비중']]; // 헤더 포함

  // 차트 데이터 준비
  for (var i = 0; i < stockNames.length; i++) {
    var name = stockNames[i][0];
    var val = weights[i][0];

    // 값이 숫자인지 확인하고 추가
    if (name && !isNaN(val) && val !== "") {
      chartData.push([name, val]);
    }
  }

  // 3. 차트용 임시 데이터 쓰기 (M열, N열)
  // 데이터가 너무 적으면 에러날 수 있으므로 체크
  if (chartData.length <= 1) return;

  var chartRowStart = 2;
  var chartRange = sheet.getRange(chartRowStart, 13, chartData.length, 2); // M, N열
  chartRange.clear(); 
  chartRange.setValues(chartData);

  // 4. 기존 차트 삭제 (중복 생성 방지)
  var charts = sheet.getCharts();
  for (var i = 0; i < charts.length; i++) {
    sheet.removeChart(charts[i]);
  }

  // 차트 생성
  var chart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE) // 원형 그래프 타입으로 설정
    .addRange(chartRange) // 차트 데이터 범위를 추가
    .setPosition(lastRow + 3, 2, 0, 0) // 총 수익률 다음 줄의 B1열에 차트를 배치
    .setOption('title', '주식별 비중') // 차트 제목 설정
    .setOption('pieHole', 0.4) // 도넛 모양 (선택 사항)
    .build(); // 차트를 빌드
  sheet.insertChart(chart); // 시트에 차트를 삽입
}

// 스크립트를 처음 설치할 때 실행되는 함수
function setup() {
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
  Logger.log("onOpen 트리거 설정 완료");
}

/**
 * 보유금액과 전체 비중을 포함한 포트폴리오 요약 탭을 업데이트합니다.
 */
function updatePortfolioSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tradeSheet = ss.getSheetByName('매수/매도');
  var stockInfoSheet = ss.getSheetByName('종목 관리');
  var summarySheetName = '포트폴리오 요약';
  var summarySheet = ss.getSheetByName(summarySheetName) || ss.insertSheet(summarySheetName);
  
  summarySheet.clear();
  summarySheet.clearConditionalFormatRules();
  
  // 1. 환율 정보 확인 (숫자가 아니면 1로 처리하여 에러 방지)
  var rawExchangeRate = getExchangeRate(summarySheetName);
  var exchangeRate = (typeof rawExchangeRate === 'number' && !isNaN(rawExchangeRate)) ? rawExchangeRate : 1350;

  var stockInfoData = stockInfoSheet.getDataRange().getValues();
  var stockMap = {}; 
  for (var i = 1; i < stockInfoData.length; i++) {
    stockMap[stockInfoData[i][1]] = {
      ticker: String(stockInfoData[i][3]).trim(),
      market: stockInfoData[i][2],
      assetClass: stockInfoData[i][4] || '기타',
      category: stockInfoData[i][5] || ''
    };
  }

  var trades = tradeSheet.getDataRange().getValues();
  var holdings = {}; 
  for (var i = 1; i < trades.length; i++) {
    var stockName = trades[i][3];
    var amount = parseFloat(trades[i][5]);
    var type = trades[i][8];
    if (!stockName || isNaN(amount)) continue;
    if (!holdings[stockName]) holdings[stockName] = 0;
    holdings[stockName] += (type === '매수' ? amount : -amount);
  }

  // 2. 출력 데이터 구조화
  var assetOrder = ['현금', '금', '달러', '배당주/부동산', '신흥국', '채권', '국내주식', '해외주식'];
  var categories = {}; 
  for (var stockName in holdings) {
    if (holdings[stockName] <= 0) continue;
    var info = stockMap[stockName] || { assetClass: '미분류', category: '' };
    if (!categories[info.assetClass]) categories[info.assetClass] = {};
    if (!categories[info.assetClass][info.category]) categories[info.assetClass][info.category] = [];
    categories[info.assetClass][info.category].push(stockName);
  }

  // 3. 헤더 작성
  var header = [['자산군', '분류', '종목명', '보유수량', '보유금액(KRW)', '비중(%)']];
  summarySheet.getRange(1, 1, 1, 6).setValues(header)
    .setBackground('#673AB7').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  var currentRow = 2;
  var subtotalRows = []; 

  assetOrder.forEach(function(assetClass) {
    if (!categories[assetClass]) return;
    
    var startAssetRow = currentRow;
    Object.keys(categories[assetClass]).forEach(function(catName) {
      var startCatRow = currentRow;
      categories[assetClass][catName].forEach(function(stockName) {
        var info = stockMap[stockName];
        var qty = holdings[stockName];
        
        // 중요: 에러 방지를 위해 GOOGLEFINANCE만 공식으로 사용하고, 나머지는 안전하게 처리
        var priceFormula = `=IFERROR(GOOGLEFINANCE("${info.ticker}", "price"), NAVER_PRICE("${info.ticker}"))`;
        
        // 만약 Ticker가 숫자로만 된 국내 주식인 경우 NAVER_PRICE 공식 대신 IFERROR 중첩 사용
        if (info.market !== '해외' && /^\d+$/.test(info.ticker)) {
           priceFormula = `=IFERROR(GOOGLEFINANCE("KRX:${info.ticker}", "price"), NAVER_PRICE("${info.ticker}"))`;
        }

        var priceFormulaNoEqual = priceFormula.replace("=", ""); // 공식 내부용으로 = 제거
        var amountFormula = (info.market === '해외') 
          ? `=IFERROR(D${currentRow} * (${priceFormulaNoEqual}) * ${exchangeRate}, 0)` 
          : `=IFERROR(D${currentRow} * (${priceFormulaNoEqual}), 0)`;

        summarySheet.getRange(currentRow, 1, 1, 3).setValues([[assetClass, catName, stockName]]);
        summarySheet.getRange(currentRow, 4).setValue(qty);
        summarySheet.getRange(currentRow, 5).setFormula(amountFormula);
        currentRow++;
      });
      if (currentRow - startCatRow > 1) summarySheet.getRange(startCatRow, 2, currentRow - startCatRow, 1).merge();
    });

    var endAssetRow = currentRow - 1;
    summarySheet.getRange(currentRow, 1, 1, 4).merge().setValue(assetClass + " 합계")
                .setBackground('#F3E5F5').setFontWeight('bold').setHorizontalAlignment('right');
    summarySheet.getRange(currentRow, 5).setFormula(`=SUM(E${startAssetRow}:E${endAssetRow})`).setBackground('#F3E5F5').setFontWeight('bold');
    
    subtotalRows.push(currentRow);
    currentRow++;

    if (endAssetRow - startAssetRow >= 0) {
      summarySheet.getRange(startAssetRow, 1, (currentRow - 1) - startAssetRow, 1).merge();
    }
  });

  // 4. 비중 공식 및 스타일 적용
  var lastRow = currentRow - 1;
  if (subtotalRows.length > 0) {
    var totalSumFormula = subtotalRows.map(function(r) { return "E" + r; }).join("+");
    for (var r = 2; r <= lastRow; r++) {
      summarySheet.getRange(r, 6).setFormula(`=IFERROR(E${r} / (${totalSumFormula}), 0)`);
    }
  }

  summarySheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat('#,##0');
  summarySheet.getRange(2, 6, lastRow - 1, 1).setNumberFormat('0.0%');

  // 조건부 서식 (비중 20% 이상)
  var range = summarySheet.getRange(2, 6, lastRow - 1, 1);
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(0.2)
    .setBackground("#FFCDD2")
    .setFontColor("#B71C1C")
    .setBold(true)
    .setRanges([range])
    .build();
  summarySheet.setConditionalFormatRules([rule]);

  summarySheet.getRange(1, 1, lastRow, 6).setBorder(true, true, true, true, true, true)
    .setVerticalAlignment('middle').setHorizontalAlignment('center');
}