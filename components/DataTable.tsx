import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataTableProps {
  headers: string[];
  rows: string[][];
  title?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, title }) => {
  if (!headers.length) return <div className="p-4 text-gray-500">No data available</div>;

  return (
    <div className="w-full flex flex-col h-full border rounded-lg shadow-sm bg-white overflow-hidden">
      {title && (
        <div className="p-4 border-b bg-gray-50 font-semibold text-lg">
          {title}
        </div>
      )}
      <div className="flex-1 overflow-auto relative">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-gray-700 border-b border-r last:border-r-0 whitespace-nowrap bg-gray-100",
                    index === 0 && "sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", // Sticky first column
                    index === 0 && "min-w-[250px]", // Minimum width for first column
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={cn(
                  "hover:bg-blue-50 transition-colors",
                  // Highlight specific rows based on content (simple heuristic)
                  (row[0]?.includes("Total") || row[0]?.includes("Profit") || row[0]?.includes("Equity")) && "font-bold bg-gray-50"
                )}
              >
                {row.map((cell, cellIndex) => {
                  const isNumber = /^-?\$?[\d,]+(\.\d+)?%?$/.test(cell.trim()) || cell.trim() === '-';
                  const isNegative = cell.includes('-');
                  
                  return (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-4 py-2 border-r last:border-r-0 whitespace-nowrap text-gray-800 bg-white",
                        cellIndex === 0 && "sticky left-0 z-10 font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                        cellIndex !== 0 && "text-right font-mono", // Numbers align right
                        isNumber && isNegative && "text-red-600" // Negative numbers in red
                      )}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

