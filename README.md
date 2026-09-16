# 현미경 세포 크기 측정 실험실

2022 개정 교육과정 생명과학 과목의 `세포의 연구 방법` 수업을 위한 웹 실험 앱입니다.

- 학생 화면: 로그인 없이 접속, 눈금 보정·표본 관찰·세포 크기 측정·최종 제출
- 교사 화면: 독립 관리자 비밀번호로 접속, 25점 자동 채점 결과 확인 및 CSV 다운로드
- 저장소: Cloudflare D1
- 배포: Cloudflare Workers, GitHub Actions
- ChatGPT/OpenAI 계정: 실행과 이용에 필요 없음

## 준비물

1. [GitHub 계정](https://github.com/)
2. [Cloudflare 계정](https://dash.cloudflare.com/sign-up)
3. 로컬 배포를 할 경우 Node.js 22와 Git

학생과 교사는 GitHub·Cloudflare 계정이 필요하지 않습니다. 사이트 주소만 있으면 학생 앱을 열 수 있고, 교사는 별도로 정한 관리자 비밀번호만 사용합니다.

## 가장 빠른 최초 배포

### 1. GitHub 저장소 만들기

이 압축 파일을 풀고 GitHub에서 새 저장소를 만든 뒤, 압축을 푼 폴더의 모든 파일을 올립니다. 저장소는 학생 개인정보 보호를 위해 `Private`로 만드는 것을 권장합니다.

Git을 사용할 수 있다면:

```bash
git init
git add .
git commit -m "Initial educational app"
git branch -M main
git remote add origin https://github.com/내아이디/저장소명.git
git push -u origin main
```

### 2. Cloudflare 로그인과 D1 데이터베이스 생성

압축을 푼 폴더에서 실행합니다.

```bash
npm ci
npx wrangler login
npx wrangler d1 create cell-size-lab-db
```

마지막 명령이 보여 주는 `database_id`를 복사하여 `wrangler.jsonc`의 `00000000-0000-4000-8000-000000000000`을 교체합니다.

### 3. 표와 교사 비밀번호 만들기

```bash
npm run db:migrate:remote
npm run secret:set
```

`secret:set` 실행 후 표시되는 입력란에 8자 이상의 관리자 비밀번호를 입력합니다. 이 비밀번호는 GitHub 코드에 저장되지 않습니다.

### 4. 첫 배포

```bash
npm run deploy
```

명령이 끝나면 `https://cell-size-beautyssam-lab.계정명.workers.dev` 형태의 주소가 표시됩니다.

- 학생용: 표시된 기본 주소
- 교사용: 기본 주소 뒤에 `/teacher`

## GitHub에 올릴 때마다 자동 배포하기

이 저장소에는 `.github/workflows/deploy.yml`이 포함되어 있습니다. GitHub 저장소의 **Settings → Secrets and variables → Actions**에서 아래 두 개를 등록하면 `main` 브랜치에 코드를 올릴 때마다 자동 배포됩니다.

| GitHub Secret | 값 |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 대시보드의 Account ID |
| `CLOUDFLARE_API_TOKEN` | Workers Scripts 편집, D1 편집 권한이 있는 API Token |

Cloudflare 대시보드의 **My Profile → API Tokens → Create Token**에서 토큰을 만들 수 있습니다. 관리자 비밀번호 `ADMIN_PASSWORD`는 GitHub Secret이 아니라 `npm run secret:set`으로 Worker에 한 번 설정합니다.

## 로컬에서 확인하기

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

로컬 교사 비밀번호는 `local-teacher-password`입니다. 이는 로컬 테스트에만 사용되며 실제 배포 비밀번호와 무관합니다.

## 운영 시 주의사항

- 학생 화면에는 정답과 점수가 표시되지 않습니다.
- 교사용 CSV에는 학번, 이름, 측정값, 항목별 점수와 총점이 포함됩니다.
- 동일 학번은 한 번만 최종 제출할 수 있습니다.
- 학생 이름과 학번은 개인정보이므로 학교의 개인정보 처리 기준에 따라 수집 안내, 보관 기간, 삭제 절차를 정하세요.
- 교사 비밀번호는 12자 이상의 고유한 비밀번호를 권장하며 학생에게 공유하지 마세요.
- 정기적으로 교사용 화면에서 CSV를 내려받아 백업하세요.

## 비밀번호 변경

```bash
npm run secret:set
```

새 비밀번호를 입력하면 즉시 교체됩니다.

## 데이터 초기화

학생 제출 기록을 지우는 작업은 되돌릴 수 없습니다. Cloudflare D1 대시보드에서 먼저 백업한 뒤 필요한 경우에만 진행하세요.

## 주요 코드 위치

| 경로 | 역할 |
|---|---|
| `app/page.tsx` | 학생용 실험 화면 |
| `app/teacher/page.tsx` | 교사용 로그인·결과 화면 |
| `app/api/submissions/route.ts` | 학생 결과 저장 API |
| `app/api/submissions/admin/route.ts` | 교사용 결과 조회 API |
| `app/api/submissions/export/route.ts` | CSV 내보내기 API |
| `lib/scoring.ts` | 25점 자동 채점 기준 |
| `lib/teacher-auth.ts` | 관리자 비밀번호 확인 |
| `drizzle/0000_familiar_starbolt.sql` | 데이터베이스 표 생성 |
| `wrangler.jsonc` | Cloudflare 배포 설정 |

## 라이선스

MIT 라이선스로 자유롭게 수정·배포할 수 있습니다. 외부 라이브러리는 각각의 라이선스를 따릅니다.
