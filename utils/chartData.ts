import { ParsedData } from './csv';

export interface MonthlyFlow {
  month: string;      // "1월"
  opening: number;    // 기초잔액
  operating: number;  // 영업활동 증감
  financing: number;  // 재무활동 증감
  closing: number;    // 기말잔액
  isForecast: boolean; // 전망(예상) 여부
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
  safeCashLevel: number;     // 최소 안전현금 기본값
}

export interface FlowModel {
  flow: MonthlyFlow[];
  summary: { opening: number; opSum: number; fiSum: number; closing: number; net: number };
  lowPoint: MonthlyFlow | null;
  waterfall: WaterfallStep[];
  plan: PlanRow[];
  composition: Composition;
  firstForecastMonth: string | null;
}

export interface WaterfallStep {
  name: string; base: number; bar: number; delta: number; value: number; isTotal: boolean; kind: 'total' | 'up' | 'down';
}

// STO 현금흐름표
export const STO_FLOW_CONFIG: FlowConfig = {
  openingRow: '기초잔액',
  closingRow: '기말잔액',
  operatingRows: ['영업활동'],
  financingRows: ['재무활동'],
  inflowRows: ['온라인(US+EU)', '홀세일', '라이선스'],
  outflowRows: ['물품대 지출', '인건비', '지급수수료', '광고선전비', '기타비용'],
  safeCashLevel: 2000,
};

// STE 현금흐름표 (소계 행이 없어 세부 행을 합산)
export const STE_FLOW_CONFIG: FlowConfig = {
  openingRow: '기초잔액',
  closingRow: '기말잔액',
  operatingRows: ['로열티수금', '비용지출'],
  financingRows: ['STO 감자/배당'],
  inflowRows: ['BBUK', 'Movin', 'Benjamin', 'SUGI', 'SUGI FR', 'Silver', 'BDS'],
  outflowRows: ['법률비용', '광고선전비', '기타비용'],
  safeCashLevel: 1000,
};

// STE 그룹 통합용: 기말잔액을 '환원 후 기말잔액'으로, 주주환원(-4,000)을 재무 유출로 반영
// (STO의 STE주주환원 수취와 상계되어 그룹 현금 이중계상 방지)
export const STE_GROUP_CONFIG: FlowConfig = {
  ...STE_FLOW_CONFIG,
  closingRow: '환원 후 기말잔액',
  financingRows: ['STO 감자/배당', '26년 기말 주주환원'],
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

  return monthCols.map(({ index, label, isForecast }) => ({
    month: label,
    opening: openingRow ? toNumber(openingRow[index]) : 0,
    closing: closingRow ? toNumber(closingRow[index]) : 0,
    operating: opRows.reduce((s, r) => s + toNumber(r[index]), 0),
    financing: fiRows.reduce((s, r) => s + toNumber(r[index]), 0),
    isForecast,
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

const buildWaterfall = (s: FlowModel['summary']): WaterfallStep[] => {
  const steps: WaterfallStep[] = [];
  steps.push({ name: '기초잔액', base: 0, bar: s.opening, delta: s.opening, value: s.opening, isTotal: true, kind: 'total' });
  let running = s.opening;
  const afterOp = running + s.opSum;
  steps.push({ name: '영업활동', base: Math.min(running, afterOp), bar: Math.abs(s.opSum), delta: s.opSum, value: afterOp, isTotal: false, kind: s.opSum >= 0 ? 'up' : 'down' });
  running = afterOp;
  const afterFi = running + s.fiSum;
  steps.push({ name: '재무활동', base: Math.min(running, afterFi), bar: Math.abs(s.fiSum), delta: s.fiSum, value: afterFi, isTotal: false, kind: s.fiSum >= 0 ? 'up' : 'down' });
  steps.push({ name: '기말잔액', base: 0, bar: s.closing, delta: s.closing, value: s.closing, isTotal: true, kind: 'total' });
  return steps;
};

const finalize = (flow: MonthlyFlow[], plan: PlanRow[], composition: Composition): FlowModel => {
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
  return { flow, summary, lowPoint, waterfall: buildWaterfall(summary), plan, composition, firstForecastMonth };
};

export const buildModel = (data: ParsedData, config: FlowConfig): FlowModel =>
  finalize(extractMonthlyFlow(data, config), extractPlan(data, config), extractComposition(data, config));

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
  return finalize(flow, plan, composition);
};
