"use client";

import { useEffect, useState } from "react";
import { fetchAndParseCsv, ParsedData } from "@/utils/csv";
import { DataTable } from "@/components/DataTable";
import { 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  Briefcase, 
  Wallet,
} from "lucide-react";

type Tab = "CF" | "PL" | "BS";

// Helper to parse currency string to number
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove $, commas, % and parentheses for negative numbers
  let cleanValue = value.toString().replace(/[$,%]/g, '');
  
  // Handle negative numbers in parentheses (e.g. (1,234)) - though CSV usually has -1234
  if (cleanValue.includes('(') && cleanValue.includes(')')) {
    cleanValue = '-' + cleanValue.replace(/[()]/g, '');
  }
  
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("CF");
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const fileName = tab.toLowerCase() + ".csv";
      const result = await fetchAndParseCsv(`/data/${fileName}`);
      
      // Calculate YoY for PL tab
      if (tab === "PL" && result.headers.length > 0) {
        // Add YoY header
        result.headers.push("YoY");
        
        // Calculate YoY for each row
        result.rows = result.rows.map(row => {
          // 2025 Total is usually at index 1 (after Content)
          const val2025 = parseCurrency(row[1]);
          // 2026 Total is at the last index
          const val2026 = parseCurrency(row[row.length - 1]);
          
          let yoy = "";
          
          // Avoid division by zero
          if (val2025 !== 0) {
            const diff = val2026 - val2025;
            const percent = (diff / Math.abs(val2025)) * 100;
            yoy = (percent > 0 ? "+" : "") + percent.toFixed(1) + "%";
          } else if (val2026 !== 0) {
            // 2025 is 0 but 2026 has value -> 100% growth or new
            yoy = "+100.0%"; // Or "New"
          } else {
            yoy = "-";
          }
          
          return [...row, yoy];
        });
      }

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const tabs = [
    { id: "CF", label: "현금흐름표", icon: Wallet, disabled: false },
    { id: "PL", label: "손익계산서", icon: TrendingUp, disabled: false },
    { id: "BS", label: "재무상태표", icon: Briefcase, disabled: false },
  ];

  return (
    <main className="flex flex-col h-screen bg-gray-50 overflow-hidden font-['Pretendard']">
      {/* Header Section with Dark Background */}
      <header className="px-8 py-8 bg-slate-900 shadow-md shrink-0">
        <div className="max-w-[1800px] mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              STO 경영실적 대시보드
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="font-medium">마지막 업데이트: {lastUpdated.toLocaleTimeString()}</span>
              <button 
                onClick={() => fetchData(activeTab)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                title="데이터 새로고침"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              // Check if this tab is the currently active one
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as Tab)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg text-[15px] font-semibold transition-all duration-200
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                    ${tab.disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400" : "cursor-pointer"}
                  `}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 overflow-hidden">
        <div className="max-w-[1800px] mx-auto w-full h-full flex flex-col">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="font-medium">데이터를 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                <p className="text-lg font-semibold">오류 발생</p>
                <p>{error}</p>
              </div>
            ) : data ? (
              <DataTable 
                headers={data.headers} 
                rows={data.rows} 
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
