import { NextRequest, NextResponse } from 'next/server';
import { redis, defaultChanges, CHANGES_KEY, ChangeItem } from '@/lib/upstash';

// GET: 주요 변동 내역 데이터 가져오기
export async function GET() {
  try {
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
    return NextResponse.json({ changes: defaultChanges });
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
    
    // Upstash KV에 저장
    await redis.set(CHANGES_KEY, changes);
    
    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error('Error updating changes:', error);
    return NextResponse.json(
      { error: 'Failed to update changes' },
      { status: 500 }
    );
  }
}

