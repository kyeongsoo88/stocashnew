'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { FlowModel } from '@/utils/chartData';

// 성장률 오름차순 = 파랑 순차 램프 (light → dark)
const RAMP = ['#86b6ef', '#5598e7', '#3987e5', '#1c5cab', '#0d366b'];
const C = {
  grid: '#e1e0d9', baseline: '#c3c2b7', axis: '#898781',
  textPri: '#0b0b0b', textSec: '#52514e', muted: '#898781',
  warn: '#d97706', down: '#d03b3b', up: '#0ca30c', surface: '#ffffff',
};

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

interface Props {
  rates: number[];        // 오름차순 정렬된 성장률 목록
  currentRate: number;    // 현재 슬라이더 값 (강조)
  threshold: number;      // 안전선
  modelFor: (rate: number) => FlowModel;
  unitNote?: string;
}

export const ScenarioChart = ({ rates, currentRate, threshold, modelFor, unitNote = '단위 K$' }: Props) => {
  const scenarios = useMemo(() => rates.map((r) => ({ rate: r, model: modelFor(r) })), [rates, modelFor]);

  const chartData = useMemo(() => {
    const base = scenarios[0]?.model.flow ?? [];
    return base.map((m, i) => {
      const row: Record<string, number | string | null> = { month: m.month };
      scenarios.forEach((s) => { row[`r${s.rate}`] = s.model.flow[i]?.closing ?? null; });
      return row;
    });
  }, [scenarios]);

  const summary = useMemo(
    () => scenarios.map((s) => ({
      rate: s.rate,
      closing: s.model.summary.closing,
      low: s.model.lowPoint,
      below: s.model.flow.filter((m) => m.closing < threshold).length,
    })),
    [scenarios, threshold]
  );

  const colorFor = (rate: number) => RAMP[Math.min(RAMP.length - 1, Math.max(0, rates.indexOf(rate)))];

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const sorted = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
    return (
      <div className="rounded-lg border shadow-lg px-3.5 py-2.5 min-w-[190px]" style={{ background: C.surface, borderColor: 'rgba(11,11,11,0.10)' }}>
        <div className="text-[13px] font-bold mb-1.5" style={{ color: C.textPri }}>{label} 기말잔액</div>
        <div className="space-y-1">
          {sorted.map((p: any) => {
            const rate = Number(p.dataKey.slice(1));
            const isCur = rate === currentRate;
            return (
              <div key={p.dataKey} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-[12px]" style={{ color: C.textSec }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  매출 {rate}%{isCur ? ' (현재)' : ''}
                </span>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: Number(p.value) < threshold ? C.down : C.textPri }}>
                  {fmt(Number(p.value))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {/* 기말잔액 곡선 오버레이 */}
      <div className="lg:col-span-3 rounded-xl border bg-white" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
        <div className="flex items-baseline justify-between px-4 pt-3.5 pb-1 gap-2">
          <h4 className="text-[13px] font-bold" style={{ color: C.textPri }}>성장률별 기말잔액 곡선</h4>
          <span className="text-[11px]" style={{ color: C.muted }}>굵은 선 = 현재({currentRate}%) · {unitNote}</span>
        </div>
        <div className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 16, right: 16, left: 6, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.textSec }} axisLine={{ stroke: C.baseline }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.axis }} tickFormatter={fmt} axisLine={false} tickLine={false} width={46} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={threshold} stroke={C.warn} strokeDasharray="6 4"
                label={{ value: `안전선 ${fmt(threshold)}`, position: 'insideBottomLeft', fill: C.warn, fontSize: 10.5, fontWeight: 700 }} />
              {scenarios.map((s) => {
                const isCur = s.rate === currentRate;
                return (
                  <Line key={s.rate} type="monotone" dataKey={`r${s.rate}`} name={`매출 ${s.rate}%`}
                    stroke={colorFor(s.rate)} strokeWidth={isCur ? 3 : 1.75}
                    dot={isCur ? { r: 3, fill: colorFor(s.rate), stroke: C.surface, strokeWidth: 1.5 } : false}
                    activeDot={{ r: 4, stroke: C.surface, strokeWidth: 2 }} connectNulls />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 시나리오 요약 표 */}
      <div className="lg:col-span-2 rounded-xl border bg-white" style={{ borderColor: 'rgba(11,11,11,0.10)' }}>
        <div className="px-4 pt-3.5 pb-2">
          <h4 className="text-[13px] font-bold" style={{ color: C.textPri }}>시나리오 요약</h4>
        </div>
        <div className="px-2 pb-3 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: C.muted }} className="text-left">
                <th className="px-2 py-1.5 font-medium">성장률</th>
                <th className="px-2 py-1.5 font-medium text-right">연말 기말잔액</th>
                <th className="px-2 py-1.5 font-medium text-right">최저 유동성</th>
                <th className="px-2 py-1.5 font-medium text-right">안전선 하회</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => {
                const isCur = s.rate === currentRate;
                return (
                  <tr key={s.rate} className="border-t" style={{ borderColor: '#f0efec', backgroundColor: isCur ? 'rgba(42,120,214,0.06)' : 'transparent' }}>
                    <td className="px-2 py-2 font-semibold" style={{ color: colorFor(s.rate) }}>
                      {s.rate}%{isCur && <span className="ml-1 text-[10px] font-bold" style={{ color: C.textSec }}>현재</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold" style={{ color: s.closing < threshold ? C.down : C.textPri }}>{fmt(s.closing)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: s.low && s.low.closing < threshold ? C.down : C.textSec }}>
                      {s.low ? `${fmt(s.low.closing)} (${s.low.month})` : '-'}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold" style={{ color: s.below > 0 ? C.down : C.up }}>
                      {s.below > 0 ? `${s.below}개월` : '없음'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
