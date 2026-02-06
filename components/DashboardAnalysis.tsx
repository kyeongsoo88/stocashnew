import React from 'react';

export const DashboardAnalysis = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">2026년 현금흐름 분석</h2>
      </div>
      
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Card 1: Key Insights */}
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h3 className="font-bold text-lg text-slate-800">핵심 인사이트</h3>
          </div>
          
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <li className="flex gap-2 bg-yellow-50 p-3 rounded-md">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                STE배당금 2026년 11월 수취 예정, 2026년 12월 본사 차입금 상환 예정 (현재 영국 정부의 STE감자 승인 절차 진행중으로, 감자 승인 완료될시 즉시 배당 후 본사 차입금 상환 예정)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                영업활동 현금흐름은 <span className="font-bold text-red-600">-30</span>으로 여전히 음수이나, 전년(<span className="text-slate-500">-5,265</span>) 대비 <span className="font-bold text-blue-600">+5,236</span> 대폭 개선됨. 적자 폭이 크게 축소되며 현금흐름 건전성 회복 신호.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                당기순이익은 <span className="font-bold text-red-600">-1,814</span>이나 전년 대비 <span className="font-bold text-blue-600">+6,245</span> 증가하여 수익성 지표가 뚜렷하게 개선되는 추세.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                투자활동 지출은 2026년 0으로 최소화됨. 전년도 대규모 지출(-19,159) 이후 숨 고르기 단계로, 현금 유출 통제 중.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                재무활동은 <span className="font-bold text-slate-900">-276</span>으로 전환(전년 +28,422). 대규모 차입 없이 리스부채 상환 등 필수적인 재무 지출만 발생하며 부채 의존도 낮춤.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>
                기말잔액은 <span className="font-bold text-blue-600">7,257</span>로 안정적인 수준 유지(전년 7,563 대비 소폭 감소). 영업 적자 축소와 투자/재무 지출 최소화 전략이 유효하게 작동 중.
              </span>
            </li>
          </ul>
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
