# 테트리스 게임

레벨 시스템이 있는 테트리스 게임입니다. Supabase로 점수를 저장하고 Vercel로 배포됩니다.

## 기능

- 클래식 테트리스 게임플레이
- 레벨 시스템 (10라인 클리어마다 레벨업)
- 레벨별 낙하 속도 증가
- Supabase 리더보드
- 반응형 디자인

## 조작법

- ← / → : 좌우 이동
- ↓ : 빠른 낙하
- ↑ / Space : 회전
- P : 일시정지

## 로컬 실행

```bash
npm install
npm run dev
```

## Supabase 설정

1. Supabase 프로젝트 생성
2. 다음 테이블 생성:

```sql
CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  lines INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scores_score ON scores(score DESC);
```

3. `index.html`에서 Supabase URL과 anon key 설정

## Vercel 배포

```bash
vercel
```

또는 GitHub 저장소를 Vercel에 연결하여 자동 배포
