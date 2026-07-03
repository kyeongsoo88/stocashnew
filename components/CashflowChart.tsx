'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { FlowModel, MonthlyFlow } from '@/utils/chartData';

// ── Validated palette (dataviz skill) ──
const C = {
  operating: '#2a78d6', // blue  · 영업활동
  financing: '#1baf7a', // aqua  · 재무활동
  balance: '#0b0b0b',   // ink   · 기말잔액 추이
  wfTotal: '#3b5998',   // brand · 기초/기말
  up: '#0ca30c',        // status good · 증가
  down: '#d03b3b',      // status critical · 감소
  warn: '#d97706',      // amber · 임계선/유출
  prev: '#b8b6ad',      // 전년 (muted)
  plan: '#1baf7a',      // 이전계획 RF_04 (aqua)
  fore: '#2a78d6',      // 전망 RF_05 (blue)
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  axis: '#898781',
  textPri: '#0b0b0b',
  textSec: '#52514e',
  muted: '#898781',
  surface: '#ffffff',
  foreZone: 'rgba(137,135,129,0.06)',
};

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtSigned = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

interface Props {
  model: FlowModel;
  threshold: number;
  compact?: boolean;
}

// ── 월별 복합 차트 툴팁 ──
const MonthlyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row: MonthlyFlow = payload[0].payload;
  const Row = ({ c, l, v, signed }: { c: string; l: string; v: number; signed?: boolean }) => (
    <div className="flex items-center justify-between gap-8">
      <span className="flex items-center gap-2 text-[12px]" style={{ color: C.textSec }}>
        <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />{l}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.textPri }}>
        {signed ? fmtSigned(v) : fmt(v)}
      </span>
    </div>
  );
  return (
    <div className="rounded-lg border shadow-lg px-3.5 py-2.5 min-w-[210px]" style={{ background: C.surface, borderColor: 'rgba(11,11,11,0.10)' }}>
      <div className="text-[13px] font-bold mb-2 pb-1.5 border-b flex items-center gap-2" style={{ color: C.textPri, borderColor: '#f0efec' }}>
        26년 {label}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: row.isForecast ? C.warn : C.up, backgroundColor: row.isForecast ? 'rgba(217,119,6,0.10)' : 'rgba(12,163,12,0.10)' }}>
          {row.isForecast ? '전망' : '실적'}
        </span>
      </div>
      <div className="space-y-1.5">
        <Row c={C.muted} l="기초잔액" v={row.opening} />
        <Row c={C.operating} l="영업활동" v={row.operating} signed />
        <Row c={C.financing} l="재무활동" v={row.financing} signed />
        <div className="pt-1.5 mt-0.5 border-t" style={{ borderColor: '#f0efec' }}>
          <Row c={C.balance} l="기말잔액" v={row.closing} />
        </div>
      </div>
    </div>
  );
};

const WaterfallTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload.find((x: any) => x.dataKey === 'bar')?.payload;
  if (!p) return null;
  const color = p.kind === 'up' ? C.up : p.kind === 'down' ? C.down : C.wfTotal;
  return (
    <div className="rounded-lg border shadow-lg px-3.5 py-2.5" style={{ background: C.surface, borderColor: 'rgba(11,11,11,0.10)' }}>
      <div className="text-[13px] font-bold mb-0.5" style={{ color: C.textPri }}>{p.name}</div>
      <div className="text-[12px]" style={{ color: C.textSec }}>
        {p.isTotal ? '잔액 ' : '증감 '}
        <span className="font-semibold tabular-nums" style={{ color }}>{p.isTotal ? fmt(p.value) : fmtSigned(p.delta)}</span>
      </div>
    </div>
  );
};

const PlanTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border shadow-lg px-3.5 py-2.5 min-w-[180px]" style={{ background: C.surface, borderColor: 'rgba(11,11,11,0.10)' }}>
      <div className="text-[13px] font-bold mb-1.5" style={{ color: C.textPri }}>{label}</div>
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-[12px]" style={{ color: C.textSec }}>
              <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: p.color }} />{p.name}
            </span>
            <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.textPri }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 통계 타일 (전년比 델타칩) ──
