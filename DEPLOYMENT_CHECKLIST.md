# 배포 체크리스트

- [ ] GitHub 비공개 저장소를 만들고 코드를 올렸다.
- [ ] `npx wrangler d1 create cell-size-lab-db`를 실행했다.
- [ ] D1의 `database_id`를 `wrangler.jsonc`에 입력했다.
- [ ] `npm run db:migrate:remote`로 제출용 표를 만들었다.
- [ ] `npm run secret:set`으로 교사 비밀번호를 설정했다.
- [ ] `npm run deploy` 후 학생용 주소가 열리는지 확인했다.
- [ ] `/teacher`에서 비밀번호 로그인과 CSV 다운로드를 확인했다.
- [ ] GitHub Actions용 Cloudflare Secret 두 개를 등록했다.
- [ ] 학생 개인정보 수집·보관·삭제 방침을 안내했다.
