import { NextRequest, NextResponse } from 'next/server';
import { redis, defaultChanges, CHANGES_KEY, ChangeItem, isRedisAvailable } from '@/lib/upstash';

// GET: 주요 변동 내역 데이터 가져오기
export async function GET() {
  try {
    // Redis가 사용 가능한지 확인
    if (!isRedisAvailable() || !redis) {
      console.log('Redis not available, using localStorage fallback');
      return NextResponse.json({ 
        changes: defaultChanges,
        useLocalStorage: true,
        message: 'Upstash Redis not configured. Data will be stored in browser only.'
      });
    }
    
    // Upstash KV에서 데이터 가져오기
    const changes = await redis.get<ChangeItem[]>(CHANGES_KEY);
    
    // 데이터가 없으면 기본값 반환
    if (!changes) {
      return NextResponse.json({ changes: defaultChanges });
    }
    
    return NextResponse.json({ changes });
  } catch (error) {
    console.error('Error fetching changes:', error);
    // 에러 시 기본값 반환
    return NextResponse.json({ 
      changes: defaultChanges,
      useLocalStorage: true,
      error: String(error)
    });
  }
}

// POST: 주요 변동 내역 데이터 업데이트
export async function POST(request: NextRequest) {
  try {
    const { changes } = await request.json();
    
    // 유효성 검사
    if (!Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Invalid changes format' },
        { status: 400 }
      );
    }
    
    // Redis가 사용 가능한지 확인
    if (!isRedisAvailable() || !redis) {
      console.log('Redis not available, returning localStorage flag');
      return NextResponse.json({ 
        success: true, 
        changes,
        useLocalStorage: true,
        message: 'Saved to browser only. Set up Upstash Redis for persistent storage.'
      });
    }
    
    // Upstash KV에 저장
    await redis.set(CHANGES_KEY, changes);
    
    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error('Error updating changes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update changes',
        details: String(error),
        useLocalStorage: true
      },
      { status: 500 }
    );
  }
}
