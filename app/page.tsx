"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAndParseCsv, ParsedData } from "@/utils/csv";
import { recalculateCashflow, updateCashloanFromCashflow, recalculateWorkingCapital } from "@/utils/calculation";
import { DataTable } from "@/components/DataTable";
import { DashboardAnalysis } from "@/components/DashboardAnalysis";
import { 
  Loader2, 
} from "lucide-react";

export default function Home() {
  // Base data (130% standard) loaded from CSV
  const [baseCashflowData, setBaseCashflowData] = useState<ParsedData | null>(null);
  const [baseCashloanData, setBaseCashloanData] = useState<ParsedData | null>(null);
  const [baseWorkingCapitalData, setBaseWorkingCapitalData] = useState<ParsedData | null>(null);
  const [baseSteCashflowData, setBaseSteCashflowData] = useState<ParsedData | null>(null);
  
  // Details data for each table
  const [cashflowDetails, setCashflowDetails] = useState<Record<string, string>>({});
  const [cashloanDetails, setCashloanDetails] = useState<Record<string, string>>({});
  const [workingCapitalDetails, setWorkingCapitalDetails] = useState<Record<string, string>>({});
  const [steCashflowDetails, setSteCashflowDetails] = useState<Record<string, string>>({});
  
  // Displayed data (recalculated based on growth rate)
  const [cashflowData, setCashflowData] = useState<ParsedData | null>(null);
  const [cashloanData, setCashloanData] = useState<ParsedData | null>(null);
  const [workingCapitalData, setWorkingCapitalData] = useState<ParsedData | null>(null);
  const [steCashflowData, setSteCashflowData] = useState<ParsedData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showMonthly, setShowMonthly] = useState(false);
  
  // Growth Rate State (Number, 100-200)
  const [growthRate, setGrowthRate] = useState<number>(100);
  
  // Local input value for typing experience
  const [inputValue, setInputValue] = useState<string>("100");
  
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    cashflow: true,
    cashloan: true,
    workingcapital: true,
    stecashflow: true,
  });
  const [expandAllGroups, setExpandAllGroups] = useState<Record<string, boolean>>({
    cashflow: false,
    cashloan: false,
    workingcapital: false,
    stecashflow: false,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load only the base files (standard 130% data)
      const [cfResult, clResult, wcResult, steResult, cfDetailsResult, clDetailsResult, wcDetailsResult, steDetailsResult] = await Promise.all([
        fetchAndParseCsv(`/data/cashflow.csv`),
        fetchAndParseCsv(`/data/cashloan.csv`),
        fetchAndParseCsv(`/data/workingcapital.csv`),
        fetchAndParseCsv(`/data/stecashflow.csv`),
        fetchAndParseCsv(`/data/cashflow_details.csv`),
        fetchAndParseCsv(`/data/cashloan_details.csv`),
        fetchAndParseCsv(`/data/workingcapital_details.csv`),
        fetchAndParseCsv(`/data/stecashflow_details.csv`),
      ]);
      
      setBaseCashflowData(cfResult);
      setBaseCashloanData(clResult); // Save base cashloan data
      setBaseWorkingCapitalData(wcResult); // Save base working capital data
      setBaseSteCashflowData(steResult); // Save base STE cashflow data

      // Parse details data into maps
      const cfDetailsMap: Record<string, string> = {};
      cfDetailsResult.rows.forEach(row => {
        const accountName = row[0]?.trim();
        const detail = row[1]?.trim() || '';
        if (accountName) {
          cfDetailsMap[accountName] = detail;
        }
      });
      setCashflowDetails(cfDetailsMap);

      const clDetailsMap: Record<string, string> = {};
      clDetailsResult.rows.forEach(row => {
        const accountName = row[0]?.trim();
        const detail = row[1]?.trim() || '';
        if (accountName) {
          clDetailsMap[accountName] = detail;
        }
      });
      setCashloanDetails(clDetailsMap);

      const wcDetailsMap: Record<string, string> = {};
      wcDetailsResult.rows.forEach(row => {
        const accountName = row[0]?.trim();
        const detail = row[1]?.trim() || '';
        if (accountName) {
          wcDetailsMap[accountName] = detail;
        }
      });
      setWorkingCapitalDetails(wcDetailsMap);

      const steDetailsMap: Record<string, string> = {};
      steDetailsResult.rows.forEach(row => {
        const accountName = row[0]?.trim();
        const detail = row[1]?.trim() || '';
        if (accountName) {
          steDetailsMap[accountName] = detail;
        }
      });
      setSteCashflowDetails(steDetailsMap);

      // Initialize with base data (100%) - CSV 원본 그대로 사용
      setCashflowData(cfResult);
      setCashloanData(clResult);
      setWorkingCapitalData(wcResult);
      setSteCashflowData(steResult);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate when growthRate changes
  useEffect(() => {
    if (baseCashflowData) {
      // 1. Recalculate Cash Flow
      const recalculatedCF = recalculateCashflow(baseCashflowData, growthRate);
      setCashflowData(recalculatedCF);

      // 2. Update Cash Loan Balance using recalculated Cash Flow
      if (baseCashloanData) {
        if (growthRate === 100) {
          setCashloanData(baseCashloanData);
        } else {
          const updatedCL = updateCashloanFromCashflow(baseCashloanData, recalculatedCF);
          setCashloanData(updatedCL);
        }
      }

      // 3. Recalculate Working Capital (매출 변동에 따른 재고 감소 + 합계 재계산)
      if (baseWorkingCapitalData) {
        if (growthRate === 100) {
          setWorkingCapitalData(baseWorkingCapitalData);
        } else {
          const updatedWC = recalculateWorkingCapital(baseWorkingCapitalData, baseCashflowData, recalculatedCF);
          setWorkingCapitalData(updatedWC);
        }
      }

      // 4. Recalculate STE Cash Flow (same logic as 현금흐름표)
      if (baseSteCashflowData) {
        const recalculatedSTE = recalculateCashflow(baseSteCashflowData, growthRate);
        setSteCashflowData(recalculatedSTE);
      }
    }
  }, [growthRate, baseCashflowData, baseCashloanData, baseWorkingCapitalData, baseSteCashflowData]);

  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const handleGrowthRateChange = (rate: number) => {
    setGrowthRate(rate);
    setInputValue(String(rate));
  };



  return (
    <main className="flex flex-col h-screen bg-gray-50 overflow-hidden font-['Pretendard']">
      {/* Header Section - 높이 고정. 드롭다운은 Portal로 body에 그려져 바와 무관 */}
      <header className="px-8 py-4 border-b border-blue-900 shrink-0 h-[74px] flex items-center overflow-hidden" style={{ backgroundColor: "#3b5998" }}>
        <div className="max-w-[1800px] mx-auto w-full flex items-center">
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-white mr-4 whitespace-nowrap">연간 자금계획</h1>

            <button
              onClick={() => setShowMonthly(!showMonthly)}
              className="px-4 py-2 bg-blue-800 text-white font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1 border border-blue-600 whitespace-nowrap"
            >
              월별 데이터 {showMonthly ? "접기 ▶" : "펼치기 ▶"}
            </button>

            {/* Growth Rate Slider - Embedded in Header */}
            <div className="flex items-center gap-3 ml-4 bg-blue-800/50 px-4 py-1.5 rounded-lg border border-blue-700">
              <span className="text-white text-sm font-medium whitespace-nowrap">성장률 설정</span>
              
              <div className="flex items-center gap-2">
                <span className="text-blue-200 text-xs">80%</span>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="1"
                  value={growthRate}
                  onChange={(e) => handleGrowthRateChange(Number(e.target.value))}
                  className="w-[150px] h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-blue-200 text-xs">200%</span>
              </div>
              
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="80"
                  max="200"
                  step="1"
                  value={inputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    // 타이핑 중인 값을 그대로 표시
                    setInputValue(val);
                    
                    // 유효한 숫자인 경우에만 실제 값 업데이트
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 80 && numVal <= 200) {
                      setGrowthRate(numVal);
                    }
                  }}
                  onBlur={(e) => {
                    // 포커스 아웃시 범위 검증 및 보정
                    const val = Number(e.target.value);
                    if (isNaN(val) || val < 80) {
                      handleGrowthRateChange(80);
                    } else if (val > 200) {
                      handleGrowthRateChange(200);
                    } else {
                      handleGrowthRateChange(val);
                    }
                  }}
                  className="w-[60px] px-2 py-1 text-center bg-white text-gray-900 font-bold text-base rounded border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-white font-medium text-base">%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-8 bg-gray-50 overflow-hidden">
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
            <div
              className={`grid gap-8 h-full ${!showMonthly ? '' : 'grid-cols-1'}`}
              style={!showMonthly ? { gridTemplateColumns: '4fr 1fr' } : undefined}
            >
              {/* Left Column: Tables */}
              <div className={`${!showMonthly ? '' : 'col-span-12'} overflow-y-auto space-y-6 pr-4 pb-6`}>
                {/* Cash Flow Table */}
                {cashflowData && (
                  <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">STO 현금흐름표 (단위 : K $)</h2>
                      <span className="text-sm text-blue-600 font-medium">(매출 {growthRate}% 가정)</span>
                      <button
                        onClick={() => toggleTable("cashflow")}
                        className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded hover:bg-gray-800 flex items-center gap-1 transition-colors"
                      >
                        {expandedTables.cashflow ? "접기 ▼" : "펼치기 ▼"}
                      </button>
                    </div>
                    {expandedTables.cashflow && (
                      <DataTable 
                        headers={cashflowData.headers} 
                        rows={cashflowData.rows}
                        showMonthly={showMonthly}
                        expandAll={expandAllGroups.cashflow}
                        onExpandAllChange={(val) => setExpandAllGroups(prev => ({ ...prev, cashflow: val }))}
                        headerStyle="dark"
                        useNewLayout={true}
                        detailsData={cashflowDetails}
                      />
                    )}
                  </div>
                )}

                {/* STE Cash Flow Table */}
                {steCashflowData && (
                  <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">STE 현금흐름표 (단위 : K $)</h2>
                      <span className="text-sm text-blue-600 font-medium">(매출 {growthRate}% 가정)</span>
                      <button
                        onClick={() => toggleTable("stecashflow")}
                        className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded hover:bg-gray-800 flex items-center gap-1 transition-colors"
                      >
                        {expandedTables.stecashflow ? "접기 ▼" : "펼치기 ▼"}
                      </button>
                    </div>
                    {expandedTables.stecashflow && (
                      <DataTable 
                        headers={steCashflowData.headers} 
                        rows={steCashflowData.rows}
                        showMonthly={showMonthly}
                        expandAll={expandAllGroups.stecashflow}
                        onExpandAllChange={(val) => setExpandAllGroups(prev => ({ ...prev, stecashflow: val }))}
                        headerStyle="dark"
                        useNewLayout={true}
                        detailsData={steCashflowDetails}
                      />
                    )}
                  </div>
                )}

                {/* Cash and Loan Balance Table */}
                {cashloanData && (
                  <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-white">
                      <h2 className="text-lg font-bold text-gray-900">현금잔액과 차입금잔액표</h2>
                    </div>
                    {expandedTables.cashloan && (
                      <DataTable 
                        headers={cashloanData.headers} 
                        rows={cashloanData.rows}
                        showMonthly={showMonthly}
                        expandAll={true}
                        headerStyle="dark"
                        useNewLayout={true}
                        detailsData={cashloanDetails}
                      />
                    )}
                  </div>
                )}

                {/* Working Capital Table */}
                {workingCapitalData && (
                  <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">운전자본표</h2>
                      <button
                        onClick={() => toggleTable("workingcapital")}
                        className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded hover:bg-gray-800 flex items-center gap-1 transition-colors"
                      >
                        {expandedTables.workingcapital ? "접기 ▼" : "펼치기 ▼"}
                      </button>
                    </div>
                    {expandedTables.workingcapital && (
                      <DataTable 
                        headers={workingCapitalData.headers} 
                        rows={workingCapitalData.rows}
                        showMonthly={showMonthly}
                        expandAll={expandAllGroups.workingcapital}
                        onExpandAllChange={(val) => setExpandAllGroups(prev => ({ ...prev, workingcapital: val }))}
                        headerStyle="dark"
                        useNewLayout={true}
                        detailsData={workingCapitalDetails}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Analysis (only when !showMonthly) */}
              {!showMonthly && (
                <div className="h-full overflow-hidden pb-6 pl-4">
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
