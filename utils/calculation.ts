import { ParsedData } from "./csv";

/**
 * 숫자로 된 문자열("1,234")을 파싱하여 number로 반환
 */
const parseNumber = (str: string): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, ""));
};

/**
 * 숫자를 문자열("1,234")로 포맷팅
 */
const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString();
};

/**
 * 130% 성장 기준 데이터를 바탕으로, 특정 성장률(targetRate)일 때의 현금흐름표를 재계산
 */
export const recalculateCashflow = (baseData: ParsedData, targetRate: number): ParsedData => {
  // 깊은 복사로 원본 보존
  const newRows = baseData.rows.map(row => [...row]);
  
  // 행 인덱스 찾기 (CSV 파일 구조에 의존)
  const findRowIndex = (keyword: string) => newRows.findIndex(row => row[0] && row[0].includes(keyword));

  const rowIdx = {
    beginning: findRowIndex("기초잔액"),
    operating: findRowIndex("영업활동"),
    salesTotal: findRowIndex("매출수금"),
    online: findRowIndex("온라인(US+EU)"),
    wholesale: findRowIndex("홀세일"),
    license: findRowIndex("라이선스"),
    goods: findRowIndex("물품대 지출"),
    expenses: findRowIndex("비용지출"), // 이 행이 전체 비용 합계라고 가정
    finance: findRowIndex("재무활동"),
    otherIn: findRowIndex("기타수금"),
    otherOut: findRowIndex("기타지출"),
    netCash: findRowIndex("Net Cash"),
    ending: findRowIndex("기말잔액"),
  };

  // 필수 행이 없으면 원본 반환
  if (rowIdx.online === -1 || rowIdx.salesTotal === -1) {
    return { headers: baseData.headers, rows: newRows };
  }

  // 1월~12월 컬럼 인덱스 (보통 2~13, 0부터 시작 기준)
  const startCol = 2;
  const endCol = 13;

  // 비율 계산 (130%가 기준이므로 130으로 나눔)
  const ratio = targetRate / 130;

  for (let col = startCol; col <= endCol; col++) {
    // 1월(index 2)과 2월(index 3)은 Actual 데이터이므로 변동 없음
    // 3월(index 4)부터 Forecast 적용
    const isActual = col === 2 || col === 3;
    const currentRatio = isActual ? 1 : ratio;

    // 1. 기초잔액 업데이트 (2월부터는 전월 기말잔액 사용)
    if (col > startCol) {
        // 전월 기말잔액을 금월 기초잔액으로
        const prevEnding = parseNumber(newRows[rowIdx.ending][col - 1]);
        if (rowIdx.beginning !== -1) {
             newRows[rowIdx.beginning][col] = formatNumber(prevEnding);
        }
    }

    // 2. 온라인 매출 재계산 (Actual 기간은 원본 유지, Forecast 기간만 비율 적용)
    const baseOnline = parseNumber(baseData.rows[rowIdx.online][col]);
    const newOnline = baseOnline * currentRatio;
    newRows[rowIdx.online][col] = formatNumber(newOnline);

    // 3. 매출수금 합계 재계산 (온라인 + 홀세일 + 라이선스)
    const wholesale = rowIdx.wholesale !== -1 ? parseNumber(newRows[rowIdx.wholesale][col]) : 0;
    const license = rowIdx.license !== -1 ? parseNumber(newRows[rowIdx.license][col]) : 0;
    const newSalesTotal = newOnline + wholesale + license;
    newRows[rowIdx.salesTotal][col] = formatNumber(newSalesTotal);

    // 4. 영업활동 재계산 (매출수금 + 물품대 + 비용지출)
    const goods = rowIdx.goods !== -1 ? parseNumber(newRows[rowIdx.goods][col]) : 0;
    const expenses = rowIdx.expenses !== -1 ? parseNumber(newRows[rowIdx.expenses][col]) : 0;
    const newOperating = newSalesTotal + goods + expenses;
    if (rowIdx.operating !== -1) {
      newRows[rowIdx.operating][col] = formatNumber(newOperating);
    }

    // 5. Net Cash 재계산 (영업활동 + 재무활동)
    // 주의: CSV 상 '재무활동' 행이 이미 '기타수금' + '기타지출'의 합계임.
    // 따라서 개별 항목(기타수금, 기타지출)을 또 더하면 중복 계산됨.
    let financeTotal = 0;
    if (rowIdx.finance !== -1) {
      financeTotal = parseNumber(newRows[rowIdx.finance][col]);
    } else {
      // 재무활동 행이 없는 경우에만 개별 항목 합산
      const otherIn = rowIdx.otherIn !== -1 ? parseNumber(newRows[rowIdx.otherIn][col]) : 0;
      const otherOut = rowIdx.otherOut !== -1 ? parseNumber(newRows[rowIdx.otherOut][col]) : 0;
      financeTotal = otherIn + otherOut;
    }

    const newNetCash = newOperating + financeTotal;
    if (rowIdx.netCash !== -1) {
      newRows[rowIdx.netCash][col] = formatNumber(newNetCash);
    }

    // 6. 기말잔액 재계산 (금월 기초 + 금월 Net Cash)
    // 금월 기초잔액 가져오기 (이미 위에서 업데이트됨)
    const currentBeginning = rowIdx.beginning !== -1 ? parseNumber(newRows[rowIdx.beginning][col]) : 0;
    const newEnding = currentBeginning + newNetCash;
    if (rowIdx.ending !== -1) {
      newRows[rowIdx.ending][col] = formatNumber(newEnding);
    }
  }

  // 합계(26년 합계) 컬럼 업데이트 (인덱스 14 가정)
  const sumCol = 14;
  if (newRows[0][sumCol] && newRows[0][sumCol].includes("합계")) {
      [rowIdx.online, rowIdx.salesTotal, rowIdx.operating, rowIdx.netCash, rowIdx.ending].forEach(idx => {
          if (idx !== -1) {
              if (idx === rowIdx.ending) {
                  // 기말잔액 합계는 12월 기말잔액
                  newRows[idx][sumCol] = newRows[idx][endCol];
              } else {
                  let sum = 0;
                  for (let c = startCol; c <= endCol; c++) {
                      sum += parseNumber(newRows[idx][c]);
                  }
                  newRows[idx][sumCol] = formatNumber(sum);
              }
          }
      });
  }

  return { headers: baseData.headers, rows: newRows };
};

