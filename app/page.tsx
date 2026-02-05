"use client";

import { useEffect, useState } from "react";
import { fetchAndParseCsv, ParsedData } from "@/utils/csv";
import { DataTable } from "@/components/DataTable";
import { Loader2, RefreshCw } from "lucide-react";

type Tab = "CF" | "PL" | "BS";

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
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please check if the CSV file exists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: "CF", label: "Cash Flow", color: "border-blue-500 text-blue-600" },
    { id: "PL", label: "Profit & Loss", color: "border-green-500 text-green-600" },
    { id: "BS", label: "Balance Sheet", color: "border-purple-500 text-purple-600" },
  ];

  return (
    <main className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Financial Dashboard</h1>
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
            2025-2026
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          <button 
            onClick={() => fetchData(activeTab)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex space-x-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 text-sm font-medium rounded-t-lg border-t border-l border-r border-transparent transition-all
                ${activeTab === tab.id 
                  ? `bg-white ${tab.color} border-gray-200 border-b-white translate-y-[1px]` 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 pt-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="animate-spin mr-2" />
            Loading {activeTab} data...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        ) : data ? (
          <DataTable 
            headers={data.headers} 
            rows={data.rows} 
            title={`${tabs.find(t => t.id === activeTab)?.label} Report`}
          />
        ) : null}
      </div>
    </main>
  );
}

