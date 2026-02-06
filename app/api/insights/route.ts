import { NextRequest, NextResponse } from 'next/server';
import { redis, defaultInsights, INSIGHTS_KEY } from '@/lib/upstash';

// GET: 인사이트 데이터 가져오기
export async function GET() {
  try {
    // Upstash KV에서 데이터 가져오기
    const insights = await redis.get<string[]>(INSIGHTS_KEY);
    
    // 데이터가 없으면 기본값 반환
    if (!insights) {
      return NextResponse.json({ insights: defaultInsights });
    }
    
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    // 에러 시 기본값 반환
    return NextResponse.json({ insights: defaultInsights });
  }
}

// POST: 인사이트 데이터 업데이트
export async function POST(request: NextRequest) {
  try {
    const { insights } = await request.json();
    
    // 유효성 검사
    if (!Array.isArray(insights)) {
      return NextResponse.json(
        { error: 'Invalid insights format' },
        { status: 400 }
      );
    }
    
    // Upstash KV에 저장
    await redis.set(INSIGHTS_KEY, insights);
    
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error('Error updating insights:', error);
    return NextResponse.json(
      { error: 'Failed to update insights' },
      { status: 500 }
    );
  }
}

