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
  "STE 배당금 +$18,000K 26년 2월 예정,(영국 정부 STE 감자 승인 완료). 배당금 수령 후 F&F(OC)의 SPA 차입금 $18,000K 26년 2월 즉시 상환 예정",
  "26년 12월  잉여현금흐름 약 $7,000K으로  운영자금 명목 본사 차입금 $8,000K 추가 상환 예정. 26년 본사 차입금 총 상환액 $26,000K",
  "매출수금 +$5,816K (26년 EC 133% 성장)",
  "비용 효율화 $3,309K 달성 - 13.4% 비용 감소 성과",
  "운전자본 효율화 재고자산 59% 감소로 현금화 속도 개선",
  "물품대 지출 24% 절감 $1,459K 개선"
];

// 기본 주요 변동 내역 데이터
export interface ChangeItem {
  title: string;
  value: string;
  description?: string;
}

export const defaultChanges: ChangeItem[] = [
  {
    title: "STE 배당금",
    value: "STE 배당금 수취 ÷ $18,000K (2026년 2월 예정)",
    description: "영국 정부 STE 감자 승인완료",
  },
  {
    title: "26.12월 본사 차입금 상환",
    value: "SPA 차입금 $18,000K 상환, 운영자금 차입금 $8,000K 상환",
  },
  {
    title: "비용 효율화 성과",
    value: "3,309백만원 절감 (24,631 → 21,322)",
    description: "지급수수료 1,661백만원, 기타비용 1,572백만원 절감. 13.4% 비용 구조 개선",
  },
  {
    title: "본사 차입금 상환",
    value: "18,000백만원 (2026년 12월 예정)",
    description: "STE 배당금 수취 후 F&F(OC) 차입금 전액 상환. 재무구조 개선 완료 예정",
  },
];

export const INSIGHTS_KEY = 'dashboard:insights';
export const CHANGES_KEY = 'dashboard:changes';
