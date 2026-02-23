'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, RefreshCw, Plus, AlertCircle, Info } from 'lucide-react';

interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

interface StatusInfo {
  upstashConfigured: boolean;
  hasUrl: boolean;
  hasToken: boolean;
  urlPreview: string;
  tokenPreview: string;
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
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showStatus, setShowStatus] = useState(false);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);

  // localStorage 키
  const STORAGE_INSIGHTS_KEY = 'dashboard_insights';
  const STORAGE_CHANGES_KEY = 'dashboard_changes';

  // 환경 변수 상태 확인
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatusInfo(data);
      setShowStatus(true);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  // 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [insightsRes, changesRes] = await Promise.all([
        fetch('/api/insights'),
        fetch('/api/changes'),
      ]);
      
      const insightsData = await insightsRes.json();
      const changesData = await changesRes.json();
      
      // localStorage 사용 여부 확인
      if (insightsData.useLocalStorage || changesData.useLocalStorage) {
        setUseLocalStorage(true);
        
        // localStorage에서 데이터 로드
        const storedInsights = localStorage.getItem(STORAGE_INSIGHTS_KEY);
        const storedChanges = localStorage.getItem(STORAGE_CHANGES_KEY);
        
        const finalInsights = storedInsights ? JSON.parse(storedInsights) : insightsData.insights;
        const finalChanges = storedChanges ? JSON.parse(storedChanges) : changesData.changes;
        
        setInsights(finalInsights);
        setEditedInsights(finalInsights);
        setChanges(finalChanges);
        setEditedChanges(finalChanges);
      } else {
        setUseLocalStorage(false);
        setInsights(insightsData.insights || []);
        setEditedInsights(insightsData.insights || []);
        setChanges(changesData.changes || []);
        setEditedChanges(changesData.changes || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('데이터를 불러오는데 실패했습니다.');
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
    setErrorMessage('');
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights: editedInsights }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setInsights(data.insights);
        setIsEditingInsights(false);
        
        // localStorage에도 저장
        if (data.useLocalStorage) {
          localStorage.setItem(STORAGE_INSIGHTS_KEY, JSON.stringify(data.insights));
          alert('✅ 브라우저에 저장되었습니다.\n\n⚠️ Upstash Redis가 설정되지 않아 이 브라우저에만 저장됩니다.\n\n💡 해결 방법:\n1. Vercel에서 Environment Variables 확인\n2. 재배포 (Deployments > Redeploy)\n3. 상태 확인 버튼 클릭하여 디버그');
        } else {
          alert('✅ 저장되었습니다!');
        }
      } else {
        setErrorMessage(data.error || '저장에 실패했습니다.');
        alert(`❌ 저장 실패: ${data.error || '알 수 없는 오류'}\n\n${data.details || ''}`);
      }
    } catch (error) {
      console.error('Failed to save insights:', error);
      setErrorMessage('저장 중 오류가 발생했습니다.');
      alert(`❌ 저장 중 오류: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // 주요 변동 내역 저장
  const handleSaveChanges = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: editedChanges }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setChanges(data.changes);
        setIsEditingChanges(false);
        
        // localStorage에도 저장
        if (data.useLocalStorage) {
          localStorage.setItem(STORAGE_CHANGES_KEY, JSON.stringify(data.changes));
          alert('✅ 브라우저에 저장되었습니다.\n\n⚠️ Upstash Redis가 설정되지 않아 이 브라우저에만 저장됩니다.\n\n💡 해결 방법:\n1. Vercel에서 Environment Variables 확인\n2. 재배포 (Deployments > Redeploy)\n3. 상태 확인 버튼 클릭하여 디버그');
        } else {
          alert('✅ 저장되었습니다!');
        }
      } else {
        setErrorMessage(data.error || '저장에 실패했습니다.');
        alert(`❌ 저장 실패: ${data.error || '알 수 없는 오류'}\n\n${data.details || ''}`);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      setErrorMessage('저장 중 오류가 발생했습니다.');
      alert(`❌ 저장 중 오류: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // 마크다운 스타일 텍스트 렌더링 - 모든 글씨 검정색
  const renderText = (text: string) => {
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, lineIndex) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const content = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const innerContent = part.slice(2, -2);
              const isNegative = innerContent.includes('-') && !innerContent.includes('+');
              return (
                <span
                  key={i}
                  style={{ color: isNegative ? '#dc2626' : '#111827' }}
                  className="font-bold"
                >
                  {innerContent}
                </span>
              );
            }
            return <span key={i} style={{ color: '#111827' }}>{part}</span>;
          });
          return (
            <div key={lineIndex} style={{ color: '#111827' }} className={lineIndex > 0 ? "pl-4 mt-1" : ""}>
              {content}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-full overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold" style={{ color: '#111827' }}>설명과 분석</h2>
      </div>
      
      {/* 상태 정보 (숨김) */}
      {showStatus && statusInfo && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold" style={{ color: '#1e3a5f' }}>환경 변수 상태</span>
            <button onClick={() => setShowStatus(false)} style={{ color: '#2563eb' }}>
              <X size={16} />
            </button>
          </div>
          <div className="space-y-1" style={{ color: '#1e3a5f' }}>
            <div>✅ Upstash 설정: {statusInfo.upstashConfigured ? '✓ 완료' : '✗ 미완료'}</div>
            <div>📍 URL: {statusInfo.hasUrl ? '✓ 설정됨' : '✗ 없음'} ({statusInfo.urlPreview})</div>
            <div>🔑 Token: {statusInfo.hasToken ? '✓ 설정됨' : '✗ 없음'} ({statusInfo.tokenPreview})</div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm flex items-start gap-2" style={{ color: '#b91c1c' }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <div className="p-5 space-y-6 overflow-y-auto flex-1">

        {/* Section 1: 핵심 인사이트 */}
        <div className="border-l-4 border-blue-500 pl-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold" style={{ color: '#111827' }}>핵심 인사이트</h3>
            {!isEditingInsights ? (
              <button
                onClick={() => setIsEditingInsights(true)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <Edit2 size={12} />
                편집
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditedInsights(insights); setIsEditingInsights(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
                >
                  <X size={12} /> 취소
                </button>
                <button
                  onClick={handleSaveInsights}
                  disabled={saving}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs disabled:opacity-50"
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                >
                  <Save size={12} /> {saving ? '저장중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-4 text-sm" style={{ color: '#374151' }}>로딩 중...</div>
          ) : isEditingInsights ? (
            <div className="space-y-2">
              {editedInsights.map((insight, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={insight}
                    onChange={(e) => {
                      const n = [...editedInsights]; n[index] = e.target.value; setEditedInsights(n);
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white resize-none min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ color: '#111827' }}
                    placeholder="인사이트를 입력하세요..."
                  />
                  <button
                    onClick={() => setEditedInsights(editedInsights.filter((_, i) => i !== index))}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    style={{ color: '#dc2626' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditedInsights([...editedInsights, ''])}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-xs flex items-center justify-center gap-2 hover:border-blue-500"
                style={{ color: '#374151' }}
              >
                <Plus size={14} /> 인사이트 추가
              </button>
            </div>
          ) : (
            <ul className="space-y-2 text-sm leading-relaxed">
              {insights.map((insight, index) => (
                <li key={index} className="flex gap-2 items-start">
                  <span style={{ color: '#6b7280' }} className="mt-0.5 shrink-0">•</span>
                  <div className="flex-1">{renderText(insight)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 2: 주요 변동 내역 */}
        {changes.length > 0 && (
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold" style={{ color: '#111827' }}>주요 변동 내역</h3>
              {!isEditingChanges ? (
                <button
                  onClick={() => setIsEditingChanges(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  <Edit2 size={12} /> 편집
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditedChanges(changes); setIsEditingChanges(false); }}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
                  >
                    <X size={12} /> 취소
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs disabled:opacity-50"
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  >
                    <Save size={12} /> {saving ? '저장중...' : '저장'}
                  </button>
                </div>
              )}
            </div>

            {isEditingChanges ? (
              <div className="space-y-3">
                {editedChanges.map((change, index) => (
                  <div key={index} className="p-2 bg-white rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <input
                        type="text"
                        value={change.title}
                        onChange={(e) => {
                          const n = [...editedChanges]; n[index].title = e.target.value; setEditedChanges(n);
                        }}
                        className="flex-1 font-bold border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500 bg-white text-sm"
                        style={{ color: '#111827' }}
                        placeholder="제목"
                      />
                      <button
                        onClick={() => setEditedChanges(editedChanges.filter((_, i) => i !== index))}
                        className="ml-2 p-1 hover:bg-red-50 rounded"
                        style={{ color: '#dc2626' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={change.value}
                      onChange={(e) => {
                        const n = [...editedChanges]; n[index].value = e.target.value; setEditedChanges(n);
                      }}
                      className="w-full text-xs mb-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                      style={{ color: '#111827' }}
                      placeholder="값"
                    />
                    <input
                      type="text"
                      value={change.description || ''}
                      onChange={(e) => {
                        const n = [...editedChanges]; n[index].description = e.target.value; setEditedChanges(n);
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                      style={{ color: '#111827' }}
                      placeholder="설명 (선택사항)"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setEditedChanges([...editedChanges, { title: '', value: '', description: '' }])}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-xs flex items-center justify-center gap-2 hover:border-blue-500"
                  style={{ color: '#374151' }}
                >
                  <Plus size={14} /> 항목 추가
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {changes.map((change, index) => (
                  <div key={index} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="font-bold text-sm mb-1" style={{ color: '#111827' }}>{change.title}</div>
                    {change.value && (
                      <div className="text-sm leading-relaxed" style={{ color: '#2563eb' }}>{change.value}</div>
                    )}
                    {change.description && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: '#111827' }}>{change.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
