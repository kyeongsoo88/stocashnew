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
  children: string[][];
  isHeader: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title, showMonthly = false, expandAll = false, onExpandAllChange }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Determine which columns to hide (Feb-Nov if showMonthly is false)
  const hiddenColumnIndices = useMemo(() => {
    const indices = new Set<number>();
    
    if (!showMonthly) {
      // Hide columns 2-12 (Feb-Nov, indices 2-12 in 0-based)
      // Assuming: 계정과목, 2025년(합계), 1월, 2월, ..., 12월, 2026년(합계), YoY
      for (let i = 3; i <= 13; i++) { // 2월(3) ~ 11월(13)
        indices.add(i);
      }
    }
    
    return indices;
  }, [headers, showMonthly]);

  const getVisibleCells = (row: string[]) => {
    return row.filter((_, index) => !hiddenColumnIndices.has(index));
  };
  
  const visibleHeaders = headers.filter((_, index) => !hiddenColumnIndices.has(index));

  // Grouping logic: 기초잔액/기말잔액 are standalone, 영업활동/투자활동/재무활동 are parents
  const groupedData = useMemo(() => {
    const groups: GroupedRow[] = [];
    let currentGroup: GroupedRow | null = null;

    const parentKeywords = ["영업활동", "투자활동", "재무활동"];
    const standaloneKeywords = ["기초잔액", "기말잔액", "운전자본 합계"];

    rows.forEach((row, index) => {
      const firstCell = row[0] || "";
      const isParent = parentKeywords.some(k => firstCell.includes(k));
      const isStandalone = standaloneKeywords.some(k => firstCell.includes(k));
      
      if (isStandalone) {
        // Standalone row (no children) - 기초잔액, 기말잔액
        currentGroup = null;
        groups.push({
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        });
      } else if (isParent) {
        // Start new group - 영업활동, 투자활동, 재무활동
        currentGroup = {
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        };
        groups.push(currentGroup);
      } else {
        // Child row - 부모 그룹의 하위 항목들
        if (currentGroup) {
          currentGroup.children.push(row);
        } else {
          // Orphan row (no parent) - 혹시 모를 독립 항목
          groups.push({
            id: firstCell + index,
            data: row,
            children: [],
            isHeader: false
          });
        }
      }
    });

    return groups;
  }, [rows]);

  // When expandAll prop changes, expand/collapse all groups
  useEffect(() => {
    const newExpandedGroups: Record<string, boolean> = {};
    groupedData.forEach((group) => {
      if (group.children.length > 0) {
        // 재무활동은 기본적으로 열려있도록 설정
        const isFinancialActivity = group.data[0]?.includes("재무활동");
        newExpandedGroups[group.id] = isFinancialActivity ? true : expandAll;
      }
    });
    setExpandedGroups(newExpandedGroups);
  }, [expandAll, groupedData]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !(prev[id] ?? false)
    }));
  };

  // Format number: convert (123) to -123 display, or keep as is
  const formatNumber = (value: string): string => {
    if (!value || value.trim() === '') return '';
    // If it's already in parentheses format, keep it
    if (value.includes('(') && value.includes(')')) {
      return value;
    }
    // If it starts with -, convert to parentheses
    if (value.startsWith('-')) {
      return '(' + value.substring(1) + ')';
    }
    return value;
  };

  // Check if value is negative
  const isNegative = (value: string): boolean => {
    return value.includes('(') || value.startsWith('-');
  };

  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full bg-white overflow-hidden">
      <div className="overflow-auto relative">
        <table className="min-w-full text-sm border-collapse">
          {/* Header */}
          <thead className="bg-white sticky top-0 z-20">
            <tr>
              {visibleHeaders.map((header, index) => {
                const isLast = index === visibleHeaders.length - 1;
                return (
                  <th
                    key={index}
                    className={cn(
                      "px-4 py-3 font-bold text-gray-900 border-b border-gray-200 whitespace-nowrap bg-white",
                      index === 0 && "sticky left-0 z-30 text-left min-w-[200px] pl-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", 
                      index !== 0 && !isLast && "text-right font-semibold text-gray-800 min-w-[100px]",
                      isLast && "text-right font-extrabold min-w-[120px] bg-gray-50"
                    )}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {groupedData.map((group) => {
              const isExpanded = expandedGroups[group.id] ?? false; 
              const hasChildren = group.children.length > 0;
              const visibleData = getVisibleCells(group.data);

              return (
                <React.Fragment key={group.id}>
                  {/* Parent Row */}
                  <tr 
                    onClick={() => hasChildren && toggleGroup(group.id)}
                    className={cn(
                      "group transition-colors",
                      hasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                      // Highlight 기초잔액 and 기말잔액
                      group.isHeader && (group.data[0]?.includes("기초잔액") || group.data[0]?.includes("기말잔액")) 
                        ? "font-bold text-gray-900 bg-blue-50" 
                        : group.isHeader && group.data[0]?.includes("투자활동")
                        ? "font-bold text-gray-900 bg-white"
                        : group.isHeader 
                        ? "font-bold text-gray-900 bg-gray-50" 
                        : "font-medium text-gray-900"
                    )}
                  >
                    {visibleData.map((cell, cellIndex) => {
                      const isLast = cellIndex === visibleData.length - 1;
                      const cellValue = formatNumber(cell);
                      const negative = isNegative(cell);
                      const isBeginningOrEnding = group.data[0]?.includes("기초잔액") || group.data[0]?.includes("기말잔액");
                      const isInvesting = group.data[0]?.includes("투자활동");
                      
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-3 border-b border-gray-100 whitespace-nowrap",
                            // First Column
                            cellIndex === 0 && "sticky left-0 z-10 text-left flex items-center gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                            cellIndex === 0 && isBeginningOrEnding && "bg-blue-50 group-hover:bg-blue-100",
                            cellIndex === 0 && isInvesting && "bg-white group-hover:bg-gray-50",
                            cellIndex === 0 && !isBeginningOrEnding && !isInvesting && "bg-white group-hover:bg-gray-50",
                            // Middle Columns
                            cellIndex !== 0 && !isLast && "text-right",
                            cellIndex !== 0 && !isLast && isBeginningOrEnding && "bg-blue-50",
                            cellIndex !== 0 && !isLast && isInvesting && "bg-white",
                            // Last Column (YoY)
                            isLast && "text-right font-bold",
                            isLast && isBeginningOrEnding && "bg-blue-50 group-hover:bg-blue-100",
                            isLast && isInvesting && "bg-white group-hover:bg-gray-100",
                            isLast && !isBeginningOrEnding && !isInvesting && "bg-gray-50 group-hover:bg-gray-100",
                            // Negative numbers
                            negative && "text-red-600"
                          )}
                        >
                          {cellIndex === 0 && hasChildren && (
                            <span className="text-gray-500">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          )}
                          {cellIndex === 0 && !hasChildren && group.isHeader && (
                             <span className="w-4 inline-block"></span> 
                          )}
                          
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Children Rows */}
                  {hasChildren && isExpanded && group.children.map((childRow, childIndex) => {
                    const visibleChildData = getVisibleCells(childRow);
                    const isBorrowingRow = childRow[0]?.includes("차입금의 변동(본사 차입금)");
                    const isSTEDividend = childRow[0]?.includes("STE 배당금");
                    const isHighlighted = isBorrowingRow || isSTEDividend;
                    return (
                      <tr 
                        key={`${group.id}-child-${childIndex}`}
                        className={cn(
                          "transition-colors",
                          isHighlighted ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50/80"
                        )}
                      >
                        {visibleChildData.map((cell, cellIndex) => {
                          const isLast = cellIndex === visibleChildData.length - 1;
                          const cellValue = formatNumber(cell);
                          const negative = isNegative(cell);

                          return (
                            <td
                              key={cellIndex}
                              className={cn(
                                "px-4 py-2 border-b border-gray-100 whitespace-nowrap text-gray-800",
                                // Indentation
                                cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                cellIndex === 0 && isHighlighted && "bg-yellow-50",
                                cellIndex === 0 && !isHighlighted && "bg-white",
                                // Middle Columns
                                cellIndex !== 0 && !isLast && "text-right font-normal",
                                cellIndex !== 0 && !isLast && isHighlighted && "bg-yellow-50",
                                // Last Column (YoY)
                                isLast && "text-right font-medium text-gray-900",
                                isLast && isHighlighted && "bg-yellow-50",
                                isLast && !isHighlighted && "bg-gray-50",
                                // Negative numbers (첫 번째 열 제외하고 음수는 빨간색)
                                negative && cellIndex !== 0 && "text-red-600"
                              )}
                            >
                               {cellValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
