import { ParsedData } from './csv';

export interface MonthlyFlow {
  month: string;      // "1월"
  opening: number;    // 기초잔액
  operating: number;  // 영업활동 증감
  financing: number;  // 재무활동 증감
  closing: number;    // 기말잔액
  isForecast: boolean; // 전망(예상) 여부
  inflows: CompItem[];        // 그 달의 수금 세부 (드릴다운)
  outflows: CompItem[];       // 그 달의 비용·지출 세부 (드릴다운)
  financingItems: CompItem[]; // 그 달의 재무 세부 (드릴다운)
}

export interface PlanRow {
  metric: string;  // 기초잔액 / 영업활동 / 재무활동 / 기말잔액
  prev: number;    // 전년
  rf04: number;    // 이전 계획
  rf05: number;    // 현재 전망
}

export interface CompItem {
  name: string;
  value: number;
}

// 재무 세부 항목 (합산 항목은 parts에 구성 내역 보관 — 툴팁 표기용)
export interface FinDetail extends CompItem {
  parts?: CompItem[];
}

export interface Composition {
  inflows: CompItem[];   // 수금 구성 (RF_05)
  outflows: CompItem[];  // 비용·지출 구성 (RF_05)
}

export interface FlowConfig {
  openingRow: string;
  closingRow: string;
  operatingRows: string[];   // 영업활동 구성 소계 행
  financingRows: string[];   // 재무활동 구성 소계 행
  inflowRows: string[];      // 수금 세부 구성 (유입)
  outflowRows: string[];     // 비용·지출 세부 구성 (유출)
  financingDetailRows: { rows: string[]; label: string; partLabels?: string[] }[]; // 재무활동 세부(워터폴 분해용; rows 합산, partLabels 지정 시 툴팁에 구성 표기)
  shareholderReturnRow?: string; // 주주환원 등 재무와 별도로 표기할 KPI 행 (지정 시 별도 카드 + 기말은 환원 후 값 기준)
  safeCashLevel: number;     // 최소 안전현금 기본값
}

export interface FlowModel {
  flow: MonthlyFlow[];
  summary: { opening: number; opSum: number; fiSum: number; closing: number; net: number };
  lowPoint: MonthlyFlow | null;
  waterfall: WaterfallStep[];
  plan: PlanRow[];
  composition: Composition;
  financingDetail: FinDetail[];
  shareholderReturn?: { value: number; prev: number }; // 별도 표기 항목 (주주환원 등)
  firstForecastMonth: string | null;
}

export interface WaterfallStep {
  name: string; base: number; bar: number; delta: number; value: number; isTotal: boolean; kind: 'total' | 'up' | 'down';
  parts?: CompItem[];
}

// STO 현금흐름표
export const STO_FLOW_CONFIG: FlowConfig = {
  openingRow: '기초잔액',
  closingRow: '기말잔액',
  operatingRows: ['영업활동'],
  financingRows: ['재무활동'],
  inflowRows: ['온라인(US+EU)', '홀세일', '라이선스'],
  outflowRows: ['물품대 지출', '인건비', '지급수수료', '광고선전비', '기타비용'],
  financingDetailRows: [
    // STE 감자대금(+18,273)으로 SPA 차입(-18,168)을 상환 → 순 +105
    { rows: ['STE감자/배당', '본사차입상환(SPA)'], label: 'SPA 리파이낸싱', partLabels: ['STE감자', '상환(SPA)'] },
    { rows: ['STE주주환원(청산)'], label: 'STE환원' },
    { rows: ['본사차입상환(운영자금)'], label: '상환(운영)' },
    { rows: ['본사차입(운영자금)'], label: '차입(운영)' },
    { rows: ['본사차입(SPA)'], label: '차입(SPA)' },
    { rows: ['STE지분매입'], label: 'STE지분' },
  ],
  safeCashLevel: 2000,
};

// STO 그룹 통합용: 재무 세부를 원자 단위로 유지 (그룹 병합 시 내부거래 상계 처리)
export const STO_GROUP_CONFIG: FlowConfig = {
  ...STO_FLOW_CONFIG,
  financingDetailRows: [
    { rows: ['본사차입상환(SPA)'], label: '상환(SPA)' },
    { rows: ['본사차입상환(운영자금)'], label: '상환(운영)' },
    { rows: ['STE감자/배당'], label: 'STE감자' },
    { rows: ['STE주주환원(청산)'], label: 'STE환원' },
    { rows: ['본사차입(운영자금)'], label: '차입(운영)' },
    { rows: ['본사차입(SPA)'], label: '차입(SPA)' },
    { rows: ['STE지분매입'], label: 'STE지분' },
  ],
};

