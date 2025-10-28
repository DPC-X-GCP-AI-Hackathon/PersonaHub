
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
