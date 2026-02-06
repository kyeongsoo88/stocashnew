# Upstash KV 연동 설정 가이드

## 1. Vercel에서 Upstash KV 연결

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Storage** 탭으로 이동
4. **Connect Database** 클릭
5. **Upstash Redis** 선택
6. `upstash-kv-orange-river` 선택하거나 새로 생성

## 2. 환경 변수 자동 설정

Vercel에서 Upstash를 연결하면 다음 환경 변수가 자동으로 설정됩니다:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3. 기능 사용 방법

### 대시보드에서 인사이트 편집

1. 대시보드 우측 "2026년 현금흐름 분석" 섹션에서 **"편집"** 버튼 클릭
2. 인사이트 항목을 수정하거나 추가/삭제
3. **"저장"** 버튼 클릭하여 Upstash KV에 저장
4. 저장된 데이터는 모든 사용자에게 실시간으로 반영됩니다

### 마크다운 스타일 지원

텍스트에 `**내용**` 형식을 사용하면 볼드체로 표시됩니다:
- `**-30**` → 빨간색 볼드체 (음수)
- `**+5,236**` → 파란색 볼드체 (양수)
- `**7,257**` → 검정색 볼드체 (일반)

## 4. API 엔드포인트

### GET /api/insights
현재 저장된 인사이트 데이터를 가져옵니다.

### POST /api/insights
새로운 인사이트 데이터를 저장합니다.

```json
{
  "insights": [
    "첫 번째 인사이트",
    "두 번째 인사이트"
  ]
}
```

## 5. 로컬 개발 환경 설정

로컬에서 테스트하려면 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

Vercel Dashboard > Storage > upstash-kv-orange-river에서 값을 복사하세요.