// STE 현금흐름표 (소계 행이 없어 세부 행을 합산)
export const STE_FLOW_CONFIG: FlowConfig = {
  openingRow: '기초잔액',
  closingRow: '환원 후 기말잔액', // 주주환원(-4,000)을 반영한 실제 연말 잔액(319)
  operatingRows: ['로열티수금', '비용지출'],
  // 월별 재무활동/기말 정합성을 위해 주주환원 포함(→ 12월 -4,000, 기말 319).
  // KPI '재무활동 순계' 카드는 주주환원을 빼고 표기(-18,292), 주주환원은 별도 카드로 분리.
  financingRows: ['STO 감자/배당', '26년 기말 주주환원'],
  inflowRows: ['BBUK', 'Movin', 'Benjamin', 'SUGI', 'SUGI FR', 'Silver', 'BDS'],
  outflowRows: ['법률비용', '광고선전비', '기타비용'],
  financingDetailRows: [
    { rows: ['STO 감자/배당'], label: 'STO감자' },
    { rows: ['26년 기말 주주환원'], label: 'STE주주환원' },
  ],
  shareholderReturnRow: '26년 기말 주주환원',
  safeCashLevel: 1000,
};

// STE 그룹 통합용: 기말잔액을 '환원 후 기말잔액'으로, 주주환원(-4,000)을 재무 유출로 반영
// (STO의 STE주주환원 수취와 상계되어 그룹 현금 이중계상 방지)
export const STE_GROUP_CONFIG: FlowConfig = {
  ...STE_FLOW_CONFIG,
  closingRow: '환원 후 기말잔액',
  financingRows: ['STO 감자/배당', '26년 기말 주주환원'],
  financingDetailRows: [
    { rows: ['STO 감자/배당'], label: 'STO감자' },
    { rows: ['26년 기말 주주환원'], label: '주주환원' },
  ],
  shareholderReturnRow: undefined, // 그룹에선 내부거래 상계로 처리 (별도 카드 없음)
};

