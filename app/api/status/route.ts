import { NextResponse } from 'next/server';

// 환경 변수 상태 확인 API
export async function GET() {
  // Vercel KV 환경 변수
  const hasKvUrl = !!process.env.KV_REST_API_URL;
  const hasKvToken = !!process.env.KV_REST_API_TOKEN;
  
  // Upstash 직접 연결 환경 변수
  const hasUpstashUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasUpstashToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  
  const upstashConfigured = (hasKvUrl && hasKvToken) || (hasUpstashUrl && hasUpstashToken);
  
  return NextResponse.json({
    upstashConfigured,
    vercelKV: {
      hasUrl: hasKvUrl,
      hasToken: hasKvToken,
      urlPreview: hasKvUrl ? process.env.KV_REST_API_URL?.substring(0, 30) + '...' : 'Not set',
      tokenPreview: hasKvToken ? '***' + process.env.KV_REST_API_TOKEN?.substring(process.env.KV_REST_API_TOKEN.length - 4) : 'Not set',
    },
    upstashDirect: {
      hasUrl: hasUpstashUrl,
      hasToken: hasUpstashToken,
      urlPreview: hasUpstashUrl ? process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + '...' : 'Not set',
      tokenPreview: hasUpstashToken ? '***' + process.env.UPSTASH_REDIS_REST_TOKEN?.substring(process.env.UPSTASH_REDIS_REST_TOKEN.length - 4) : 'Not set',
    },
    nodeEnv: process.env.NODE_ENV,
  });
}
