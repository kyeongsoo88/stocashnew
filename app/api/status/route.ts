import { NextResponse } from 'next/server';

// 환경 변수 상태 확인 API
export async function GET() {
  const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  
  return NextResponse.json({
    upstashConfigured: hasUrl && hasToken,
    hasUrl,
    hasToken,
    urlPreview: hasUrl ? process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + '...' : 'Not set',
    tokenPreview: hasToken ? '***' + process.env.UPSTASH_REDIS_REST_TOKEN?.substring(process.env.UPSTASH_REDIS_REST_TOKEN.length - 4) : 'Not set',
    nodeEnv: process.env.NODE_ENV,
  });
}

