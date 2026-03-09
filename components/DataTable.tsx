import React, { useState, useMemo, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataTableProps {
  headers: string[];
  rows: string[][];
  title?: string;
  showMonthly?: boolean;
  expandAll?: boolean;
  onExpandAllChange?: (expanded: boolean) => void;
  headerStyle?: 'dark' | 'light';
  useNewLayout?: boolean; // 새로운 레이아웃 사용 여부
}

interface TreeRow {
  id: string;
  data: string[];
  children: TreeRow[];
  level: number;
}

// ── keyword sets ──────────────────────────────────────────────
const LEVEL0_PARENTS     = ['영업활동', '재무활동'];
const LEVEL0_STANDALONE  = ['기초잔액', '기말잔액', 'Net Cash', '운전자본 합계', '매출채권', '재고자산', '매입채무'];
const LEVEL1_OF_영업     = ['매출수금', '물품대 지출', '비용지출'];
const LEVEL1_OF_재무     = ['기타수금', '기타지출'];
const LEVEL2_OF_매출수금 = ['온라인(US+EU)', '홀세일', '라이선스'];
const LEVEL2_OF_비용지출 = ['인건비', '지급수수료', '광고선전비', '기타비용'];

function buildTree(rows: string[][]): TreeRow[] {
  const roots: TreeRow[] = [];
  let l0Parent: TreeRow | null = null;   // 영업활동 / 재무활동
  let l1Parent: TreeRow | null = null;   // 매출수금 / 비용지출 / …

  rows.forEach((row, index) => {
    const name = (row[0] || '').trim();
    const id   = name + '_' + index;

    const isL0Parent    = LEVEL0_PARENTS.some(k => name.includes(k));
    const isL0Standalone= LEVEL0_STANDALONE.some(k => name.includes(k));
    const isL1_영업     = LEVEL1_OF_영업.some(k => name.includes(k));
    const isL1_재무     = LEVEL1_OF_재무.some(k => name.includes(k));
    const isL2_매출     = LEVEL2_OF_매출수금.some(k => name.includes(k));
    const isL2_비용     = LEVEL2_OF_비용지출.some(k => name.includes(k));

    if (isL0Standalone) {
      l0Parent = null; l1Parent = null;
      roots.push({ id, data: row, children: [], level: 0 });

    } else if (isL0Parent) {
      l1Parent = null;
      l0Parent = { id, data: row, children: [], level: 0 };
      roots.push(l0Parent);

    } else if (isL2_매출 && l1Parent?.data[0]?.includes('매출수금')) {
      l1Parent.children.push({ id, data: row, children: [], level: 2 });

    } else if (isL2_비용 && l1Parent?.data[0]?.includes('비용지출')) {
      l1Parent.children.push({ id, data: row, children: [], level: 2 });

    } else if (isL1_영업 && l0Parent?.data[0]?.includes('영업활동')) {
      l1Parent = { id, data: row, children: [], level: 1 };
      l0Parent.children.push(l1Parent);

    } else if (isL1_재무 && l0Parent?.data[0]?.includes('재무활동')) {
      l1Parent = { id, data: row, children: [], level: 1 };
      l0Parent.children.push(l1Parent);

    } else {
      // fallback: orphan → root
      l0Parent = null; l1Parent = null;
      roots.push({ id, data: row, children: [], level: 0 });
    }
  });

  return roots;
}

// ── Flatten tree for rendering ────────────────────────────────
interface FlatRow {
  node: TreeRow;
  visible: boolean;
}

function flattenTree(nodes: TreeRow[], expanded: Record<string, boolean>): FlatRow[] {
  const result: FlatRow[] = [];
  function walk(nodes: TreeRow[]) {
    nodes.forEach(node => {
      result.push({ node, visible: true });
      if (node.children.length > 0 && (expanded[node.id] ?? false)) {
        walk(node.children);
      }
    });
  }
  walk(nodes);
  return result;
}

// ── indent per level ──────────────────────────────────────────
const INDENT = ['pl-4', 'pl-10', 'pl-16'];

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  showMonthly = false,
  expandAll = false,
  headerStyle = 'dark',
  useNewLayout = false,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const hiddenCols = useMemo(() => {
    const s = new Set<number>();
    if (!showMonthly) for (let i = 2; i <= 13; i++) s.add(i);
    return s;
  }, [showMonthly]);

  const visibleHeaders = headers.filter((_, i) => !hiddenCols.has(i));
  const getVisible = (row: string[]) => row.filter((_, i) => !hiddenCols.has(i));

  const tree = useMemo(() => buildTree(rows), [rows]);

  // init expanded state - 기존 상태 유지하면서, 새로운 항목만 기본값 적용 (최적화)
  useEffect(() => {
    setExpanded(prev => {
      let changed = false;
      const next = { ...prev };
      
      function init(nodes: TreeRow[]) {
        nodes.forEach(n => {
          if (n.children.length > 0) {
            // 이미 상태가 있으면 유지, 없으면 기본값 설정
            if (next[n.id] === undefined) {
              changed = true;
              const name = n.data[0] || '';
              // 영업활동, 매출수금만 펼침 / 비용지출, 재무활동은 접힘
              if (name.includes('영업활동') || name.includes('매출수금')) {
                next[n.id] = true;
              } else {
                next[n.id] = false;
              }
            }
            init(n.children);
          }
        });
      }
      init(tree);
      return changed ? next : prev;
    });
  }, [tree]);

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !(prev[id] ?? false) }));

  const formatNum = (v: string): string => {
    if (!v || v.trim() === '') return '';
    if (v.includes('(') && v.includes(')')) return v;
    if (v.startsWith('-')) return '(' + v.slice(1) + ')';
    return v;
  };
  const isNeg = (v: string) => v.includes('(') || v.startsWith('-');

  const flatRows = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  if (!headers.length) return <div className="p-4 text-gray-900">No data available</div>;

  const headerBg   = headerStyle === 'dark' ? '#3b5998' : '#f3f4f6';
  const headerText = headerStyle === 'dark' ? '#ffffff'  : '#111827';

  // 새로운 레이아웃의 헤더 구조 정의
  const newLayoutHeaders = useNewLayout && !showMonthly ? [
    { label: '계정과목', rowSpan: 2, colSpan: 1 },
    { label: '2025년(합계)', rowSpan: 2, colSpan: 1 },
    { label: '계획', rowSpan: 1, colSpan: 2, children: [
      { label: '2026년(계획)', rowSpan: 1, colSpan: 1 },
      { label: '계획-전년', rowSpan: 1, colSpan: 1 },
    ]},
    { label: '2026년 Rolling', rowSpan: 1, colSpan: 4, children: [
      { label: '2026년(합계)', rowSpan: 1, colSpan: 1 },
      { label: 'Rolling-전년', rowSpan: 1, colSpan: 1 },
      { label: '계획대비증감', rowSpan: 1, colSpan: 1 },
      { label: '계획대비(%)', rowSpan: 1, colSpan: 1 },
    ]},
  ] : null;

  return (
    <div className="w-full bg-white overflow-hidden">
      <div className="overflow-auto relative">
        <table className="min-w-full text-sm border-collapse border border-gray-300">

          {/* ── Header ── */}
          {useNewLayout && !showMonthly ? (
            // 새로운 2-tier 헤더 레이아웃
            <thead className="sticky top-0 z-20" style={{ backgroundColor: headerBg }}>
              {/* 첫 번째 행: 대컬럼 */}
              <tr>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'sticky left-0 z-30 min-w-[200px]'
                  )}
                >
                  계정과목
                </th>
                <th
                  rowSpan={2}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  2025년(합계)
                </th>
                <th
                  colSpan={2}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                  )}
                >
                  계획
                </th>
                <th
                  colSpan={4}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                  )}
                >
                  2026년 Rolling
                </th>
              </tr>
              {/* 두 번째 행: 소컬럼 */}
              <tr>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  2026년(계획)
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  계획-전년
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  2026년(합계)
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  Rolling-전년
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[100px]'
                  )}
                >
                  계획대비증감
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  계획대비(%)
                </th>
              </tr>
            </thead>
          ) : (
            // 기존 헤더 레이아웃
            <thead className="sticky top-0 z-20" style={{ backgroundColor: headerBg }}>
              <tr>
                {visibleHeaders.map((h, i) => {
                  const isLast = i === visibleHeaders.length - 1;
                  return (
                    <th
                      key={i}
                      style={{ backgroundColor: headerBg, color: headerText }}
                      className={cn(
                        'px-4 py-3 border font-bold whitespace-nowrap text-center',
                        headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                        i === 0 && 'sticky left-0 z-30 min-w-[200px]',
                        i !== 0 && !isLast && 'min-w-[100px]',
                        isLast && 'min-w-[120px]',
                      )}
                    >
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}

          {/* ── Body ── */}
          <tbody className="divide-y divide-gray-100">
            {flatRows.map(({ node }) => {
              const hasChildren = node.children.length > 0;
              const isOpen      = expanded[node.id] ?? false;
              const cells       = getVisible(node.data);
              const isSpecial   =
                node.data[0]?.includes('기초잔액') ||
                node.data[0]?.includes('기말잔액') ||
                node.data[0]?.includes('Net Cash');

              const indent = INDENT[node.level] ?? 'pl-4';

              // 새로운 레이아웃: 컬럼 재정렬 및 계산
              let displayCells = cells;
              if (useNewLayout && !showMonthly) {
                // showMonthly=false일 때 cells는 이미 필터링됨:
                // [0]계정과목 [1]25년합계 [2]26년계획 [3]26년합계 [4]전년대비 [5]계획대비
                
                // 새로운 컬럼 순서:
                // [0]계정과목 [1]25년합계 [2]26년계획 [3]계획-전년 [4]26년합계 [5]Rolling-전년 [6]계획대비증감 [7]계획대비%

                const account = cells[0] || '';
                const y25Total = cells[1] || '0';
                const y26Plan = cells[2] || '0';  // 필터링 후 인덱스
                const y26Actual = cells[3] || '0';  // 필터링 후 인덱스
                
                // 숫자 변환 함수
                const parseNum = (v: string): number => {
                  if (!v || v.trim() === '') return 0;
                  const clean = v.replace(/,/g, '').replace(/[()]/g, '');
                  const num = parseFloat(clean);
                  return isNaN(num) ? 0 : (v.includes('(') || v.startsWith('-') ? -Math.abs(num) : num);
                };

                // 숫자 포맷 함수 (새로운 계산된 값용)
                const formatNumber = (v: number): string => {
                  if (v === 0) return '0';
                  const abs = Math.abs(v);
                  const formatted = abs.toLocaleString('en-US', { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                  });
                  return v < 0 ? `(${formatted})` : formatted;
                };

                const n25 = parseNum(y25Total);
                const nPlan = parseNum(y26Plan);
                const nActual = parseNum(y26Actual);

                // 계산
                const planMinusPrevYear = nPlan - n25;
                const rollingMinusPrevYear = nActual - n25;
                const planVsActual = nActual - nPlan;
                const planRatio = nPlan !== 0 ? (nActual / nPlan * 100) : 0;

                displayCells = [
                  account,
                  y25Total,
                  y26Plan,
                  formatNumber(planMinusPrevYear),
                  y26Actual,
                  formatNumber(rollingMinusPrevYear),
                  formatNumber(planVsActual),
                  planRatio.toFixed(0) + '%',
                ];
              }

              return (
                <tr
                  key={node.id}
                  onClick={() => hasChildren && toggle(node.id)}
                  className={cn(
                    'group transition-colors',
                    hasChildren && 'cursor-pointer',
                    isSpecial ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50',
                  )}
                >
                  {displayCells.map((cell, ci) => {
                    const isLast  = ci === displayCells.length - 1;
                    const val     = formatNum(cell);
                    const neg     = ci !== 0 && isNeg(cell);

                    return (
                      <td
                        key={ci}
                        className={cn(
                          'px-4 py-3 border border-gray-300 whitespace-nowrap font-bold',
                          neg ? 'text-red-600' : 'text-gray-900',
                          // first column
                          ci === 0 && 'sticky left-0 z-10 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]',
                          ci === 0 && indent,
                          ci === 0 && isSpecial && 'bg-blue-50 group-hover:bg-blue-100',
                          ci === 0 && !isSpecial && 'bg-white group-hover:bg-gray-50',
                          // numeric cols
                          ci !== 0 && !isLast && 'text-right',
                          // last col
                          isLast && 'text-right',
                          isLast && isSpecial && 'bg-blue-50 group-hover:bg-blue-100',
                          isLast && !isSpecial && 'bg-white group-hover:bg-gray-50',
                        )}
                      >
                        {ci === 0 ? (
                          <span className="inline-flex items-center gap-1">
                            {val}
                            {hasChildren && (
                              <span className="text-[10px] text-gray-700">
                                {isOpen ? '▼' : '▶'}
                              </span>
                            )}
                          </span>
                        ) : val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
