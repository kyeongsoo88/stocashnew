"use client";

import { useEffect, useState } from "react";
import { fetchAndParseCsv, ParsedData } from "@/utils/csv";
import { DataTable } from "@/components/DataTable";
import { DashboardAnalysis } from "@/components/DashboardAnalysis";
import { 
  Loader2, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Home() {
  const [cashflowData, setCashflowData] = useState<ParsedData | null>(null);
  const [cashloanData, setCashloanData] = useState<ParsedData | null>(null);
  const [workingCapitalData, setWorkingCapitalData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showMonthly, setShowMonthly] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    cashflow: true,
    cashloan: true,
    workingcapital: true,
  });
  const [expandAllGroups, setExpandAllGroups] = useState<Record<string, boolean>>({
    cashflow: false,
    cashloan: false,
    workingcapital: false,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfResult, clResult, wcResult] = await Promise.all([
        fetchAndParseCsv(`/data/cashflow.csv`),
        fetchAndParseCsv(`/data/cashloan.csv`),
        fetchAndParseCsv(`/data/workingcapital.csv`),
      ]);
      
      setCashflowData(cfResult);
      setCashloanData(clResult);
      setWorkingCapitalData(wcResult);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  return (
    <main className="flex flex-col h-screen bg-white overflow-hidden font-['Pretendard']">
      {/* Header Section */}
      <header className="px-8 py-5 bg-white border-b border-gray-300 shrink-0">
        <div className="max-w-[1800px] mx-auto w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              STO 현금흐름표
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Monthly Toggle */}
              <button
                onClick={() => setShowMonthly(!showMonthly)}
                className="px-4 py-2 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                월별 데이터 {showMonthly ? "접기" : "펼치기"}
              </button>

              {/* Refresh */}
              <button 
                onClick={() => fetchData()}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 hover:text-gray-900"
                title="데이터 새로고침"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-8 bg-white overflow-hidden">
        <div className="max-w-[1800px] mx-auto w-full h-full">
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
          ) : (
            <div className={`grid gap-8 h-full ${!showMonthly ? 'grid-cols-12' : 'grid-cols-1'}`}>
              {/* Left Column: Tables */}
              <div className={`${!showMonthly ? 'col-span-7' : 'col-span-12'} overflow-y-auto space-y-6 pr-4 pb-6`}>
                {/* Cash Flow Table */}
                {cashflowData && (
                  <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-300 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">현금흐름표</h2>
                        <button
                          onClick={() => toggleTable("cashflow")}
                          className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
                        >
                          {expandedTables.cashflow ? "접기 ▲" : "펼치기 ▼"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                         {/* Removed expand all specific button to match screenshot simplified look, or keep it if needed. 
                            Screenshot shows just one button "펼치기 ▼". I will assume this toggles the table visibility (collapse/expand) 
                            OR it expands all groups. Given the context "펼치기", it usually means expand the section.
                            However, there is also "expandAllGroups". 
                            I will keep the main toggle as the "Table Visibility" toggle for now, styled as the dark button.
                         */}
                      </div>
                    </div>
                    {expandedTables.cashflow && (
                      <DataTable 
                        headers={cashflowData.headers} 
                        rows={cashflowData.rows}
                        showMonthly={showMonthly}
                        expandAll={expandAllGroups.cashflow}
                        onExpandAllChange={(val) => setExpandAllGroups(prev => ({ ...prev, cashflow: val }))}
                      />
                    )}
                  </div>
                )}

                {/* Cash and Loan Balance Table */}
                {cashloanData && (
                  <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-300 bg-white flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">현금잔액과 차입금잔액표</h2>
                    </div>
                    {expandedTables.cashloan && (
                      <DataTable 
                        headers={cashloanData.headers} 
                        rows={cashloanData.rows}
                        showMonthly={showMonthly}
                        expandAll={true} 
                      />
                    )}
                  </div>
                )}

                {/* Working Capital Table */}
                {workingCapitalData && (
                  <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-300 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">운전자본표</h2>
                        <button
                          onClick={() => toggleTable("workingcapital")}
                          className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
                        >
                          {expandedTables.workingcapital ? "접기 ▲" : "펼치기 ▼"}
                        </button>
                      </div>
                    </div>
                    {expandedTables.workingcapital && (
                      <DataTable 
                        headers={workingCapitalData.headers} 
                        rows={workingCapitalData.rows}
                        showMonthly={showMonthly}
                        expandAll={expandAllGroups.workingcapital}
                        onExpandAllChange={(val) => setExpandAllGroups(prev => ({ ...prev, workingcapital: val }))}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Analysis (only when !showMonthly) */}
              {!showMonthly && (
                <div className="col-span-5 h-full overflow-hidden pb-6 pl-4">
                  <DashboardAnalysis />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
