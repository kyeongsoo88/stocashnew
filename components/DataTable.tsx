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
}

interface GroupedRow {
  id: string;
  data: string[];
  children: string[][];
  isHeader: boolean;
  depth: number; // 0 for root, 1 for parent, 2 for child
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title }) => {
  // Toggle state for row groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Initialize all groups to expanded on load
  useEffect(() => {
    // This effect runs when rows change to set default expanded state
    // We can't do this easily in useMemo without side effects
    setExpandedGroups(prev => {
        // Expand all by default
        return prev; // Or logic to expand all new keys
    });
  }, [rows]);

  // Grouping logic based on specific keywords
  const groupedData = useMemo(() => {
    const groups: GroupedRow[] = [];
    let currentGroup: GroupedRow | null = null;

    // Keywords that start a new group (Parent rows that have children)
    const parentKeywords = [
      // CF
      "Operating activities", "Investing activities", "Financing activities",
      "영업활동", "투자활동", "재무활동",
      // PL
      "MSRP Sales", "Net Sales", "Direct Cost", "G&A", "Other Income",
      // BS (Sub-categories treated as parents)
      "Current Assets", "Non-Current Assets", "Current Liabilities", "Non-Current Liabilities", "Stockholder's Equity"
    ];

    // Keywords that are standalone headers (Grand parents or simple headers)
    const standaloneKeywords = [
      // CF
      "Beginning balances", "Ending balances", "기초잔액", "기말잔액",
      // PL
      "CoGs", "Discount Rate",
      // BS (Root categories)
      "Assets", "Liabilities"
    ];

    rows.forEach((row, index) => {
      const firstCell = row[0] || ""; 
      const secondCell = row[1] || ""; // For CF korean column
      const content = firstCell + secondCell;

      // Check for Parent
      const isParent = parentKeywords.some(k => content.includes(k));
      // Check for Standalone
      // Precise match or starts with for some
      const isStandalone = standaloneKeywords.some(k => content.includes(k));

      if (isStandalone) {
         // Standalone header - close previous group
         currentGroup = null;
         groups.push({
           id: content + index,
           data: row,
           children: [],
           isHeader: true,
           depth: 0
         });
      } else if (isParent) {
        // Start a new group
        currentGroup = {
          id: content + index, // unique id
          data: row,
          children: [],
          isHeader: true,
          depth: 1
        };
        groups.push(currentGroup);
        // Ensure this new group is expanded by default (for initial render)
        // Note: We can't set state here, handled by default value in map
      } else {
        // Child row
        if (currentGroup) {
          currentGroup.children.push(row);
        } else {
          // Orphan row - treat as depth 0 or 1? 
          // If it's PL items under standalone CoGs, maybe they should be separate?
          // For now, treat as independent rows
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
  }, [rows]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !(prev[id] ?? true) // Default to true if undefined
    }));
  };

  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full flex flex-col h-full bg-white overflow-hidden">
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
                    index === 0 && "sticky left-0 z-30 text-left min-w-[250px] pl-6", 
                    index !== 0 && "text-right font-normal text-gray-600",
                    index === headers.length - 1 && "bg-gray-50 text-gray-900 font-bold"
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
              const isExpanded = expandedGroups[group.id] ?? true; 
              const hasChildren = group.children.length > 0;

              return (
                <React.Fragment key={group.id}>
                  {/* Parent Row */}
                  <tr 
                    onClick={() => hasChildren && toggleGroup(group.id)}
                    className={cn(
                      "group transition-colors",
                      hasChildren ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50",
                      group.isHeader ? "font-bold text-gray-900" : ""
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
                            // First Column
                            cellIndex === 0 && "sticky left-0 z-10 text-left flex items-center gap-2 bg-white group-hover:bg-gray-50", 
                            // Indentation for Depth 1 parents (if needed, currently flat for parents)
                            // Other Columns
                            cellIndex !== 0 && "text-right",
                            // Total Column
                            cellIndex === group.data.length - 1 && "bg-gray-50 group-hover:bg-gray-100 font-bold",
                            // Negative
                            isNumber && isNegative && "text-red-600"
                          )}
                        >
                          {cellIndex === 0 && hasChildren && (
                            <span className="text-gray-400">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          )}
                          {cellIndex === 0 && !hasChildren && group.isHeader && (
                             <span className="w-4 inline-block"></span> 
                          )}
                          
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
                              // Indentation for Children (pl-10)
                              cellIndex === 0 && "sticky left-0 z-10 text-left pl-10 bg-white",
                              cellIndex !== 0 && "text-right font-normal",
                              cellIndex === childRow.length - 1 && "bg-gray-50 font-medium text-gray-900",
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