const Tile = ({ label, value, accent, signed, hero, delta }: {
  label: string; value: number; accent?: string; signed?: boolean; hero?: boolean; delta?: number;
}) => (
  <div className="rounded-xl border bg-white px-4 py-3 flex flex-col justify-between" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
    <div className="text-[11px] font-medium tracking-wide" style={{ color: C.muted }}>{label}</div>
    <div className={hero ? 'font-semibold leading-none mt-2' : 'font-semibold leading-none mt-1.5 tabular-nums'}
      style={{ color: accent ?? C.textPri, fontSize: hero ? 30 : 20 }}>
      {signed ? fmtSigned(value) : fmt(value)}
    </div>
    {delta !== undefined && (
      <div className="mt-1.5 text-[10.5px] font-semibold tabular-nums" style={{ color: delta >= 0 ? C.up : C.down }}>
        전년比 {fmtSigned(delta)}
      </div>
    )}
  </div>
);

const ChartCard = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border bg-white" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
    <div className="flex items-baseline justify-between px-4 pt-3.5 pb-1 gap-2">
      <h4 className="text-[13px] font-bold shrink-0" style={{ color: C.textPri }}>{title}</h4>
      {note && <span className="text-[11px] text-right" style={{ color: C.muted }}>{note}</span>}
    </div>
    <div className="px-2 pb-3">{children}</div>
  </div>
);

