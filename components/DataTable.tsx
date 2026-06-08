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
  detailsData?: Record<string, string>; // 계정과목별 상세 설명
}

interface TreeRow {
  id: string;
  data: string[];
  children: TreeRow[];
  level: number;
  colorIdx?: number;
  financeGroup?: number;
  groupPosition?: 'first' | 'middle' | 'last' | 'only';
}

// ── keyword sets ──────────────────────────────────────────────
const LEVEL0_PARENTS     = ['영업활동', '재무활동', '로열티수금', '비용지출'];
const LEVEL0_STANDALONE  = ['기초잔액', '기말잔액', 'Net Cash', '운전자본 합계', '매출채권', '재고자산', '매입채무', 'STO 감자/배당'];
const LEVEL1_OF_영업     = ['매출수금', '물품대 지출'];
const LEVEL1_OF_재무     = ['본사차입', 'STE감자/배당', 'STE주주환원', 'STE지분매입', '본사차입상환'];
const LEVEL1_OF_로열티수금 = ['Movin', 'SUGI', 'Benjamin', 'Silver', 'UBC', 'BBUK', 'BDS'];
const LEVEL1_OF_비용지출 = ['인건비', '지급수수료', '법률비용', '광고선전비', '기타비용'];
const LEVEL2_OF_매출수금 = ['온라인(US+EU)', '홀세일', '라이선스'];

function getFinanceGroup(name: string): number {
  if (name.includes('SPA')) return 0;
  if (name.includes('운영자금') || name.includes('STE주주환원')) return 1;
  if (name.includes('STE지분매입') || name.includes('STE감자')) return 2;
  return -1;
}