/**
 * 현금흐름표(newCashflow)의 기말잔액을 현금잔액표(baseCashloan)의 현금잔액 행에 반영
 */
export const updateCashloanFromCashflow = (baseCashloan: ParsedData, newCashflow: ParsedData): ParsedData => {
  const newRows = baseCashloan.rows.map(row => [...row]);

  // 행 인덱스 찾기
  const cashBalanceIdx = newRows.findIndex(row => row[0] && row[0].includes("현금잔액"));
  
  // 현금흐름표에서 필요한 행 찾기
  const cfEndingIdx = newCashflow.rows.findIndex(row => row[0] && row[0].includes("기말잔액"));
  const cfBeginningIdx = newCashflow.rows.findIndex(row => row[0] && row[0].includes("기초잔액"));

  if (cashBalanceIdx === -1 || cfEndingIdx === -1 || cfBeginningIdx === -1) {
    return { headers: baseCashloan.headers, rows: newRows };
  }

  // 매핑 로직
  // CashLoan Col 1 (기초잔액) <- CashFlow Col 2 (1월 기초잔액 - index 2 in CashFlow Row)
  // CashLoan Col 2 (1월 말) <- CashFlow Col 2 (1월 말 - index 2 in CashFlow Row)
  // ...
  // CashLoan Col 13 (12월 말) <- CashFlow Col 13 (12월 말)
  // CashLoan Col 14 (기말잔액) <- CashFlow Col 13 (12월 말)

  // 1. 기초잔액 (Col 1)
  // CashFlow의 '기초잔액' 행의 1월 값(index 2)이 1월의 기초잔액임
  newRows[cashBalanceIdx][1] = newCashflow.rows[cfBeginningIdx][2];

  // 2. 1월~12월 기말잔액 (Col 2 ~ 13)
  for (let m = 1; m <= 12; m++) {
      const colIdxInCashLoan = m + 1; // 2(1월)~13(12월)
      const colIdxInCashFlow = m + 1; // 2(1월)~13(12월)
      // CashFlow의 '기말잔액' 행에서 가져옴
      newRows[cashBalanceIdx][colIdxInCashLoan] = newCashflow.rows[cfEndingIdx][colIdxInCashFlow];
  }

  // 3. 전체 기말잔액 (Col 14) -> 12월 기말잔액과 동일
  newRows[cashBalanceIdx][14] = newCashflow.rows[cfEndingIdx][13];

  return { headers: baseCashloan.headers, rows: newRows };
};