// ── 구성 분해 (HTML 수평 막대) ──
const CompositionList = ({ items, color }: { items: { name: string; value: number }[]; color: string }) => {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2">
          <span className="text-[11.5px] w-24 shrink-0 truncate" style={{ color: C.textSec }} title={it.name}>{it.name}</span>
          <div className="flex-1 h-4 rounded-sm relative" style={{ backgroundColor: 'rgba(137,135,129,0.08)' }}>
            <div className="h-4 rounded-sm" style={{ width: `${(Math.abs(it.value) / max) * 100}%`, backgroundColor: color, minWidth: 2 }} />
          </div>
          <span className="text-[11.5px] w-16 text-right tabular-nums shrink-0" style={{ color: C.textPri }}>{fmt(it.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const CashflowChart = ({ model, threshold, compact = false }: Props) => {
  const { flow, summary, lowPoint, waterfall, plan, composition, firstForecastMonth } = model;

  // 월별 차트 파생: 실적/전망 잔액선 분리
  const chartFlow = useMemo(
    () => flow.map((m, i, arr) => {
      const nextForecast = arr[i + 1]?.isForecast;
      return {
        ...m,
        closingActual: m.isForecast ? null : m.closing,
        closingForecast: m.isForecast || nextForecast ? m.closing : null,
      };
    }),
    [flow]
  );

  const belowThreshold = useMemo(
    () => flow.filter((m) => m.closing < threshold),
    [flow, threshold]
  );

  const planByMetric = useMemo(() => {
    const map: Record<string, { prev: number; rf05: number }> = {};
    plan.forEach((p) => { map[p.metric] = { prev: p.prev, rf05: p.rf05 }; });
    return map;
  }, [plan]);

  const dOpen = (planByMetric['기초잔액']?.rf05 ?? 0) - (planByMetric['기초잔액']?.prev ?? 0);
  const dOp = (planByMetric['영업활동']?.rf05 ?? 0) - (planByMetric['영업활동']?.prev ?? 0);
  const dFi = (planByMetric['재무활동']?.rf05 ?? 0) - (planByMetric['재무활동']?.prev ?? 0);
  const dClose = (planByMetric['기말잔액']?.rf05 ?? 0) - (planByMetric['기말잔액']?.prev ?? 0);
  const prevNet = (planByMetric['기말잔액']?.prev ?? 0) - (planByMetric['기초잔액']?.prev ?? 0);
  const dNet = summary.net - prevNet;

  const insights = useMemo(() => {
    if (flow.length === 0) return [] as { tone: 'up' | 'down' | 'flat'; text: string }[];
    const netByMonth = flow.map((m) => ({ month: m.month, net: m.operating + m.financing }));
    const maxOut = netByMonth.reduce((a, b) => (b.net < a.net ? b : a));
    const maxIn = netByMonth.reduce((a, b) => (b.net > a.net ? b : a));
    const out: { tone: 'up' | 'down' | 'flat'; text: string }[] = [];
    out.push({ tone: summary.net >= 0 ? 'up' : 'down', text: `연간 순증감 ${fmtSigned(summary.net)} — 기초 ${fmt(summary.opening)}에서 기말 ${fmt(summary.closing)}로 ${summary.net >= 0 ? '증가' : '감소'} (전년比 ${fmtSigned(dNet)})` });
    out.push({ tone: summary.opSum >= 0 ? 'up' : 'down', text: `영업활동 순계 ${fmtSigned(summary.opSum)}로 ${summary.opSum >= 0 ? '현금 창출' : '현금 소진'}, 재무활동 ${fmtSigned(summary.fiSum)}` });
    if (lowPoint) out.push({ tone: lowPoint.closing < threshold ? 'down' : 'flat', text: `최저 유동성은 ${lowPoint.month} ${fmt(lowPoint.closing)}${lowPoint.closing < threshold ? ` — 안전선(${fmt(threshold)}) 하회` : ' (안전선 이상)'}` });
    out.push({ tone: 'down', text: `월 최대 순유출 ${maxOut.month} ${fmt(maxOut.net)}, 최대 순유입 ${maxIn.month} ${fmtSigned(maxIn.net)}` });
    return out;
  }, [flow, summary, lowPoint, threshold, dNet]);

  return (
    <div className="space-y-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {/* KPI 통계 밴드 */}
      <div className="grid grid-cols-5 gap-3">
        <Tile label="기초잔액 (연초)" value={summary.opening} accent={C.textSec} delta={dOpen} />
        <Tile label="영업활동 순계" value={summary.opSum} accent={summary.opSum >= 0 ? C.up : C.down} signed delta={dOp} />
        <Tile label="재무활동 순계" value={summary.fiSum} accent={summary.fiSum >= 0 ? C.up : C.down} signed delta={dFi} />
        <Tile label="기말잔액 (연말)" value={summary.closing} accent={C.wfTotal} hero delta={dClose} />
        <Tile label="연간 순증감" value={summary.net} accent={summary.net >= 0 ? C.up : C.down} signed delta={dNet} />
      </div>

      {/* 월별 복합 차트 (실적/전망 구분 + 안전선) */}
      <ChartCard title="월별 자금흐름" note="■실적 ▨전망 · 기말잔액(선) · 안전선 --- · 단위 K$">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartFlow} margin={{ top: 16, right: 16, left: 6, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            {firstForecastMonth && (
              <ReferenceArea x1={firstForecastMonth} x2={chartFlow[chartFlow.length - 1].month} fill={C.foreZone} fillOpacity={1}
                label={{ value: '전망', position: 'insideTopRight', fill: C.muted, fontSize: 11, fontWeight: 700 }} />
            )}
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.textSec }} axisLine={{ stroke: C.baseline }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.axis }} tickFormatter={fmt} axisLine={false} tickLine={false} width={46} />
            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'rgba(137,135,129,0.08)' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10, color: C.textSec }} iconType="circle" iconSize={9} />
            <ReferenceLine y={0} stroke={C.baseline} />
            <ReferenceLine y={threshold} stroke={C.warn} strokeDasharray="6 4"
              label={{ value: `안전선 ${fmt(threshold)}`, position: 'insideBottomLeft', fill: C.warn, fontSize: 10.5, fontWeight: 700 }} />
            <Bar dataKey="operating" name="영업활동" radius={[3, 3, 0, 0]} maxBarSize={22}>
              {chartFlow.map((m, i) => <Cell key={i} fill={C.operating} fillOpacity={m.isForecast ? 0.4 : 1} />)}
            </Bar>
            <Bar dataKey="financing" name="재무활동" radius={[3, 3, 0, 0]} maxBarSize={22}>
              {chartFlow.map((m, i) => <Cell key={i} fill={C.financing} fillOpacity={m.isForecast ? 0.4 : 1} />)}
            </Bar>
            <Line type="monotone" dataKey="closingActual" name="기말잔액(실적)" stroke={C.balance} strokeWidth={2}
              strokeLinecap="round" dot={{ r: 3, fill: C.balance, stroke: C.surface, strokeWidth: 2 }} activeDot={{ r: 5, stroke: C.surface, strokeWidth: 2 }} connectNulls />
            <Line type="monotone" dataKey="closingForecast" name="기말잔액(전망)" stroke={C.balance} strokeWidth={2}
              strokeDasharray="5 4" strokeLinecap="round" dot={{ r: 3, fill: C.surface, stroke: C.balance, strokeWidth: 2 }} activeDot={{ r: 5, stroke: C.surface, strokeWidth: 2 }} connectNulls legendType="none" />
            {belowThreshold.map((m, i) => (
              <ReferenceDot key={i} x={m.month} y={m.closing} r={4} fill={C.down} stroke={C.surface} strokeWidth={2} />
            ))}
            {lowPoint && (
              <ReferenceDot x={lowPoint.month} y={lowPoint.closing} r={5} fill={C.down} stroke={C.surface} strokeWidth={2}
                label={{ value: `최저 ${fmt(lowPoint.closing)}`, position: 'top', fill: C.textSec, fontSize: 11, fontWeight: 700 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 워터폴 + 핵심관찰 */}
      <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-5 gap-4'}>
        <div className={compact ? '' : 'lg:col-span-3'}>
          <ChartCard title="연간 자금흐름 브릿지" note="기초 → 영업 → 재무 → 기말 · 단위 K$">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={waterfall} margin={{ top: 26, right: 12, left: 6, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.textSec }} axisLine={{ stroke: C.baseline }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.axis }} tickFormatter={fmt} axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<WaterfallTooltip />} cursor={{ fill: 'rgba(137,135,129,0.08)' }} />
                <Bar dataKey="base" stackId="wf" fill="transparent" />
                <Bar dataKey="bar" stackId="wf" radius={[3, 3, 0, 0]} maxBarSize={56}>
                  {waterfall.map((s, i) => (
                    <Cell key={i} fill={s.kind === 'up' ? C.up : s.kind === 'down' ? C.down : C.wfTotal} />
                  ))}
                  <LabelList dataKey="delta" position="top"
                    formatter={(v: unknown) => { const n = Number(v) || 0; return n > 0 ? `+${fmt(n)}` : fmt(n); }}
                    style={{ fontSize: 11, fill: C.textSec, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className={compact ? '' : 'lg:col-span-2'}>
          <div className="rounded-xl border bg-white h-full" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
            <div className="px-4 pt-3.5 pb-1"><h4 className="text-[13px] font-bold" style={{ color: C.textPri }}>핵심 관찰</h4></div>
            <ul className="px-4 pb-4 pt-1.5 space-y-3">
              {insights.map((it, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: it.tone === 'up' ? C.up : it.tone === 'down' ? C.down : C.muted }} />
                  <span className="text-[12.5px] leading-relaxed" style={{ color: C.textSec }}>{it.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 계획 대비 + 영업활동 구성 */}
      <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        <ChartCard title="계획 대비 비교" note="전년 · 이전계획(RF_04) · 전망(RF_05) · 단위 K$">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={plan} margin={{ top: 12, right: 12, left: 6, bottom: 0 }} barCategoryGap="24%">
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11.5, fill: C.textSec }} axisLine={{ stroke: C.baseline }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.axis }} tickFormatter={fmt} axisLine={false} tickLine={false} width={46} />
              <Tooltip content={<PlanTooltip />} cursor={{ fill: 'rgba(137,135,129,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11.5, paddingTop: 8, color: C.textSec }} iconType="circle" iconSize={9} />
              <ReferenceLine y={0} stroke={C.baseline} />
              <Bar dataKey="prev" name="전년" fill={C.prev} radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="rf04" name="이전계획" fill={C.plan} radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="rf05" name="전망" fill={C.fore} radius={[2, 2, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-xl border bg-white" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-1">
            <h4 className="text-[13px] font-bold" style={{ color: C.textPri }}>영업활동 구성</h4>
            <span className="text-[11px]" style={{ color: C.muted }}>전망(RF_05) 기준 · 단위 K$</span>
          </div>
          <div className="px-4 pb-4 pt-2 space-y-3">
            <div>
              <div className="text-[11px] font-semibold mb-1.5" style={{ color: C.operating }}>유입 (수금)</div>
              <CompositionList items={composition.inflows} color={C.operating} />
            </div>
            <div className="pt-1 border-t" style={{ borderColor: '#f0efec' }}>
              <div className="text-[11px] font-semibold mb-1.5 mt-2" style={{ color: C.warn }}>유출 (비용·지출)</div>
              <CompositionList items={composition.outflows} color={C.warn} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
