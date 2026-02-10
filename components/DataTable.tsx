import React, { useState, useMemo, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronRight, ChevronDown } from 'lucide-react';

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
}

interface GroupedRow {
  id: string;
  data: string[];
  children: GroupedRow[];
  level: number; // 0: Root, 1: Child, 2: Grandchild
  isHeader: boolean;
}

interface DisplayRow extends GroupedRow {
  hasChildren: boolean;
  isExpanded: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title, showMonthly = false, expandAll = false, onExpandAllChange }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Determine which columns to hide
  const hiddenColumnIndices = useMemo(() => {
    const indices = new Set<number>();
    if (!showMonthly) {
      for (let i = 2; i <= 13; i++) { 
        indices.add(i);
      }
    }
    return indices;
  }, [headers, showMonthly]);

  const getVisibleCells = (row: string[]) => {
    return row.filter((_, index) => !hiddenColumnIndices.has(index));
  };
  
  const visibleHeaders = headers.filter((_, index) => !hiddenColumnIndices.has(index));

  // Build Tree Structure
  const groupedData = useMemo(() => {
    const roots: GroupedRow[] = [];
    let currentL1: GroupedRow | null = null; // 영업활동, 재무활동 등
    let currentL2: GroupedRow | null = null; // 매출수금, 비용지출 등

    rows.forEach((row, index) => {
      const firstCell = row[0] || "";
      const id = firstCell + index;
      const node: GroupedRow = { id, data: row, children: [], level: 0, isHeader: false };

      // Level 0 Keywords
      const isL0 = ["영업활동", "재무활동", "투자활동"].some(k => firstCell.includes(k));
      const isL0Standalone = ["기초잔액", "기말잔액", "Net Cash", "운전자본 합계"].some(k => firstCell.includes(k));
      const isWorkingCapitalItem = ["매출채권", "재고자산", "매입채무"].some(k => firstCell.includes(k));
      const isCashLoanItem = ["현금잔액", "차입금잔액"].some(k => firstCell.includes(k));

      if (isL0) {
        node.level = 0;
        node.isHeader = true;
        roots.push(node);
        currentL1 = node;
        currentL2 = null; // Reset L2 context
      } else if (isL0Standalone || isWorkingCapitalItem || isCashLoanItem) {
        node.level = 0;
        roots.push(node);
        currentL1 = null; // Reset context
        currentL2 = null;
      } else {
        // Check Level 1 Keywords (Children of L0)
        // Note: "기타수금", "기타지출" are L1 under "재무활동"
        // "매출수금", "비용지출", "물품대" are L1 under "영업활동"
        const isL1 = ["매출수금", "비용지출", "물품대", "기타수금", "기타지출"].some(k => firstCell.includes(k));
        
        if (isL1) {
          node.level = 1;
          node.isHeader = true; // May have children (e.g., 비용지출)
          if (currentL1) {
            currentL1.children.push(node);
          } else {
            // Fallback: Treat as Root if no parent found
            node.level = 0;
            roots.push(node);
          }
          currentL2 = node; // Set L2 context for potential children
        } else {
          // Level 2 (Children of L1) or Fallback
          // e.g., 인건비 (under 비용지출), 온라인 (under 매출수금)
          if (currentL2) {
            node.level = 2;
            currentL2.children.push(node);
          } else if (currentL1) {
            // Direct child of L1 if L2 context missing
            node.level = 1;
            currentL1.children.push(node);
          } else {
            // Orphan
            node.level = 0;
            roots.push(node);
          }
        }
      }
    });

    return roots;
  }, [rows]);

  // Initial Expand State
  useEffect(() => {
    const newExpandedGroups: Record<string, boolean> = {};
    const setExpandState = (nodes: GroupedRow[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          newExpandedGroups[node.id] = expandAll;
          setExpandState(node.children);
        }
      });
    };
    setExpandState(groupedData);
    setExpandedGroups(newExpandedGroups);
  }, [expandAll, groupedData]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Flatten for rendering
  const flattenRows = (nodes: GroupedRow[]): DisplayRow[] => {
    let result: DisplayRow[] = [];
    nodes.forEach(node => {
      const isExpanded = expandedGroups[node.id] ?? false;
      const hasChildren = node.children.length > 0;
      result.push({ ...node, isExpanded, hasChildren });
      
      if (isExpanded && hasChildren) {
        result = result.concat(flattenRows(node.children));
      }
    });
    return result;
  };

  const visibleRows = useMemo(() => flattenRows(groupedData), [groupedData, expandedGroups]);

  const formatNumber = (value: string): string => {
    if (!value || value.trim() === '') return '';
    if (value.includes('(') && value.includes(')')) return value;
    if (value.startsWith('-')) return '(' + value.substring(1) + ')';
    return value;
  };

  const isNegative = (value: string): boolean => {
    return value.includes('(') || value.startsWith('-');
  };

  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full bg-white overflow-hidden">
      <div className="overflow-auto relative" style={{ maxHeight: '80vh' }}>
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-white sticky top-0 z-30">
            <tr>
              {visibleHeaders.map((header, index) => {
                const isLast = index === visibleHeaders.length - 1;
                return (
                  <th
                    key={index}
                    className={cn(
                      "px-4 py-3 font-bold text-gray-900 border-b border-gray-200 whitespace-nowrap bg-white",
                      index === 0 && "sticky left-0 z-40 text-left min-w-[200px] pl-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                      index !== 0 && !isLast && "text-right font-extrabold text-gray-900 min-w-[100px]",
                      isLast && "text-right font-extrabold min-w-[120px] bg-white text-gray-900"
                    )}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.map((row) => {
              const visibleData = getVisibleCells(row.data);
              const isHighlighted = row.data[0]?.includes("기초잔액") || row.data[0]?.includes("기말잔액") || row.data[0]?.includes("Net Cash");
              
              // Highlight children rows (optional specific highlighting)
              const isYellowHighlight = row.data[0]?.includes("차입금의 변동") || row.data[0]?.includes("STE 배당금");

              return (
                <tr 
                  key={row.id}
                  onClick={() => row.hasChildren && toggleGroup(row.id)}
                  className={cn(
                    "group transition-colors",
                    row.hasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                    isHighlighted && "bg-blue-50 hover:bg-blue-100",
                    isYellowHighlight && "bg-yellow-50 hover:bg-yellow-100"
                  )}
                >
                  {visibleData.map((cell, cellIndex) => {
                    const isLast = cellIndex === visibleData.length - 1;
                    const cellValue = formatNumber(cell);
                    const negative = isNegative(cell);

                    return (
                      <td
                        key={cellIndex}
                        className={cn(
                          "px-4 py-2 border-b border-gray-100 whitespace-nowrap font-bold text-gray-900",
                          // First Column Styling
                          cellIndex === 0 && "sticky left-0 z-20 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                          cellIndex === 0 && !isHighlighted && !isYellowHighlight && "bg-white group-hover:bg-gray-50",
                          cellIndex === 0 && isHighlighted && "bg-blue-50 group-hover:bg-blue-100",
                          cellIndex === 0 && isYellowHighlight && "bg-yellow-50 group-hover:bg-yellow-100",
                          
                          // Indentation
                          cellIndex === 0 && row.level === 0 && "pl-4",
                          cellIndex === 0 && row.level === 1 && "pl-10",
                          cellIndex === 0 && row.level === 2 && "pl-16",
                          
                          // Other Columns
                          cellIndex !== 0 && !isLast && "text-right",
                          cellIndex !== 0 && !isLast && isHighlighted && "bg-blue-50 group-hover:bg-blue-100",
                          cellIndex !== 0 && !isLast && !isHighlighted && "bg-white group-hover:bg-gray-50",
                          
                          // Last Column
                          isLast && "text-right",
                          isLast && isHighlighted && "bg-blue-50 group-hover:bg-blue-100",
                          isLast && !isHighlighted && "bg-white group-hover:bg-gray-50", 
                          
                          // Text Color (Red overrides Black)
                          negative && cellIndex !== 0 && "text-red-600"
                        )}
                      >
                        {cellIndex === 0 && (
                          <div className="flex items-center gap-1">
                            {row.hasChildren && (
                              <span className="text-gray-500 shrink-0">
                                {row.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </span>
                            )}
                            {!row.hasChildren && row.level > 0 && <span className="w-4 inline-block shrink-0"></span>}
                            <span>{cellValue}</span>
                          </div>
                        )}
                        {cellIndex !== 0 && cellValue}
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
