import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
let redis: Redis | null = null;

try {
  // Vercel KV는 KV_REST_API_URL과 KV_REST_API_TOKEN을 사용
  // Upstash 직접 연결은 UPSTASH_REDIS_REST_URL과 UPSTASH_REDIS_REST_TOKEN 사용
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (error) {
  console.error('Failed to initialize Upstash Redis:', error);
}

export { redis };

// Redis가 연결되어 있는지 확인
export const isRedisAvailable = () => {
  return redis !== null && 
         (
           (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
           (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
         );
};

// 기본 인사이트 데이터
export const defaultInsights = [
  "STE배당금 2026년 11월 수취 예정, 2026년 12월 본사 차입금 상환 예정 (현재 영국 정부의 STE감자 승인 절차 진행중으로, 감자 승인 완료될시 즉시 배당 후 본사 차입금 상환 예정)",
  "영업활동 현금흐름은 **-30**으로 여전히 음수이나, 전년(**-5,265**) 대비 **+5,236** 대폭 개선됨. 적자 폭이 크게 축소되며 현금흐름 건전성 회복 신호.",
  "당기순이익은 **-1,814**이나 전년 대비 **+6,245** 증가하여 수익성 지표가 뚜렷하게 개선되는 추세.",
  "투자활동 지출은 2026년 0으로 최소화됨. 전년도 대규모 지출(-19,159) 이후 숨 고르기 단계로, 현금 유출 통제 중.",
  "재무활동은 **-276**으로 전환(전년 +28,422). 대규모 차입 없이 리스부채 상환 등 필수적인 재무 지출만 발생하며 부채 의존도 낮춤.",
  "기말잔액은 **7,257**로 안정적인 수준 유지(전년 7,563 대비 소폭 감소). 영업 적자 축소와 투자/재무 지출 최소화 전략이 유효하게 작동 중."
];

// 기본 주요 변동 내역 데이터
export interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

export const defaultChanges: ChangeItem[] = [
  {
    title: "영업활동",
    value: "연간 -30 **(전년 대비 +5,236 개선)**",
  },
  {
    title: "재고자산의 변동",
    value: "연간 2,438 **(전년 -1,619 대비 +4,056)**",
    description: "재고 효율화가 현금흐름 개선의 주요 요인으로 작용",
  },
  {
    title: "기타영업 자산부채의 변동",
    value: "연간 -400 **(전년 +3,581 대비 -3,981)**",
  },
  {
    title: "STE 배당금",
    value: "연간 18,000 **(2026년 11월 및 12월 수취)**",
    description: "STE 감자 승인 후 배당금 수취",
  },
  {
    title: "차입금의 변동(본사 차입금)",
    value: "연간 -46,715",
    description: "26년 12월 F&F(OC) 차입금 18,000 상환예정",
  },
];

export const INSIGHTS_KEY = 'dashboard:insights';
export const CHANGES_KEY = 'dashboard:changes';
