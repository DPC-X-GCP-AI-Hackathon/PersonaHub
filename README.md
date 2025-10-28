<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎭 PersonaHub: AI 페르소나 시뮬레이터

**대화방마다 다른 '나'를 AI로 학습시켜, 상황에 맞는 자동 응답을 제공하는 혁신적인 메신저 도우미**

[![Google AI](https://img.shields.io/badge/Powered%20by-Gemini%202.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🌟 프로젝트 개요

현대인은 수십 개의 메신저 대화방에서 각기 다른 말투와 톤을 사용합니다:
- 👨‍💼 **회사 단톡**: 전문적이고 공손한 말투
- 👨‍👩‍👧‍👦 **가족 단톡**: 따뜻하고 존댓말 섞인 말투
- 👥 **친구 단톡**: 편한 반말, 이모티콘 많이 사용
- 💑 **연인 톡**: 애교 있고 다정한 말투

**PersonaHub**는 각 대화방별로 당신의 고유한 말투를 AI가 학습하여, 운전 중이거나 바쁠 때 자동으로 적절한 답변을 제안합니다.

---

## ✨ 주요 기능

### 1️⃣ **AI 토론 시뮬레이터** 🎭
- 다양한 페르소나를 생성하여 AI 간 토론 시뮬레이션
- **토론 모드**: 적대적(Adversarial) / 협력적(Collaborative)
- **토론 범위**: 엄격(Strict) / 확장(Expansive)
- 실시간 토론 요약 및 내보내기 (JSON/TXT)

### 2️⃣ **메신저 자동 응답 시스템** 💬
- **2-3개 샘플 메시지만 입력**하면 AI가 말투 학습
- 받은 메시지에 대해 **3가지 답변 옵션** 자동 생성:
  - ⚡ **빠른 답변**: 5-15자 (예: "ㅇㅋ", "넵!")
  - 💬 **일반 답변**: 1-2문장 (자연스러운 응답)
  - 📝 **상세 답변**: 2-4문장 (맥락 포함)
- **대화방별 맞춤 페르소나** 자동 전환
- 실시간 대화 히스토리 저장

### 3️⃣ **다국어 지원** 🌍
- 영어(English) / 한국어(Korean) 지원
- 자동 언어 감지 및 전환

---

## 🎯 핵심 차별화 포인트

| 기능 | 설명 | 경쟁 우위 |
|------|------|----------|
| **Few-shot Learning** | 2-3개 샘플만으로 말투 학습 | 기존 챗봇은 수백 개 데이터 필요 |
| **Context-Aware** | 대화 히스토리 기반 맥락 파악 | 단순 키워드 매칭 방식 극복 |
| **Multi-Persona** | 대화방별 페르소나 자동 전환 | 하나의 통합 봇만 제공하는 서비스와 차별화 |
| **실시간 학습** | 사용할수록 정확도 향상 | 정적 규칙 기반 시스템 대비 진화형 |

---

## 🛠️ 기술 스택

### Frontend
- **React 19.2** + **TypeScript 5.8**
- **Vite 6.2** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **i18next** (다국어 지원)

### Backend
- **Express 5.1** (REST API)
- **Node.js** (서버)
- **JSON 파일 기반 영속성** (data/personas.json, chatrooms.json)

### AI Engine
- **Google Gemini 2.5 Flash** API
- Few-shot learning for persona training
- Context-aware response generation

---

## 🚀 시작하기

### Prerequisites
- Node.js (v18 이상 권장)
- Gemini API Key ([발급받기](https://ai.google.dev/))

### Installation

```bash
# 1. 저장소 클론
git clone [repository-url]
cd PersonaHub

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일 생성 후 API 키 입력
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. 서버 실행 (터미널 1)
npm run server

# 5. 프론트엔드 실행 (터미널 2)
npm run dev

# 6. 브라우저에서 열기
# http://localhost:3000
```

---

## 📖 사용 가이드

### 메신저 자동 응답 사용법

1. **대화방 만들기**
   - "메신저 시뮬레이터" 탭 선택
   - "대화방 만들기" 클릭

2. **페르소나 학습 (2가지 방법)**

   **방법 1: AI가 내 말투 학습 ✨**
   ```
   대화방: "회사 팀 단톡"

   예시 메시지 입력:
   - "네, 확인했습니다. 오늘 중으로 처리하겠습니다."
   - "알겠습니다. 추가로 필요한 사항 있으시면 말씀해주세요."
   - "감사합니다. 검토 후 회신드리겠습니다."

   → AI가 자동으로 말투 분석 & 페르소나 생성
   ```

   **방법 2: 기존 페르소나 사용**
   - 이미 만든 페르소나 선택 (회사/친구/가족 스타일 등)

3. **메시지 시뮬레이션**
   - 대화방 선택 → 상대방 메시지 입력
   - AI가 3가지 답변 옵션 자동 생성
   - 원하는 답변 클릭하여 전송

### AI 토론 시뮬레이터 사용법

1. "토론의 장" 탭에서 페르소나 2개 이상 선택
2. 토론 주제 입력 (예: "AI 규제 필요성")
3. 토론 설정:
   - 턴 수: 1-5
   - 범위: 엄격/확장
   - 스타일: 적대적/협력적
4. "토론 시작" 클릭
5. 토론 종료 후 요약 & 내보내기 가능

---

## 🎬 데모 시나리오

### 시나리오 1: 회사 상사의 긴급 요청
```
📱 받은 메시지: "긴급! 내일 오전 회의 자료 준비 가능하신가요?"

🤖 AI 제안:
⚡ 빠른: "네, 가능합니다!"
💬 일반: "네, 확인했습니다. 내일 오전까지 준비하겠습니다."
📝 상세: "네, 확인했습니다. 오늘 저녁까지 초안 작성하고
         내일 오전 9시까지 최종본 전달드리겠습니다."
```

### 시나리오 2: 친구의 주말 약속
```
📱 받은 메시지: "이번 주말에 영화 볼래?"

🤖 AI 제안:
⚡ 빠른: "ㅇㅋㅇㅋ"
💬 일반: "좋아! 몇 시에 볼까?"
📝 상세: "오 좋아좋아 ㅋㅋ 토요일 저녁 어때?
         강남에서 보고 밥도 먹자~"
```

---

## 📂 프로젝트 구조

```
PersonaHub/
├── components/          # React 컴포넌트
│   ├── ChatRoomSimulator.tsx      # 메신저 시뮬레이터
│   ├── ChatRoomCreator.tsx        # 대화방 생성 모달
│   ├── DebateArena.tsx            # 토론 시뮬레이터
│   └── PersonaCreator.tsx         # 페르소나 생성 모달
├── services/
│   └── geminiService.ts           # Gemini AI 통합
├── locales/             # 다국어 번역
│   ├── en/translation.json
│   └── ko/translation.json
├── data/                # 데이터 저장 (gitignore)
│   ├── personas.json
│   └── chatrooms.json
├── server.cjs           # Express API 서버
├── App.tsx              # 메인 앱 (탭 네비게이션)
└── types.ts             # TypeScript 타입 정의
```

---

## 🎨 스크린샷

### 메신저 시뮬레이터
![Messenger Simulator](screenshot-messenger.png)

### AI 토론 시뮬레이터
![Debate Arena](screenshot-debate.png)

---

## 🔒 개인정보 보호

- ✅ **로컬 우선**: 모든 데이터는 로컬 파일 시스템에 저장
- ✅ **투명한 AI**: Gemini API 호출 내역 확인 가능
- ✅ **데이터 통제**: 언제든 데이터 삭제 및 내보내기 가능
- ✅ **No Cloud Storage**: 제3자 클라우드 서비스 사용 안 함

---

## 🤝 기여하기

이 프로젝트는 Google AI Hackathon을 위해 개발되었습니다.
기여는 환영합니다! Issue나 PR을 자유롭게 제출해주세요.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

## 🏆 공모전 정보

- **대회**: DPC x GCP AI Hackathon
- **주제**: Gemini API를 활용한 혁신적인 AI 솔루션
- **핵심 가치**: 실용성, 개인화, 프라이버시

---

## 📧 문의

질문이나 제안사항이 있으시면 언제든 연락주세요!

**View your app in AI Studio**: https://ai.studio/apps/drive/1yfr7s7NP4lLWyJlPSQOBVVmKX7dRlaRg

---

<div align="center">

**Made with ❤️ using Google Gemini**

[🌟 Star this project](https://github.com/your-repo) | [🐛 Report Bug](https://github.com/your-repo/issues) | [💡 Request Feature](https://github.com/your-repo/issues)

</div>
