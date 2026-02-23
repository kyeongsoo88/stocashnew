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

  // 마크다운 스타일 텍스트 렌더링
  const renderText = (text: string) => {
    // 줄바꿈 처리
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, lineIndex) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const content = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const innerContent = part.slice(2, -2);
              const isNegative = innerContent.includes('-') && !innerContent.includes('+');
              const isPositive = innerContent.includes('+');
              
              return (
                <span
                  key={i}
                  className={`font-medium ${
                    isNegative ? 'text-red-500' : isPositive ? 'text-blue-600' : 'text-slate-900'
                  }`}
                >
                  {innerContent}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          });

          return (
            <div key={lineIndex} className={lineIndex > 0 ? "pl-4 mt-1 text-gray-600" : ""}>
               {content}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-300 h-full overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-300 bg-white">
        <h2 className="text-lg font-bold text-gray-900">설명과 분석</h2>
      </div>
      
      {/* 상태 정보 표시 */}
      {showStatus && statusInfo && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-blue-900">환경 변수 상태</span>
            <button onClick={() => setShowStatus(false)} className="text-blue-600 hover:text-blue-800">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-1 text-blue-800">
            <div>✅ Upstash 설정: {statusInfo.upstashConfigured ? '✓ 완료' : '✗ 미완료'}</div>
            <div>📍 URL: {statusInfo.hasUrl ? '✓ 설정됨' : '✗ 없음'} ({statusInfo.urlPreview})</div>
            <div>🔑 Token: {statusInfo.hasToken ? '✓ 설정됨' : '✗ 없음'} ({statusInfo.tokenPreview})</div>
            {!statusInfo.upstashConfigured && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900">
                <div className="font-bold mb-1">⚠️ Upstash가 설정되지 않았습니다</div>
                <div className="text-xs space-y-1">
                  <div>1. Vercel &gt; Settings &gt; Environment Variables 확인</div>
                  <div>2. UPSTASH_REDIS_REST_URL 확인</div>
                  <div>3. UPSTASH_REDIS_REST_TOKEN 확인</div>
                  <div>4. Deployments &gt; 최신 배포 &gt; Redeploy</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <div className="p-6 space-y-8 overflow-y-auto flex-1">
        {/* Section 1: 핵심 인사이트 */}
        <div>
          <div className="flex items-center justify-between mb-3 border-l-4 border-blue-600 pl-3">
            <h3 className="text-lg font-bold text-gray-900">핵심 인사이트</h3>
            {!isEditingInsights ? (
              <button
                onClick={() => setIsEditingInsights(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={12} />
                편집
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditedInsights(insights);
                    setIsEditingInsights(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  <X size={12} />
                  취소
                </button>
                <button
                  onClick={handleSaveInsights}
                  disabled={saving}
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save size={12} />
                  {saving ? '저장중...' : '저장'}
                </button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">로딩 중...</div>
          ) : isEditingInsights ? (
            <div className="space-y-2">
              {editedInsights.map((insight, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={insight}
                    onChange={(e) => {
                      const newInsights = [...editedInsights];
                      newInsights[index] = e.target.value;
                      setEditedInsights(newInsights);
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white resize-none min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="인사이트를 입력하세요..."
                  />
                  <button
                    onClick={() => {
                      const newInsights = editedInsights.filter((_, i) => i !== index);
                      setEditedInsights(newInsights);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="삭제"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditedInsights([...editedInsights, ''])}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-xs flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                인사이트 추가
              </button>
            </div>
          ) : (
            <ul className="space-y-3 text-sm text-gray-800 leading-relaxed">
              {insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex gap-2 items-start"
                >
                  <span className="text-gray-400 mt-0.5 shrink-0">✓</span>
                  <div className="flex-1">{renderText(insight)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 2: 2026년 현금흐름표 */}
        <div>
          <div className="border-l-4 border-green-600 pl-3 mb-3">
             <h3 className="text-lg font-bold text-gray-900">2026년 현금흐름표</h3>
          </div>
          <div className="space-y-2.5 text-sm text-gray-800 leading-relaxed pl-1">
            <div>
              <span className="font-bold text-gray-900 mr-1">영업활동:</span>
              <span className="text-gray-700">매출 수금 전년비 +3.4% 증가 물품대 전년비 △775M 감소계획 (생산비 △1,175M 감소 + 전년 연체분 +200M 상환)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">자산성지출:</span>
              <span className="text-gray-700">연간 (38.9M위안) (전년 대비 4.35M위안, +10.1%)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">기타수익:</span>
              <span className="text-gray-700">연간 68.5M위안 (전년 대비 23.1M위안, +51.0%)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">차입금:</span>
              <span className="text-gray-700">연간 730M 상환 (vs 전년 409M 순차입)</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">net cash:</span>
              <span className="text-gray-700">연간 (10.8M위안) (전년 대비 24.5M위안, +69.3%)</span>
            </div>
          </div>
        </div>

        {/* Section 3: 2026년 운전자본표 */}
        <div>
          <div className="border-l-4 border-purple-600 pl-3 mb-3">
             <h3 className="text-lg font-bold text-gray-900">2026년 운전자본표</h3>
          </div>
          <div className="space-y-2.5 text-sm text-gray-800 leading-relaxed pl-1">
            <div>
              <span className="font-bold text-gray-900 mr-1">매출채권:</span>
              <span className="text-gray-700">매출채권이 전년 대비 182M위안 감소하여 현금 유입에 기여. 연중 균등하게 개선되어 구조적 변화로 판단.</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">재고자산:</span>
              <span className="text-gray-700">재고자산이 582M위안 감소하여 현금 유입 기여. 연중 균등 감소하여 보수적 재고 운영 정책으로 판단.</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 mr-1">매입채무:</span>
              <span className="text-gray-700">매입채무가 잔액이 450M위안 감소는 전년 연체 200M 해소 및 재고매입 감소분 반영</span>
            </div>
          </div>
        </div>

        {/* Section 4: 관리 포인트 */}
        <div>
          <div className="border-l-4 border-orange-400 pl-3 mb-3">
             <h3 className="text-lg font-bold text-gray-900">관리 포인트</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-800 leading-relaxed pl-1">
            <li className="flex gap-2">
              <span className="text-gray-400 shrink-0"></span>
              <span>월별 운전자본 계획대비 실적 모니터링 (출고 계획 진척 및 목표 재고주수 기반 발주 진행)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 shrink-0"></span>
              <span>재고 수준 적정성 검토: 매출 추세 반영 유동적 재고 매입계획 반영</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 shrink-0"></span>
              <span>선수금 한도 내, 대리상 여신 운영을 통한 재무 안정성 확보</span>
            </li>
          </ul>
        </div>

        {/* Card 2: 주요 변동 내역 (Hidden by default, can be shown if needed) */}
        {changes.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">주요 변동 내역</h3>
              {!isEditingChanges ? (
                <button
                  onClick={() => setIsEditingChanges(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={12} />
                  편집
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditedChanges(changes);
                      setIsEditingChanges(false);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                  >
                    <X size={12} />
                    취소
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={12} />
                    {saving ? '저장중...' : '저장'}
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
                          const newChanges = [...editedChanges];
                          newChanges[index].title = e.target.value;
                          setEditedChanges(newChanges);
                        }}
                        className="flex-1 font-bold text-gray-900 border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500 bg-white text-sm"
                        placeholder="제목"
                      />
                      <button
                        onClick={() => {
                          const newChanges = editedChanges.filter((_, i) => i !== index);
                          setEditedChanges(newChanges);
                        }}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={14} />
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
                      className="w-full text-xs text-gray-700 mb-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                      placeholder="값"
                    />
                    <input
                      type="text"
                      value={change.description || ''}
                      onChange={(e) => {
                        const newChanges = [...editedChanges];
                        newChanges[index].description = e.target.value;
                        setEditedChanges(newChanges);
                      }}
                      className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                      placeholder="설명 (선택사항)"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditedChanges([...editedChanges, { title: '', value: '', description: '' }]);
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-xs flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  항목 추가
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div key={index}>
                    <div className="font-bold text-gray-900 mb-1 text-sm">{change.title}</div>
                    <div className="text-xs text-gray-700">
                      {renderText(change.value)}
                      {change.description && (
                        <p className="text-xs text-gray-600 mt-1">{change.description}</p>
                      )}
                    </div>
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
