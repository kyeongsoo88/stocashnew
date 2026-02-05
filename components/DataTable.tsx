import React, { useState, useMemo, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronRight, ChevronDown, Calendar, Eye, EyeOff } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataTableProps {
  headers: string[];
  rows: string[][];
  title?: string;
}

interface GroupedRow {
  id: string;
  data: string[];
  children: string[][];
  isHeader: boolean;
  depth: number; 
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showMonthly, setShowMonthly] = useState(false);

  useEffect(() => {
    setExpandedGroups({}); 
  }, [rows]);

  // Check if this is the Cash Flow table (has "구분" column)
  const isCF = useMemo(() => headers.includes("구분"), [headers]);

  // Determine which columns to hide
  const hiddenColumnIndices = useMemo(() => {
    const indices = new Set<number>();
    
    // 1. Hide English Content column if it's CF table (index 0)
    if (isCF) {
      indices.add(0);
    }

    // 2. Hide Monthly columns (Feb-Nov) if toggle is off
    if (!showMonthly) {
      const monthsToHide = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
      headers.forEach((header, index) => {
        if (monthsToHide.some(m => header.includes(m) && !header.includes("Total"))) {
          indices.add(index);
        }
      });
    }
    
    return indices;
  }, [headers, showMonthly, isCF]);

  const getVisibleCells = (row: string[]) => {
    return row.filter((_, index) => !hiddenColumnIndices.has(index));
  };
  
  const visibleHeaders = headers.filter((_, index) => !hiddenColumnIndices.has(index));

  const groupedData = useMemo(() => {
    const groups: GroupedRow[] = [];
    let currentGroup: GroupedRow | null = null;

    const parentKeywords = [
      "Operating activities", "Investing activities", "Financing activities",
      "영업활동", "투자활동", "재무활동",
      "MSRP Sales", "Net Sales", "Direct Cost", "G&A", "Other Income"
    ];

    if (!isCF) {
      parentKeywords.push(
        "Current Assets", "Non-Current Assets", "Current Liabilities", "Non-Current Liabilities", "Stockholder's Equity"
      );
    }

    let standaloneKeywords = [
      "Beginning balances", "Ending balances", "기초잔액", "기말잔액",
      "CoGs", "Discount Rate"
    ];

    if (!isCF) {
      standaloneKeywords.push("Assets", "Liabilities");
    }

    rows.forEach((row, index) => {
      const firstCell = row[0] || ""; 
      const secondCell = row[1] || "";
      const content = firstCell + secondCell;

      const isParent = parentKeywords.some(k => content.includes(k));
      const isStandalone = !isParent && standaloneKeywords.some(k => content.includes(k));

      if (isStandalone) {
         currentGroup = null;
         groups.push({
           id: content + index,
           data: row,
           children: [],
           isHeader: true,
           depth: 0
         });
      } else if (isParent) {
        currentGroup = {
          id: content + index, 
          data: row,
          children: [],
          isHeader: true,
          depth: 1
        };
        groups.push(currentGroup);
      } else {
        if (currentGroup) {
          currentGroup.children.push(row);
        } else {
          groups.push({
            id: content + index,
            data: row,
            children: [],
            isHeader: false,
            depth: 0
          });
        }
      }
    });

    return groups;
  }, [rows, isCF]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !(prev[id] ?? false)
    }));
  };

  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full flex flex-col h-full bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="font-bold text-lg text-gray-900">
           {title}
        </div>
        <button
          onClick={() => setShowMonthly(!showMonthly)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          {showMonthly ? (
            <>
              <EyeOff size={16} />
              월별 숨기기
            </>
          ) : (
            <>
              <Eye size={16} />
              월별 보기
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-auto relative">
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
                      // First Column
                      index === 0 && "sticky left-0 z-30 text-left min-w-[180px] pl-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", 
                      // Middle Columns (Data) - reduced width
                      index !== 0 && !isLast && "text-right font-semibold text-gray-800 min-w-[100px]",
                      // Last Column (Detail/Memo) - wider width
                      isLast && "text-left font-extrabold min-w-[300px] bg-gray-50"
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
                      group.isHeader ? "font-bold text-gray-900" : "font-medium text-gray-900"
                    )}
                  >
                    {visibleData.map((cell, cellIndex) => {
                      const isNumber = /^-?\$?[\d,]+(\.\d+)?%?$/.test(cell.trim()) || cell.trim() === '-';
                      const isNegative = cell.includes('-');
                      const isLast = cellIndex === visibleData.length - 1;
                      
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-3 border-b border-gray-100 text-gray-900",
                            // First Column
                            cellIndex === 0 && "sticky left-0 z-10 text-left flex items-center gap-2 bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap", 
                            // Middle Columns
                            cellIndex !== 0 && !isLast && "text-right whitespace-nowrap",
                            // Last Column (Detail) - Allow text wrapping
                            isLast && "text-left bg-gray-50 group-hover:bg-gray-100 font-normal text-gray-700 whitespace-normal break-words",
                            // Number formatting
                            !isLast && isNumber && isNegative && "text-red-600"
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
                          
                          {/* Format numbers, but leave text as is for Last Column */}
                          {!isLast && isNumber && isNegative ? cell.replace('-', '(').replace('$', '$ ') + ')' : cell}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Children Rows */}
                  {hasChildren && isExpanded && group.children.map((childRow, childIndex) => {
                    const visibleChildData = getVisibleCells(childRow);
                    return (
                      <tr 
                        key={`${group.id}-child-${childIndex}`}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {visibleChildData.map((cell, cellIndex) => {
                          const isNumber = /^-?\$?[\d,]+(\.\d+)?%?$/.test(cell.trim()) || cell.trim() === '-';
                          const isNegative = cell.includes('-');
                          const isLast = cellIndex === visibleChildData.length - 1;

                          return (
                            <td
                              key={cellIndex}
                              className={cn(
                                "px-4 py-2 border-b border-gray-100 text-gray-800",
                                // Indentation
                                cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap",
                                // Middle Columns
                                cellIndex !== 0 && !isLast && "text-right font-normal whitespace-nowrap",
                                // Last Column (Detail)
                                isLast && "text-left bg-gray-50 font-normal text-gray-600 whitespace-normal break-words",
                                // Number formatting
                                !isLast && isNumber && isNegative && "text-red-600"
                              )}
                            >
                               {!isLast && isNumber && isNegative ? cell.replace('-', '(').replace('$', '$ ') + ')' : cell}
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
