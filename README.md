# kkyare_hackathon

Ambition for Korea Claude 해커톤 **꺄레** 팀 레포입니다.

- 트랙: 미국 RL Eval·데이터 회사가 돈 내고 쓸 서비스 (AttentionX)
- 주제: 더욱 정확한 기상 데이터를 가공하여 농업 생산성 증가에 기여하는 서비스
- 타깃: 미국의 기업농 혹은 대형농장

## 문서

- [리서치 및 제품 초안 (FieldBench)](docs/research_yujin.md)
- [SprayWindow 리서치](docs/research_sungho/): 경쟁사, 고객, 데이터·기술, Why now, 서비스 정의, 문제 근거, 사업 계획, dispatcher 검증
  - 시작점: [00 종합](docs/research_sungho/00_summary.md) · [05 서비스 정의서](docs/research_sungho/05_service_spec.md) · [07 사업 계획](docs/research_sungho/07_business_plan.md)

## 실행

```bash
corepack enable          # pnpm 10.33.0
pnpm install
cp .env.example .env.local   # ANTHROPIC_API_KEY (없어도 데모는 저장 응답·템플릿으로 동작)
pnpm dev                 # http://localhost:3000
pnpm test                # vitest
```

## Credits

사용한 오픈소스와 데이터의 출처를 여기에 적습니다. 일반 라이브러리 외에, 오늘 만든 코드가 아닌 것만 적습니다.

### 화면·디자인 (유진)
- 디자인 원칙: [anthropics/skills `frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache 2.0). 가이드만 따랐고 코드는 가져오지 않았다.
- 글꼴: [Public Sans](https://fonts.google.com/specimen/Public+Sans), [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) (SIL Open Font License, Google Fonts)
- 프레임워크·라이브러리: Next.js, React, Tailwind CSS, Recharts, Motion, Zod, Anthropic TypeScript SDK

### 데이터
- 데모의 필지·날씨·청구·생산량은 모두 목업이다. 형식은 Open-Meteo, Iowa Environmental Mesonet ASOS, NOAA CPC, USDA RMA 공개 자료 구조를 참고했다.
