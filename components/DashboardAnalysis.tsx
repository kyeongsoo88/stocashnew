import React from 'react';

export const DashboardAnalysis = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">설명과 분석</h2>
      </div>
      
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Card 1: Key Insights */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h3 className="font-bold text-lg text-slate-800">핵심 인사이트</h3>
          </div>
          
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                영업활동 현금흐름 2026년 221M위안으로 전년 대비 668M위안(149.3%) 증가. 영업활동 증가는 긍정적 신호로, 운전자본 효율화가 주요 개선 요인.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                2023~2025년 영업활동 연평균 14.7% 악화 추세. 2026년 구조적 개선 조치 필요.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                2026년 차입금 순 상환 609M위안으로 재무 레버리지 감소. 영업현금 개선이 차입금 상환 여력을 제공하며 재무 건전성 개선 중.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                <span className="font-bold text-slate-900">운전자본 변화:</span> 재고자산 505M위안 감소 → 회전율 개선, SKU/시즌 관리 효율화 가능성. 현금 전환 가속 및 향후 평가손/처분손 리스크 축소 / 매출채권 330M위안 감소 → 신용 관리 강화, 매출 '질' 개선 관점에서 긍정적. 할인·프로모션 중심 확대가 아닌 건전한 매출 구조로 전환
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                현금흐름 개선의 일부는 일시적 효과 가능성 존재. 월별 변동성이 높아 지속성 불확실로 2027년 지속 여부 모니터링 필요.
              </span>
            </li>
          </ul>
        </div>

        {/* Card 2: 2026 Cashflow Details */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-green-600 rounded-full"></div>
            <h3 className="font-bold text-lg text-slate-800">2026년 현금흐름표</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-bold text-slate-800 mb-1">영업활동</div>
              <div className="text-sm text-slate-600">
                연간 221M위안 <span className="text-blue-600 font-medium">(전년 대비 668M위안, +149.3%)</span>
              </div>
            </div>
            
            <div>
              <div className="font-bold text-slate-800 mb-1">자산성지출</div>
              <div className="text-sm text-slate-600">
                연간 (32.6M위안) <span className="text-blue-600 font-medium">(전년 대비 10.7M위안, +24.7%)</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">기타수익</div>
              <div className="text-sm text-slate-600">
                연간 2.12M위안 <span className="text-red-500 font-medium">(전년 대비 43.3M위안, -95.3%)</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">from 차입금</div>
              <div className="text-sm text-slate-600">
                연간 (200M위안) <span className="text-red-500 font-medium">(전년 대비 609M위안, -148.7%)</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">net cash</div>
              <div className="text-sm text-slate-600">
                연간 (9.53M위안) <span className="text-blue-600 font-medium">(전년 대비 25.8M위안, +73.0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