const toNumber = (s: string | undefined): number =>
  Number(String(s ?? '0').replace(/[",\s]/g, '')) || 0;

const getMonthColumns = (headers: string[]): { index: number; label: string; isForecast: boolean }[] => {
  const cols: { index: number; label: string; isForecast: boolean }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] ?? '';
    if (/^RF_/.test(h) || h.includes('대비')) break;
    const m = h.match(/(\d+)\s*월/);
    if (m) cols.push({ index: i, label: `${m[1]}월`, isForecast: h.includes('예상') });
  }
  return cols;
};

export const extractMonthlyFlow = (data: ParsedData, config: FlowConfig): MonthlyFlow[] => {
  const findRow = (name: string) => data.rows.find((r) => (r[0] ?? '').trim() === name);
  const openingRow = findRow(config.openingRow);
  const closingRow = findRow(config.closingRow);
  const opRows = config.operatingRows.map(findRow).filter(Boolean) as string[][];
  const fiRows = config.financingRows.map(findRow).filter(Boolean) as string[][];
  const monthCols = getMonthColumns(data.headers);

  // 월별 세부 구성(드릴다운)용
  const itemsAt = (rowNames: string[], index: number): CompItem[] =>
    rowNames
      .map((n) => ({ name: n, value: toNumber(findRow(n)?.[index]) }))
      .filter((x) => x.value !== 0);
  const finItemsAt = (index: number): CompItem[] =>
    config.financingDetailRows
      .map(({ rows, label }) => ({
        name: label,
        value: rows.reduce((sm, rn) => sm + toNumber(findRow(rn)?.[index]), 0),
      }))
      .filter((x) => x.value !== 0);

  return monthCols.map(({ index, label, isForecast }) => ({
    month: label,
    opening: openingRow ? toNumber(openingRow[index]) : 0,
    closing: closingRow ? toNumber(closingRow[index]) : 0,
    operating: opRows.reduce((s, r) => s + toNumber(r[index]), 0),
    financing: fiRows.reduce((s, r) => s + toNumber(r[index]), 0),
    isForecast,
    inflows: itemsAt(config.inflowRows, index),
    outflows: itemsAt(config.outflowRows, index),
    financingItems: finItemsAt(index),
  }));
};

const colIndex = (headers: string[], name: string) => headers.indexOf(name);

export const extractPlan = (data: ParsedData, config: FlowConfig): PlanRow[] => {
  const findRow = (name: string) => data.rows.find((r) => (r[0] ?? '').trim() === name);
  const iPrev = 1;
  const iR4 = colIndex(data.headers, 'RF_04');
  const iR5 = colIndex(data.headers, 'RF_05');
  const sum = (names: string[], col: number) =>
    names.reduce((s, n) => { const r = findRow(n); return s + (r ? toNumber(r[col]) : 0); }, 0);
  const one = (name: string, col: number) => { const r = findRow(name); return r ? toNumber(r[col]) : 0; };

  return [
    { metric: '기초잔액', prev: one(config.openingRow, iPrev), rf04: one(config.openingRow, iR4), rf05: one(config.openingRow, iR5) },
    { metric: '영업활동', prev: sum(config.operatingRows, iPrev), rf04: sum(config.operatingRows, iR4), rf05: sum(config.operatingRows, iR5) },
    { metric: '재무활동', prev: sum(config.financingRows, iPrev), rf04: sum(config.financingRows, iR4), rf05: sum(config.financingRows, iR5) },
    { metric: '기말잔액', prev: one(config.closingRow, iPrev), rf04: one(config.closingRow, iR4), rf05: one(config.closingRow, iR5) },
  ];
};

export const extractComposition = (data: ParsedData, config: FlowConfig): Composition => {
  const findRow = (name: string) => data.rows.find((r) => (r[0] ?? '').trim() === name);
  const iR5 = colIndex(data.headers, 'RF_05');
  const pick = (names: string[]) =>
    names
      .map((n) => { const r = findRow(n); return { name: n, value: r ? toNumber(r[iR5]) : 0 }; })
      .filter((x) => x.value !== 0);
  const inflows = pick(config.inflowRows).sort((a, b) => b.value - a.value);
  const outflows = pick(config.outflowRows).sort((a, b) => a.value - b.value); // 큰 지출 먼저
  return { inflows, outflows };
};

export const extractFinancingDetail = (data: ParsedData, config: FlowConfig): FinDetail[] => {
  const findRow = (name: string) => data.rows.find((r) => (r[0] ?? '').trim() === name);
  const monthCols = getMonthColumns(data.headers).map((c) => c.index);
  const rowSum = (rowName: string) => {
    const r = findRow(rowName);
    return r ? monthCols.reduce((sm, ci) => sm + toNumber(r[ci]), 0) : 0;
  };
  return config.financingDetailRows
    .map(({ rows, label, partLabels }): FinDetail => {
      const partVals = rows.map(rowSum);
      const value = partVals.reduce((a, b) => a + b, 0);
      const parts = partLabels && rows.length > 1
        ? rows.map((_, i) => ({ name: partLabels[i] ?? rows[i], value: partVals[i] }))
        : undefined;
      return { name: label, value, parts };
    })
    .filter((x) => x.value !== 0);
};

export const extractShareholderReturn = (data: ParsedData, config: FlowConfig): { value: number; prev: number } | undefined => {
  if (!config.shareholderReturnRow) return undefined;
  const r = data.rows.find((x) => (x[0] ?? '').trim() === config.shareholderReturnRow);
  if (!r) return undefined;
  const monthCols = getMonthColumns(data.headers).map((c) => c.index);
  const value = monthCols.reduce((sm, ci) => sm + toNumber(r[ci]), 0);
  return { value, prev: toNumber(r[1]) };
};

// 그룹 병합 시 상계할 내부거래(STO↔STE) 라벨
const INTERCOMPANY_LABELS = new Set(['STE감자', 'STO감자', 'STE환원', '주주환원']);

const buildWaterfall = (s: FlowModel['summary'], financingDetail: FinDetail[]): WaterfallStep[] => {
  const steps: WaterfallStep[] = [];
  let running = s.opening;
  const pushDelta = (name: string, delta: number, parts?: CompItem[]) => {
    const after = running + delta;
    steps.push({ name, base: Math.min(running, after), bar: Math.abs(delta), delta, value: after, isTotal: false, kind: delta >= 0 ? 'up' : 'down', parts });
    running = after;
  };
  steps.push({ name: '기초잔액', base: 0, bar: s.opening, delta: s.opening, value: s.opening, isTotal: true, kind: 'total' });
  pushDelta('영업활동', s.opSum);
  if (financingDetail.length > 0) {
    financingDetail.forEach((d) => pushDelta(d.name, d.value, d.parts));
  } else {
    pushDelta('재무활동', s.fiSum);
  }
  steps.push({ name: '기말잔액', base: 0, bar: s.closing, delta: s.closing, value: s.closing, isTotal: true, kind: 'total' });
  return steps;
};

const finalize = (flow: MonthlyFlow[], plan: PlanRow[], composition: Composition, financingDetail: FinDetail[], shareholderReturn?: { value: number; prev: number }): FlowModel => {
  const summary = flow.length === 0
    ? { opening: 0, opSum: 0, fiSum: 0, closing: 0, net: 0 }
    : (() => {
        const opening = flow[0].opening;
        const opSum = flow.reduce((s, m) => s + m.operating, 0);
        const fiSum = flow.reduce((s, m) => s + m.financing, 0);
        const closing = flow[flow.length - 1].closing;
        return { opening, opSum, fiSum, closing, net: closing - opening };
      })();
  const lowPoint = flow.length === 0 ? null : flow.reduce((m, x) => (x.closing < m.closing ? x : m), flow[0]);
  const firstForecastMonth = flow.find((m) => m.isForecast)?.month ?? null;
  return { flow, summary, lowPoint, waterfall: buildWaterfall(summary, financingDetail), plan, composition, financingDetail, shareholderReturn, firstForecastMonth };
};

export const buildModel = (data: ParsedData, config: FlowConfig): FlowModel =>
  finalize(extractMonthlyFlow(data, config), extractPlan(data, config), extractComposition(data, config), extractFinancingDetail(data, config), extractShareholderReturn(data, config));

// STO + STE 그룹 통합 (현금잔액은 합산이 곧 그룹 보유현금, 내부거래 유출입은 합산 시 자연 상계)
export const mergeModels = (a: FlowModel, b: FlowModel): FlowModel => {
  const n = Math.max(a.flow.length, b.flow.length);
  const flow: MonthlyFlow[] = [];
  for (let i = 0; i < n; i++) {
    const x = a.flow[i], y = b.flow[i];
    const base = x ?? y;
    flow.push({
      month: base.month,
      opening: (x?.opening ?? 0) + (y?.opening ?? 0),
      operating: (x?.operating ?? 0) + (y?.operating ?? 0),
      financing: (x?.financing ?? 0) + (y?.financing ?? 0),
      closing: (x?.closing ?? 0) + (y?.closing ?? 0),
      isForecast: (x?.isForecast ?? y?.isForecast) ?? false,
      inflows: [...(x?.inflows ?? []), ...(y?.inflows ?? [])],
      outflows: [...(x?.outflows ?? []), ...(y?.outflows ?? [])],
      financingItems: [...(x?.financingItems ?? []), ...(y?.financingItems ?? [])],
    });
  }
  const plan: PlanRow[] = a.plan.map((p, i) => ({
    metric: p.metric,
    prev: p.prev + (b.plan[i]?.prev ?? 0),
    rf04: p.rf04 + (b.plan[i]?.rf04 ?? 0),
    rf05: p.rf05 + (b.plan[i]?.rf05 ?? 0),
  }));
  const composition: Composition = {
    inflows: [...a.composition.inflows, ...b.composition.inflows].sort((x, y) => y.value - x.value),
    outflows: [...a.composition.outflows, ...b.composition.outflows].sort((x, y) => x.value - y.value),
  };
  // 재무 세부: 라벨 기준 합산(순서 유지), 내부거래(STO↔STE)는 '내부거래 상계'로 묶음
  const fdOrder: string[] = [];
  const fdMap: Record<string, number> = {};
  [...a.financingDetail, ...b.financingDetail].forEach((d) => {
    if (!(d.name in fdMap)) { fdMap[d.name] = 0; fdOrder.push(d.name); }
    fdMap[d.name] += d.value;
  });
  const financingDetail: FinDetail[] = [];
  let internal = 0;
  fdOrder.forEach((name) => {
    if (INTERCOMPANY_LABELS.has(name)) internal += fdMap[name];
    else if (fdMap[name] !== 0) financingDetail.push({ name, value: fdMap[name] });
  });
  if (Math.round(internal) !== 0) financingDetail.push({ name: '내부거래 상계', value: internal });
  return finalize(flow, plan, composition, financingDetail);
};
