
export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  stance?: string;
}

export interface DebateMessage {
  personaId: string; // 'moderator' for system messages
  personaName: string;
  text: string;
  avatar: string;
}

// ChatRoom Types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'persona' | 'incoming'; // incoming = 다른 사람이 보낸 메시지
  text: string;
  timestamp: Date;
  isExample?: boolean; // 학습용 샘플 메시지인지
}

export interface ChatRoom {
  id: string;
  name: string; // "회사 단톡", "가족 톡방" 등
  description: string;
  personaId: string; // 이 대화방에서 사용할 페르소나
  messages: ChatMessage[];
  exampleConversations: ChatMessage[]; // 학습용 샘플 대화
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplyOption {
  id: string;
  text: string;
  tone: 'short' | 'normal' | 'detailed'; // 짧은/보통/상세
  confidence: number; // AI 신뢰도 0-1
}