function buildTree(rows: string[][]): TreeRow[] {
  const roots: TreeRow[] = [];
  let l0Parent: TreeRow | null = null;   // 영업활동 / 재무활동 / 로열티수금 / 비용지출
  let l1Parent: TreeRow | null = null;   // 매출수금 / 비용지출 / …

  rows.forEach((row, index) => {
    const name = (row[0] || '').trim();
    const id   = name + '_' + index;

    const isL0Parent    = LEVEL0_PARENTS.some(k => name.includes(k));
    const isL0Standalone= LEVEL0_STANDALONE.some(k => name.includes(k));
    const isL1_영업     = LEVEL1_OF_영업.some(k => name.includes(k));
    const isL1_재무     = LEVEL1_OF_재무.some(k => name.includes(k));
    const isL1_로열티   = LEVEL1_OF_로열티수금.some(k => name.includes(k));
    const isL1_비용     = LEVEL1_OF_비용지출.some(k => name.includes(k));
    const isL2_매출     = LEVEL2_OF_매출수금.some(k => name.includes(k));

    if (isL0Standalone) {
      l0Parent = null; l1Parent = null;
      roots.push({ id, data: row, children: [], level: 0 });

    } else if (isL0Parent) {
      l1Parent = null;
      l0Parent = { id, data: row, children: [], level: 0 };
      roots.push(l0Parent);

    } else if (isL2_매출 && l1Parent?.data[0]?.includes('매출수금')) {
      l1Parent.children.push({ id, data: row, children: [], level: 2 });

    } else if (isL1_영업 && l0Parent?.data[0]?.includes('영업활동')) {
      const colorIdx = l0Parent.children.length;
      l1Parent = { id, data: row, children: [], level: 1, colorIdx };
      l0Parent.children.push(l1Parent);

    } else if (isL1_재무 && l0Parent?.data[0]?.includes('재무활동')) {
      const colorIdx = l0Parent.children.length;
      l1Parent = { id, data: row, children: [], level: 1, colorIdx };
      l0Parent.children.push(l1Parent);

    } else if (isL1_로열티 && l0Parent?.data[0]?.includes('로열티수금')) {
      const colorIdx = l0Parent.children.length;
      l0Parent.children.push({ id, data: row, children: [], level: 1, colorIdx });

    } else if (isL1_비용 && l0Parent?.data[0]?.includes('비용지출')) {
      const colorIdx = l0Parent.children.length;
      l0Parent.children.push({ id, data: row, children: [], level: 1, colorIdx });

    } else {
      // fallback: orphan → root
      l0Parent = null; l1Parent = null;
      roots.push({ id, data: row, children: [], level: 0 });
    }
  });

  // Post-process: assign bracket group positions for 재무활동 children
  roots.forEach(root => {
    if (!root.data[0]?.includes('재무활동')) return;
    const children = root.children;
    children.forEach((child, i) => {
      const g = getFinanceGroup(child.data[0] || '');
      if (g < 0) return;
      child.financeGroup = g;
      const prevG = i > 0 ? getFinanceGroup(children[i - 1].data[0] || '') : -1;
      const nextG = i < children.length - 1 ? getFinanceGroup(children[i + 1].data[0] || '') : -1;
      if (prevG !== g && nextG !== g) child.groupPosition = 'only';
      else if (prevG !== g) child.groupPosition = 'first';
      else if (nextG !== g) child.groupPosition = 'last';
      else child.groupPosition = 'middle';
    });
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

// ── 재무활동 group bracket colors ────────────────────────────
const FINANCE_GROUP_COLORS = ['#0000ff', '#00aa00', '#cc00cc']; // group0: blue, group1: green, group2: purple

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  showMonthly = false,
  expandAll = false,
  headerStyle = 'dark',
  useNewLayout = false,
  detailsData = {},
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
              // 영업활동, 로열티수금, 재무활동은 펼침 / 매출수금, 비용지출은 접힘
              if (name.includes('영업활동') || name.includes('로열티수금') || name.includes('재무활동')) {
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
    { label: '전년', rowSpan: 2, colSpan: 1 },
    { label: 'RF_04', rowSpan: 1, colSpan: 2, children: [
      { label: 'RF_04', rowSpan: 1, colSpan: 1 },
      { label: 'RF_04 - 전년', rowSpan: 1, colSpan: 1 },
    ]},
    { label: 'RF_05', rowSpan: 1, colSpan: 5, children: [
      { label: 'RF_05', rowSpan: 1, colSpan: 1 },
      { label: 'RF_05 - 전년', rowSpan: 1, colSpan: 1 },
      { label: 'RF_04대비 증감', rowSpan: 1, colSpan: 1 },
      { label: 'RF_04대비(%)', rowSpan: 1, colSpan: 1 },
      { label: '상세', rowSpan: 1, colSpan: 1 },
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
                    'min-w-[120px]'
                  )}
                >
                  전년
                </th>
                <th
                  colSpan={2}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                  )}
                >
                  RF_04
                </th>
                <th
                  colSpan={5}
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                  )}
                >
                  RF_05
                </th>
              </tr>
              {/* 두 번째 행: 소컬럼 */}
              <tr>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_04
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_04 - 전년
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_05
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_05 - 전년
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_04대비 증감
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[120px]'
                  )}
                >
                  RF_04대비(%)
                </th>
                <th
                  style={{ backgroundColor: headerBg, color: headerText }}
                  className={cn(
                    'px-4 py-3 border font-bold whitespace-nowrap text-center',
                    headerStyle === 'dark' ? 'border-blue-800' : 'border-gray-300',
                    'min-w-[200px]'
                  )}
                >
                  상세
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

                // 계정과목에 대한 상세 설명 가져오기
                const accountName = account.trim();
                const detailText = detailsData[accountName] || '';

                displayCells = [
                  account,
                  y25Total,
                  y26Plan,
                  formatNumber(planMinusPrevYear),
                  y26Actual,
                  formatNumber(rollingMinusPrevYear),
                  formatNumber(planVsActual),
                  planRatio.toFixed(0) + '%',
                  detailText,
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
                    const isDetailCol = isLast && useNewLayout && !showMonthly;
                    const isSteYellow =
                      (node.data[0]?.includes('STE주주환원') || node.data[0]?.includes('26년 기말 주주환원')) &&
                      ci === 4 &&
                      useNewLayout && !showMonthly;

                    return (
                      <td
                        key={ci}
                        style={isSteYellow ? { backgroundColor: '#fef9c3' } : {}}
                        className={cn(
                          'px-4 py-3 border border-gray-300 whitespace-nowrap font-bold',
                          neg && !isDetailCol ? 'text-red-600' : 'text-gray-900',
                          // first column
                          ci === 0 && 'sticky left-0 z-10 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]',
                          ci === 0 && indent,
                          ci === 0 && isSpecial && 'bg-blue-50 group-hover:bg-blue-100',
                          ci === 0 && !isSpecial && 'bg-white group-hover:bg-gray-50',
                          // detail column (상세) - 검정색 볼드체
                          isDetailCol && 'text-left text-sm !text-gray-900 !font-bold',
                          // numeric cols
                          ci !== 0 && !isLast && 'text-right',
                          // last col (except detail)
                          isLast && !isDetailCol && 'text-right',
                          isLast && isSpecial && 'bg-blue-50 group-hover:bg-blue-100',
                          isLast && !isSpecial && 'bg-white group-hover:bg-gray-50',
                        )}
                      >
                        {ci === 0 ? (
                          <span className="inline-flex items-center gap-1">
                            {node.groupPosition && node.groupPosition !== 'only' && (
                              <span
                                style={{
                                  color: FINANCE_GROUP_COLORS[(node.financeGroup ?? 0) % FINANCE_GROUP_COLORS.length],
                                  fontWeight: '900',
                                  fontSize: '22px',
                                  lineHeight: 1,
                                  flexShrink: 0,
                                  textShadow: `2px 0 0 ${FINANCE_GROUP_COLORS[(node.financeGroup ?? 0) % FINANCE_GROUP_COLORS.length]}, -2px 0 0 ${FINANCE_GROUP_COLORS[(node.financeGroup ?? 0) % FINANCE_GROUP_COLORS.length]}, 0 1px 0 ${FINANCE_GROUP_COLORS[(node.financeGroup ?? 0) % FINANCE_GROUP_COLORS.length]}`,
                                  letterSpacing: '-1px',
                                }}
                              >
                                {node.groupPosition === 'first' ? '┌' : node.groupPosition === 'last' ? '└' : '│'}
                              </span>
                            )}
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
