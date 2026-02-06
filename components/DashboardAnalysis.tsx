'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, RefreshCw } from 'lucide-react';

interface Insight {
  text: string;
  isHighlighted?: boolean;
}

export const DashboardAnalysis = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsights, setEditedInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 인사이트 데이터 불러오기
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      setInsights(data.insights || []);
      setEditedInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchInsights();
  }, []);

  // 인사이트 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ insights: editedInsights }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setIsEditing(false);
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

  // 편집 취소
  const handleCancel = () => {
    setEditedInsights(insights);
    setIsEditing(false);
  };

  // 인사이트 항목 업데이트
  const updateInsight = (index: number, value: string) => {
    const newInsights = [...editedInsights];
    newInsights[index] = value;
    setEditedInsights(newInsights);
  };

  // 인사이트 항목 추가
  const addInsight = () => {
    setEditedInsights([...editedInsights, '']);
  };

  // 인사이트 항목 삭제
  const removeInsight = (index: number) => {
    const newInsights = editedInsights.filter((_, i) => i !== index);
    setEditedInsights(newInsights);
  };

  // 마크다운 스타일 텍스트 렌더링
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        const isNegative = content.startsWith('-');
        const isPositive = content.startsWith('+');
        
        return (
          <span
            key={i}
            className={`font-bold ${
              isNegative ? 'text-red-600' : isPositive ? 'text-blue-600' : 'text-slate-900'
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
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit2 size={16} />
              편집
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <X size={16} />
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? '저장중...' : '저장'}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Card 1: Key Insights */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h3 className="font-bold text-lg text-slate-800">핵심 인사이트</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-4 text-gray-500">로딩 중...</div>
          ) : isEditing ? (
            <div className="space-y-3">
              {editedInsights.map((insight, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={insight}
                    onChange={(e) => updateInsight(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md text-sm resize-none min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="인사이트를 입력하세요..."
                  />
                  <button
                    onClick={() => removeInsight(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="삭제"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                onClick={addInsight}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm"
              >
                + 인사이트 추가
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

        {/* Card 2: 2026 Cashflow Details */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-green-600 rounded-full"></div>
            <h3 className="font-bold text-lg text-slate-800">주요 변동 내역</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-bold text-slate-800 mb-1">영업활동</div>
              <div className="text-sm text-slate-600">
                연간 -30 <span className="text-blue-600 font-medium">(전년 대비 +5,236 개선)</span>
              </div>
            </div>
            
            <div>
              <div className="font-bold text-slate-800 mb-1">재고자산의 변동</div>
              <div className="text-sm text-slate-600">
                연간 2,438 <span className="text-blue-600 font-medium">(전년 -1,619 대비 +4,056)</span>
                <p className="text-xs text-slate-500 mt-1">재고 효율화가 현금흐름 개선의 주요 요인으로 작용</p>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">기타영업 자산부채의 변동</div>
              <div className="text-sm text-slate-600">
                연간 -400 <span className="text-red-500 font-medium">(전년 +3,581 대비 -3,981)</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">STE 배당금</div>
              <div className="text-sm text-slate-600">
                연간 18,000 <span className="text-blue-600 font-medium">(2026년 11월 및 12월 수취)</span>
                <p className="text-xs text-slate-500 mt-1">STE 감자 승인 후 배당금 수취</p>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">차입금의 변동(본사 차입금)</div>
              <div className="text-sm text-slate-600">
                연간 -46,715
                <p className="text-xs text-slate-500 mt-1">26년 12월 F&F(OC) 차입금 18,000 상환예정</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
