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
  children: (string[] | GroupedRow)[];
  isHeader: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title, showMonthly = false, expandAll = false, onExpandAllChange }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Determine which columns to hide (Jan-Dec if showMonthly is false)
  const hiddenColumnIndices = useMemo(() => {
    const indices = new Set<number>();
    
    if (!showMonthly) {
      // Hide columns 1-12 (Jan-Dec, indices 2-13 in 0-based)
      // Assuming: 계정과목, 2025년(합계), 1월, 2월, ..., 12월, 2026년(합계), YoY
      for (let i = 2; i <= 13; i++) { // 1월(2) ~ 12월(13)
        indices.add(i);
      }
    }
    
    return indices;
  }, [headers, showMonthly]);

  const getVisibleCells = (row: string[]) => {
    return row.filter((_, index) => !hiddenColumnIndices.has(index));
  };
  
  const visibleHeaders = headers.filter((_, index) => !hiddenColumnIndices.has(index));

  // Grouping logic: 새로운 구조
  // 최상위: 영업활동, 재무활동
  // 영업활동 하위: 매출수금(하위: 온라인, 홀세일, 라이선스), 물품대 지출, 비용지출(하위: 인건비, 지급수수료, 광고선전비, 기타비용)
  // 재무활동 하위: 기타수금, 기타지출
  const groupedData = useMemo(() => {
    const groups: GroupedRow[] = [];
    let topLevelGroup: GroupedRow | null = null; // 영업활동 또는 재무활동
    let secondLevelGroup: GroupedRow | null = null; // 매출수금 또는 비용지출

    const topLevelKeywords = ["영업활동", "재무활동"];
    const secondLevelKeywords = ["매출수금", "물품대 지출", "비용지출"];
    const standaloneKeywords = ["기초잔액", "기말잔액", "Net Cash", "운전자본 합계"];
    const salesCollectionChildren = ["온라인(US+EU)", "홀세일", "라이선스"];
    const costChildren = ["인건비", "지급수수료", "광고선전비", "기타비용"];
    const financialActivityChildren = ["기타수금", "기타지출"];

    rows.forEach((row, index) => {
      const firstCell = row[0] || "";
      const isTopLevel = topLevelKeywords.some(k => firstCell.includes(k));
      const isSecondLevel = secondLevelKeywords.some(k => firstCell.includes(k));
      const isStandalone = standaloneKeywords.some(k => firstCell.includes(k));
      const isSalesCollectionChild = salesCollectionChildren.some(k => firstCell.includes(k));
      const isCostChild = costChildren.some(k => firstCell.includes(k));
      const isFinancialChild = financialActivityChildren.some(k => firstCell.includes(k));
      
      if (isStandalone) {
        // Standalone row - 기초잔액, 기말잔액, Net Cash
        topLevelGroup = null;
        secondLevelGroup = null;
        groups.push({
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        });
      } else if (isTopLevel) {
        // 최상위 그룹 시작 - 영업활동, 재무활동
        topLevelGroup = {
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        };
        secondLevelGroup = null;
        groups.push(topLevelGroup);
      } else if (isSecondLevel && topLevelGroup) {
        // 2단계 그룹 시작 - 매출수금, 물품대 지출, 비용지출
        secondLevelGroup = {
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        };
        topLevelGroup.children.push(secondLevelGroup);
      } else if (isSalesCollectionChild && secondLevelGroup && secondLevelGroup.data[0]?.includes("매출수금")) {
        // 매출수금의 자식 - 온라인(US+EU), 홀세일, 라이선스
        secondLevelGroup.children.push(row);
      } else if (isCostChild && secondLevelGroup && secondLevelGroup.data[0]?.includes("비용지출")) {
        // 비용지출의 자식 - 인건비, 지급수수료, 광고선전비, 기타비용
        secondLevelGroup.children.push(row);
      } else if (isFinancialChild && topLevelGroup && topLevelGroup.data[0]?.includes("재무활동")) {
        // 재무활동의 직접 자식 - 기타수금, 기타지출 (GroupedRow로 추가)
        const financialChild: GroupedRow = {
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        };
        topLevelGroup.children.push(financialChild);
      } else if (topLevelGroup && !isSecondLevel && !isFinancialChild && !isSalesCollectionChild && !isCostChild && topLevelGroup.data[0]?.includes("영업활동")) {
        // 영업활동의 직접 자식 (물품대 지출 등) - GroupedRow로 추가
        const operatingChild: GroupedRow = {
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true
        };
        topLevelGroup.children.push(operatingChild);
      } else {
        // 예외 처리 - 독립 항목
        topLevelGroup = null;
        secondLevelGroup = null;
        groups.push({
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: false
        });
      }
    });

    return groups;
  }, [rows]);

  // When expandAll prop changes, expand/collapse all groups
  useEffect(() => {
    const newExpandedGroups: Record<string, boolean> = {};
    const processGroup = (group: GroupedRow) => {
      if (group.children.length > 0) {
        newExpandedGroups[group.id] = expandAll;
        
        // 2단계 그룹도 처리
        group.children.forEach((child) => {
          if ('id' in child && 'data' in child && 'children' in child) {
            const childGroup = child as GroupedRow;
            if (childGroup.children.length > 0) {
              newExpandedGroups[childGroup.id] = expandAll;
            }
          }
        });
      }
    };
    
    groupedData.forEach(processGroup);
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
                      isLast && "text-right font-extrabold min-w-[120px] bg-white"
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
              const isOtherItem = group.data[0]?.includes("기타(본사차입") || group.data[0]?.includes("기타(차입상환") || group.data[0]?.includes("기타(25년 STE지분매입") || group.data[0]?.includes("기타지출(25년 STE지분매입");
              const isOtherRepaymentParent = group.data[0]?.includes("기타(차입상환") || group.data[0]?.includes("기타(25년 STE지분매입") || group.data[0]?.includes("기타지출(25년 STE지분매입");

              return (
                <React.Fragment key={group.id}>
                  {/* Parent Row */}
                  <tr 
                    onClick={() => hasChildren && toggleGroup(group.id)}
                    className={cn(
                      "group transition-colors",
                      hasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                      // 기타(본사차입, STE 배당등), 기타(차입상환, STE지분매입), 기타(25년 STE지분매입, 26년 본사차입 상환)은 검정색
                      isOtherItem && "text-gray-900",
                      // 기타(차입상환, STE지분매입), 기타(25년 STE지분매입, 26년 본사차입 상환)은 볼드체
                      isOtherRepaymentParent && "font-bold",
                      // Highlight 기초잔액, 기말잔액, and Net Cash
                      group.isHeader && (group.data[0]?.includes("기초잔액") || group.data[0]?.includes("기말잔액") || group.data[0]?.includes("Net Cash")) 
                        ? "font-bold text-gray-900 bg-blue-50" 
                        : group.isHeader && group.data[0]?.includes("투자활동")
                        ? "font-bold text-gray-900 bg-white"
                        : group.isHeader && !isOtherRepaymentParent
                        ? "font-bold text-gray-900 bg-white" 
                        : !isOtherRepaymentParent && "font-medium text-gray-900"
                    )}
                  >
                    {visibleData.map((cell, cellIndex) => {
                      const isLast = cellIndex === visibleData.length - 1;
                      const cellValue = formatNumber(cell);
                      const negative = isNegative(cell);
                      const isBeginningOrEnding = group.data[0]?.includes("기초잔액") || group.data[0]?.includes("기말잔액") || group.data[0]?.includes("Net Cash");
                      const isInvesting = group.data[0]?.includes("투자활동");
                      
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-3 border-b border-gray-100 whitespace-nowrap",
                            // First Column
                            // 기타(본사차입, STE 배당등), 기타(차입상환, STE지분매입)은 검정색 (빨간색 오버라이드)
                            cellIndex === 0 && isOtherItem && "!text-gray-900",
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
                            isLast && !isBeginningOrEnding && !isInvesting && "bg-white group-hover:bg-gray-100",
                            // Negative numbers (첫 번째 열 제외)
                            negative && cellIndex !== 0 && "text-red-600"
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

                  {/* Children Rows - 재귀적으로 렌더링 */}
                  {hasChildren && isExpanded && group.children.map((child, childIndex) => {
                    // child가 GroupedRow인지 string[]인지 확인
                    const isGroupedRow = 'id' in child && 'data' in child && 'children' in child;
                    
                    if (isGroupedRow) {
                      // GroupedRow인 경우 재귀적으로 렌더링
                      const childGroup = child as GroupedRow;
                      const childHasChildren = childGroup.children.length > 0;
                      const childIsExpanded = expandedGroups[childGroup.id] ?? false;
                      const visibleChildData = getVisibleCells(childGroup.data);
                      const isSecondLevel = childGroup.data[0]?.includes("매출수금") || childGroup.data[0]?.includes("비용지출") || childGroup.data[0]?.includes("물품대");
                      const isFinancialChild = childGroup.data[0]?.includes("기타수금") || childGroup.data[0]?.includes("기타지출");
                      
                      return (
                        <React.Fragment key={`${group.id}-child-${childIndex}`}>
                          <tr 
                            onClick={() => childHasChildren && toggleGroup(childGroup.id)}
                            className={cn(
                              "group transition-colors",
                              childHasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                              isSecondLevel ? "font-bold text-gray-900 bg-white" : isFinancialChild ? "font-bold text-gray-900" : "font-medium text-gray-900"
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
                                    "px-4 py-2 border-b border-gray-100 whitespace-nowrap",
                                    cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                    cellIndex === 0 && isSecondLevel && "bg-white group-hover:bg-gray-50",
                                    cellIndex === 0 && !isSecondLevel && "bg-white group-hover:bg-gray-50",
                                    cellIndex !== 0 && !isLast && "text-right",
                                    cellIndex !== 0 && !isLast && isSecondLevel && "bg-white",
                                    isLast && "text-right font-medium",
                                    isLast && isSecondLevel && "bg-white group-hover:bg-gray-100",
                                    isLast && !isSecondLevel && "bg-white group-hover:bg-gray-100",
                                    negative && cellIndex !== 0 && "text-red-600"
                                  )}
                                >
                                  {cellIndex === 0 ? (
                                    <span className="flex items-center gap-2">
                                      {childHasChildren ? (
                                        <span className="text-gray-500 w-[14px] flex items-center justify-center">
                                          {childIsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                      ) : (
                                        <span className="w-[14px] inline-block"></span>
                                      )}
                                      <span>{cellValue}</span>
                                    </span>
                                  ) : (
                                    cellValue
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {/* 3단계 자식 렌더링 */}
                          {childHasChildren && childIsExpanded && childGroup.children.map((grandChild, grandChildIndex) => {
                            if ('id' in grandChild && 'data' in grandChild) {
                              // 또 다른 GroupedRow는 없어야 하지만, 안전을 위해 처리
                              return null;
                            }
                            const grandChildRow = grandChild as string[];
                            const visibleGrandChildData = getVisibleCells(grandChildRow);
                            const isSalesCollectionChild = grandChildRow[0]?.includes("온라인(US+EU)") || grandChildRow[0]?.includes("홀세일") || grandChildRow[0]?.includes("라이선스");
                            
                            return (
                              <tr 
                                key={`${childGroup.id}-grandchild-${grandChildIndex}`}
                                className={cn(
                                  "transition-colors hover:bg-gray-50/80",
                                  isSalesCollectionChild && "!text-gray-900"
                                )}
                              >
                                {visibleGrandChildData.map((cell, cellIndex) => {
                                  const isLast = cellIndex === visibleGrandChildData.length - 1;
                                  const cellValue = formatNumber(cell);
                                  const negative = isNegative(cell);
                                  
                                  return (
                                    <td
                                      key={cellIndex}
                                      className={cn(
                                        "px-4 py-2 border-b border-gray-100 whitespace-nowrap",
                                        cellIndex === 0 && isSalesCollectionChild && "!text-gray-900",
                                        cellIndex === 0 && !isSalesCollectionChild && "text-gray-800",
                                        cellIndex === 0 && "sticky left-0 z-10 text-left pl-16 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-white",
                                        cellIndex !== 0 && !isLast && "text-right font-normal",
                                        cellIndex !== 0 && !isLast && isSalesCollectionChild && !negative && "!text-gray-900",
                                        isLast && "text-right font-medium text-gray-900",
                                        isLast && isSalesCollectionChild && !negative && "!text-gray-900",
                                        isLast && "bg-white",
                                        negative && cellIndex !== 0 && "!text-red-600"
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
                    } else {
                      // string[]인 경우 기존 로직 사용
                      const childRow = child as string[];
                      const visibleChildData = getVisibleCells(childRow);
                      const isBorrowingRow = childRow[0]?.includes("차입금의 변동(본사 차입금)");
                      const isSTEDividend = childRow[0]?.includes("STE 배당금");
                      const isOtherItem = childRow[0]?.includes("기타(본사차입") || childRow[0]?.includes("기타(차입상환") || childRow[0]?.includes("기타(25년 STE지분매입");
                      const isOtherRepayment = childRow[0]?.includes("기타(차입상환") || childRow[0]?.includes("기타(25년 STE지분매입");
                      const isSalesCollectionChild = childRow[0]?.includes("온라인(US+EU)") || childRow[0]?.includes("홀세일") || childRow[0]?.includes("라이선스");
                      const isHighlighted = isBorrowingRow || isSTEDividend;
                      
                      return (
                        <tr 
                          key={`${group.id}-child-${childIndex}`}
                          className={cn(
                            "transition-colors",
                            (isOtherItem || isSalesCollectionChild) && "!text-gray-900",
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
                                  "px-4 py-2 border-b border-gray-100 whitespace-nowrap",
                                  cellIndex === 0 && (isOtherItem || isSalesCollectionChild) && "!text-gray-900",
                                  cellIndex === 0 && !isOtherItem && !isSalesCollectionChild && "text-gray-800",
                                  cellIndex === 0 && isOtherRepayment && "font-bold",
                                  cellIndex === 0 && !isOtherRepayment && "font-normal",
                                  cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                  cellIndex === 0 && isHighlighted && "bg-yellow-50",
                                  cellIndex === 0 && !isHighlighted && "bg-white",
                                  cellIndex !== 0 && !isLast && isSalesCollectionChild && !negative && "!text-gray-900 text-right font-normal",
                                  cellIndex !== 0 && !isLast && !isSalesCollectionChild && "text-right font-normal",
                                  cellIndex !== 0 && !isLast && isHighlighted && "bg-yellow-50",
                                  isLast && isSalesCollectionChild && !negative && "!text-gray-900 text-right font-medium",
                                  isLast && !isSalesCollectionChild && "text-right font-medium text-gray-900",
                                  isLast && isHighlighted && "bg-yellow-50",
                                  isLast && !isHighlighted && "bg-white",
                                  negative && cellIndex !== 0 && "!text-red-600"
                                )}
                              >
                                {cellValue}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }
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
