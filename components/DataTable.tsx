import React, { useState, useMemo } from 'react';
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
}

interface GroupedRow {
  id: string;
  data: string[];
  children: string[][];
  isHeader: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title }) => {
  // Toggle state for row groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Operating activities": true,
    "Investing activities": true,
    "Financing activities": true,
    "영업활동": true,
    "투자활동": true,
    "재무활동": true,
  });

  // Grouping logic based on specific keywords
  const groupedData = useMemo(() => {
    const groups: GroupedRow[] = [];
    let currentGroup: GroupedRow | null = null;

    // Keywords that start a new group (Parent rows)
    // English or Korean keywords based on CSV content
    const parentKeywords = [
      "Operating activities", "Investing activities", "Financing activities",
      "영업활동", "투자활동", "재무활동"
    ];

    // Keywords that are standalone (No children)
    const standaloneKeywords = [
      "Beginning balances", "Ending balances",
      "기초잔액", "기말잔액"
    ];

    rows.forEach((row, index) => {
      const firstCell = row[0] || ""; // Content column
      const secondCell = row[1] || ""; // Korean label column

      // Check if this row is a parent
      const isParent = parentKeywords.some(k => firstCell.includes(k) || secondCell.includes(k));
      // Check if this row is standalone
      const isStandalone = standaloneKeywords.some(k => firstCell.includes(k) || secondCell.includes(k));

      if (isParent) {
        // Start a new group with children
        currentGroup = {
          id: firstCell + index, // unique id
          data: row,
          children: [],
          isHeader: true
        };
        groups.push(currentGroup);
      } else if (isStandalone) {
        // Standalone row (like Beginning/Ending balances) - treat as a group with no children or just a separate row
        // Here we treat it as a header with no children effectively (or we can handle it separately)
        currentGroup = null; // Reset current group so subsequent rows don't get added to it
        groups.push({
          id: firstCell + index,
          data: row,
          children: [],
          isHeader: true // Render as bold/main row
        });
      } else {
        // This is a child row
        if (currentGroup) {
          currentGroup.children.push(row);
        } else {
          // Orphan row (shouldn't happen usually based on structure, but handle gracefully)
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

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full flex flex-col h-full bg-white overflow-hidden">
      {/* Optional Title */}
      {title && (
        <div className="p-4 border-b border-gray-200 bg-white font-bold text-lg text-gray-900">
          {title}
        </div>
      )}
      
      <div className="flex-1 overflow-auto relative">
        <table className="min-w-full text-sm border-collapse">
          {/* Header */}
          <thead className="bg-white sticky top-0 z-20">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-4 py-3 font-bold text-gray-900 border-b border-gray-200 whitespace-nowrap bg-white",
                    index === 0 && "sticky left-0 z-30 text-left min-w-[250px] pl-6", // First column sticky
                    index !== 0 && "text-right font-normal text-gray-600", // Data columns
                    index === headers.length - 1 && "bg-gray-50 text-gray-900 font-bold" // Last column (Total) style
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {groupedData.map((group) => {
              const isExpanded = expandedGroups[group.id] ?? true; // Default to expanded
              const hasChildren = group.children.length > 0;

              return (
                <React.Fragment key={group.id}>
                  {/* Parent / Main Row */}
                  <tr 
                    onClick={() => hasChildren && toggleGroup(group.id)}
                    className={cn(
                      "group transition-colors",
                      hasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                      group.isHeader ? "font-bold text-gray-900 bg-gray-50/50" : ""
                    )}
                  >
                    {group.data.map((cell, cellIndex) => {
                      const isNumber = /^-?\$?[\d,]+(\.\d+)?%?$/.test(cell.trim()) || cell.trim() === '-';
                      const isNegative = cell.includes('-');
                      
                      return (
                        <td
                          key={cellIndex}
                          className={cn(
                            "px-4 py-3 whitespace-nowrap border-b border-gray-100",
                            // First Column Styles
                            cellIndex === 0 && "sticky left-0 z-10 text-left flex items-center gap-2 bg-white group-hover:bg-gray-50", 
                            // Other Columns Styles
                            cellIndex !== 0 && "text-right",
                            // Total Column Styles
                            cellIndex === group.data.length - 1 && "bg-gray-50 group-hover:bg-gray-100 font-bold",
                            // Negative Number Style
                            isNumber && isNegative && "text-red-600"
                          )}
                        >
                          {cellIndex === 0 && hasChildren && (
                            <span className="text-gray-400">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          )}
                          {/* If no children but it is a header row (like Beginning Balance), add some spacing or icon placeholder if needed, currently just text */}
                          {cellIndex === 0 && !hasChildren && group.isHeader && (
                             <span className="w-4 inline-block"></span> // Placeholder for alignment
                          )}
                          
                          {/* Format negative numbers with parentheses if needed, or keep red color */}
                          {isNumber && isNegative ? cell.replace('-', '(').replace('$', '$ ') + ')' : cell}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Children Rows */}
                  {hasChildren && isExpanded && group.children.map((childRow, childIndex) => (
                    <tr 
                      key={`${group.id}-child-${childIndex}`}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {childRow.map((cell, cellIndex) => {
                        const isNumber = /^-?\$?[\d,]+(\.\d+)?%?$/.test(cell.trim()) || cell.trim() === '-';
                        const isNegative = cell.includes('-');

                        return (
                          <td
                            key={cellIndex}
                            className={cn(
                              "px-4 py-2 whitespace-nowrap border-b border-gray-100 text-gray-600",
                              // First Column (Indented)
                              cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 bg-white",
                              // Other Columns
                              cellIndex !== 0 && "text-right font-normal",
                               // Total Column
                              cellIndex === childRow.length - 1 && "bg-gray-50 font-medium text-gray-900",
                              // Negative Number
                              isNumber && isNegative && "text-red-500"
                            )}
                          >
                             {isNumber && isNegative ? cell.replace('-', '(').replace('$', '$ ') + ')' : cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
