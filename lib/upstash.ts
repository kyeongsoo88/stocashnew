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
  "기말잔액은 **7,142**에서 **4,012**로 감소(**-3,130**). STE 배당금 수취(**+18,000**)와 본사 차입금 상환(**-18,000**)이 주요 변동 요인이며, 전반적인 현금 관리는 안정적 수준 유지.",
  "비용은 **-24,631**에서 **-21,173**으로 **+3,458** 개선. 특히 지급수수료가 **+2,956** 대폭 절감되며 비용 효율화 성과가 두드러짐.",
  "매출수금은 **23,264**에서 **22,594**로 **-669** 소폭 감소. 온라인(US+EU) 채널은 **+138** 성장했으나, 라이선스 매출이 **-600** 급감하며 전체 수금액에 영향.",
  "운전자본은 **534**에서 **-1,691**로 **-2,225** 악화. 재고자산 감소(**-2,438**)로 현금흐름은 개선되었으나, 전반적인 운전자본 관리에 주의 필요.",
  "물품대 지출이 **-6,011**에서 **-4,552**로 **+1,459** 개선. 광고선전비는 **-922** 증가했으나, 전체 비용 구조는 긍정적 방향으로 개선 중."
];

// 기본 주요 변동 내역 데이터
export interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

export const defaultChanges: ChangeItem[] = [
  {
    title: "매출수금",
    value: "연간 22,594 **(전년 23,264 대비 -669)**",
    description: "온라인 채널 +138 성장, 라이선스 -600 감소가 주요 변동 요인",
  },
  {
    title: "STE 배당금",
    value: "연간 18,000 **(2026년 11월 수취 예정)**",
    description: "영국 정부 STE 감자 승인 후 배당금 수취",
  },
  {
    title: "비용",
    value: "연간 -21,173 **(전년 -24,631 대비 +3,458 개선)**",
    description: "지급수수료 +2,956 절감이 주요 개선 요인",
  },
  {
    title: "본사 차입금 상환",
    value: "연간 -18,000 **(2026년 12월 상환 예정)**",
    description: "F&F(OC) 차입금 18,000 상환 예정",
  },
  {
    title: "재고자산 변동",
    value: "4,942 → 2,504 **(전년 대비 -2,438)**",
    description: "재고 감축으로 현금흐름 개선 효과",
  },
];

export const INSIGHTS_KEY = 'dashboard:insights';
export const CHANGES_KEY = 'dashboard:changes';
