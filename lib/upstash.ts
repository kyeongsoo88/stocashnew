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
  "26년 영업흐름 +687M 창출하여 차입금 △729M 상환, 기말 차입금 180M 수준으로 재무건전성 회복 계획",
  "영업 현금흐름 개선의 가장 큰 요인은, 목표 재고수준 달성을 위한 보수적 생산계획 운영 (MLB 이니셜 의류 60억, ACC 36억)\n→ 판매상황에 따라 유동적으로 생산 계획 추가 반영",
  "26년말 운전자본 1,155M (전년비 △314M) 감축운영 계획\n→ SH 창고보유분 출고/판매로 재고원가 582M 감소, 여신회수 182M 및 본사채무 연체분 200M 상환으로 정상화",
  "기말 대리상 채권 491M으로 24년 기말 수준 회복"
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
