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
  "**STE 배당금 18,000백만원 수취 예정** (2026년 11월): 영국 정부의 STE 감자 승인 절차가 진행 중이며, 승인 완료 즉시 배당금 수취 후 본사 차입금 전액 상환(18,000백만원) 계획. 이는 재무구조 개선의 핵심 포인트.",
  "**비용 효율화 3,309백만원 달성**: 비용지출이 24,631백만원에서 21,322백만원으로 **13.4% 감소**. 특히 지급수수료 1,661백만원 절감과 기타비용 1,572백만원 감소가 주요 성과. 인건비는 274백만원 증가했으나 전체적으로 비용 구조 개선.",
  "**현금잔액 안정적 관리**: 기말잔액이 7,142백만원에서 4,488백만원으로 감소했으나, 이는 STE 지분 매입(25년)과 본사 차입금 상환(26년) 등 전략적 자금 운용의 결과. 영업 활동 기반 현금 창출력은 견조한 수준 유지.",
  "**매출수금 구조 변화**: 전체 매출수금은 23,264백만원에서 23,220백만원으로 소폭 감소(-44백만원). 하지만 온라인(US+EU) 채널이 798백만원 성장(20,643→21,441)하며 주요 성장 동력으로 부상. 라이선스 매출 감소(-599백만원)는 일회성 요인으로 판단.",
  "**운전자본 효율화 진행 중**: 재고자산이 4,942백만원에서 2,504백만원으로 **49% 감소**하며 현금화 속도 개선. 운전자본은 534백만원에서 -1,691백만원으로 변동했으나, 이는 재고 최적화 정책의 결과로 긍정적 평가.",
  "**물품대 지출 1,459백만원 절감**: 6,011백만원에서 4,552백만원으로 **24% 감소**. 광고선전비는 197백만원 증가했으나, 전반적인 지출 관리는 효과적으로 운영되고 있음."
];

// 기본 주요 변동 내역 데이터
export interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

export const defaultChanges: ChangeItem[] = [
  {
    title: "STE 배당금 수취",
    value: "18,000백만원 (2026년 11월 예정)",
    description: "영국 정부 STE 감자 승인 후 배당금 수취. 승인 완료 즉시 본사 차입금 전액 상환 진행",
  },
  {
    title: "비용 효율화 성과",
    value: "3,309백만원 절감 (24,631 → 21,322)",
    description: "지급수수료 1,661백만원, 기타비용 1,572백만원 절감. 13.4% 비용 구조 개선",
  },
  {
    title: "온라인 채널 성장",
    value: "798백만원 증가 (20,643 → 21,441)",
    description: "온라인(US+EU) 매출 지속 성장. 전체 매출수금의 92% 차지하며 핵심 채널로 확립",
  },
  {
    title: "재고자산 효율화",
    value: "2,438백만원 감소 (4,942 → 2,504)",
    description: "49% 재고 감축으로 현금화 속도 개선. 운전자본 최적화 정책 성과",
  },
  {
    title: "본사 차입금 상환",
    value: "18,000백만원 (2026년 12월 예정)",
    description: "STE 배당금 수취 후 F&F(OC) 차입금 전액 상환. 재무구조 개선 완료 예정",
  },
  {
    title: "물품대 지출 절감",
    value: "1,459백만원 개선 (-6,011 → -4,552)",
    description: "24% 지출 감소. 구매 및 재고 관리 효율화 성과",
  },
];

export const INSIGHTS_KEY = 'dashboard:insights';
export const CHANGES_KEY = 'dashboard:changes';
