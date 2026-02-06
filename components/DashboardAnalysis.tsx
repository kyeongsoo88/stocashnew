'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, RefreshCw, Plus } from 'lucide-react';

interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

export const DashboardAnalysis = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [isEditingChanges, setIsEditingChanges] = useState(false);
  const [editedInsights, setEditedInsights] = useState<string[]>([]);
  const [editedChanges, setEditedChanges] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsRes, changesRes] = await Promise.all([
        fetch('/api/insights'),
        fetch('/api/changes'),
      ]);
      
      const insightsData = await insightsRes.json();
      const changesData = await changesRes.json();
      
      setInsights(insightsData.insights || []);
      setEditedInsights(insightsData.insights || []);
      setChanges(changesData.changes || []);
      setEditedChanges(changesData.changes || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 인사이트 저장
  const handleSaveInsights = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights: editedInsights }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setIsEditingInsights(false);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save insights:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 주요 변동 내역 저장
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: editedChanges }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChanges(data.changes);
        setIsEditingChanges(false);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 마크다운 스타일 텍스트 렌더링
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        const isNegative = content.includes('-') && !content.includes('+');
        const isPositive = content.includes('+');
        
        return (
          <span
            key={i}
            className={`font-medium ${
              isNegative ? 'text-red-500' : isPositive ? 'text-blue-600' : 'text-slate-900'
            }`}
          >
            {content}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">2026년 현금흐름 분석</h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Card 1: Key Insights */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="font-bold text-lg text-slate-800">핵심 인사이트</h3>
            </div>
            {!isEditingInsights ? (
              <button
                onClick={() => setIsEditingInsights(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit2 size={14} />
                편집
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditedInsights(insights);
                    setIsEditingInsights(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <X size={14} />
                  취소
                </button>
                <button
                  onClick={handleSaveInsights}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? '저장중...' : '저장'}
                </button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-4 text-gray-500">로딩 중...</div>
          ) : isEditingInsights ? (
            <div className="space-y-3">
              {editedInsights.map((insight, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={insight}
                    onChange={(e) => {
                      const newInsights = [...editedInsights];
                      newInsights[index] = e.target.value;
                      setEditedInsights(newInsights);
                    }}
                    className="flex-1 p-3 border border-gray-300 rounded-md text-sm text-gray-900 bg-white resize-none min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="인사이트를 입력하세요..."
                  />
                  <button
                    onClick={() => {
                      const newInsights = editedInsights.filter((_, i) => i !== index);
                      setEditedInsights(newInsights);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="삭제"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditedInsights([...editedInsights, ''])}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                인사이트 추가
              </button>
            </div>
          ) : (
            <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
              {insights.map((insight, index) => (
                <li
                  key={index}
                  className={`flex gap-2 ${index === 0 ? 'bg-yellow-50 p-3 rounded-md' : ''}`}
                >
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>{renderText(insight)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 2: 주요 변동 내역 */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-green-600 rounded-full"></div>
              <h3 className="font-bold text-lg text-slate-800">주요 변동 내역</h3>
            </div>
            {!isEditingChanges ? (
              <button
                onClick={() => setIsEditingChanges(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit2 size={14} />
                편집
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditedChanges(changes);
                    setIsEditingChanges(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <X size={14} />
                  취소
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? '저장중...' : '저장'}
                </button>
              </div>
            )}
          </div>
          
          {isEditingChanges ? (
            <div className="space-y-4">
              {editedChanges.map((change, index) => (
                <div key={index} className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={change.title}
                      onChange={(e) => {
                        const newChanges = [...editedChanges];
                        newChanges[index].title = e.target.value;
                        setEditedChanges(newChanges);
                      }}
                      className="flex-1 font-bold text-slate-800 border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      placeholder="제목"
                    />
                    <button
                      onClick={() => {
                        const newChanges = editedChanges.filter((_, i) => i !== index);
                        setEditedChanges(newChanges);
                      }}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={change.value}
                    onChange={(e) => {
                      const newChanges = [...editedChanges];
                      newChanges[index].value = e.target.value;
                      setEditedChanges(newChanges);
                    }}
                    className="w-full text-sm text-slate-600 mb-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    placeholder="값 (예: 연간 -30 **(전년 대비 +5,236 개선)**)"
                  />
                  <input
                    type="text"
                    value={change.description || ''}
                    onChange={(e) => {
                      const newChanges = [...editedChanges];
                      newChanges[index].description = e.target.value;
                      setEditedChanges(newChanges);
                    }}
                    className="w-full text-xs text-slate-500 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    placeholder="설명 (선택사항)"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setEditedChanges([...editedChanges, { title: '', value: '', description: '' }]);
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                항목 추가
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {changes.map((change, index) => (
                <div key={index}>
                  <div className="font-bold text-slate-800 mb-1">{change.title}</div>
                  <div className="text-sm text-slate-600">
                    {renderText(change.value)}
                    {change.description && (
                      <p className="text-xs text-slate-500 mt-1">{change.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
