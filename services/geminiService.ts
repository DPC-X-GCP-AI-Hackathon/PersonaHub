
import { Persona, DebateMessage, ChatMessage, ReplyOption } from '../types';

// Base API URL - proxied through backend to keep API key secure
const API_BASE = '/api/gemini';

export async function createPersonaPrompt(description: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/create-persona-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.systemPrompt;
  } catch (error) {
    console.error("Error creating persona prompt:", error);
    return "Error: Could not generate a persona prompt. Please try again.";
  }
}

export async function generateDebateStance(systemPrompt: string, topic: string, language: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/generate-debate-stance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, topic, language })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.stance;
  } catch (error) {
    console.error("Error generating debate stance:", error);
    return "I am unable to form an opinion on this topic.";
  }
}


export async function runLiveDebateTurn(topic: string, history: DebateMessage[], currentSpeaker: Persona, language: string, debateScope: string, argumentationStyle: string, isFinalTurn: boolean, isAudioEnabled: boolean): Promise<{text: string, audio: Blob}> {
  try {
    const response = await fetch(`${API_BASE}/run-debate-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        history,
        currentSpeaker,
        language,
        debateScope,
        argumentationStyle,
        isFinalTurn,
        isAudioEnabled
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Convert audio if available
    if (data.audioParts && data.audioParts.length > 0 && data.mimeType) {
      const audio = convertToWav(data.audioParts, data.mimeType);
      return { text: data.text, audio };
    }

    return { text: data.text, audio: new Blob() };
  } catch (error) {
    console.error("Error running debate turn:", error);
    return { text: "I am unable to continue the debate at this moment due to a system error.", audio: new Blob() };
  }
}

function convertToWav(rawData: string[], mimeType: string): Blob {
  const options = parseMimeType(mimeType);
  const data = rawData.join('');
  const byteString = atob(data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }
  const dataView = new DataView(createWavHeader(int8Array.length, options));
  return new Blob([dataView, int8Array], { type: 'audio/wav' });
}

interface WavConversionOptions {
  numChannels : number,
  sampleRate: number,
  bitsPerSample: number
}

function parseMimeType(mimeType : string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [, format] = (fileType || '').split('/');

  const options : Partial<WavConversionOptions> = {
    numChannels: 1,
    bitsPerSample: 16,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate' && value) {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): ArrayBuffer {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');                      // ChunkID
  view.setUint32(4, 36 + dataLength, true);     // ChunkSize
  writeString(view, 8, 'WAVE');                      // Format
  writeString(view, 12, 'fmt ');                     // Subchunk1ID
  view.setUint32(16, 16, true);                 // Subchunk1Size (PCM)
  view.setUint16(20, 1, true);                  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);        // NumChannels
  view.setUint32(24, sampleRate, true);         // SampleRate
  view.setUint32(28, byteRate, true);           // ByteRate
  view.setUint16(32, blockAlign, true);         // BlockAlign
  view.setUint16(34, bitsPerSample, true);      // BitsPerSample
  writeString(view, 36, 'data');                     // Subchunk2ID
  view.setUint32(40, dataLength, true);         // Subchunk2Size

  return buffer;
}

export async function summarizeDebate(topic: string, history: DebateMessage[], language: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/summarize-debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, history, language })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error summarizing debate:", error);
    return "Error: Could not generate a summary.";
  }
}

// ===== ChatRoom Functions =====

/**
 * 샘플 대화로부터 페르소나의 말투를 학습
 */
export async function learnPersonaFromConversation(
  exampleMessages: ChatMessage[],
  chatRoomContext: string,
  language: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/learn-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exampleMessages, chatRoomContext, language })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.systemPrompt;
  } catch (error) {
    console.error("Error learning persona from conversation:", error);
    return "Error: Could not learn persona style. Please try again.";
  }
}

/**
 * 받은 메시지에 대한 자동 응답 옵션 생성 (짧은/보통/상세)
 */
export async function generateReplyOptions(
  incomingMessage: string,
  conversationHistory: ChatMessage[],
  persona: Persona,
  language: string
): Promise<ReplyOption[]> {
  try {
    const response = await fetch(`${API_BASE}/generate-reply-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incomingMessage,
        conversationHistory,
        persona,
        language
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.replyOptions;
  } catch (error) {
    console.error("Error generating reply options:", error);
    // 기본 응답 반환
    return [
      {
        id: '1',
        text: language === 'ko' ? '응' : 'ok',
        tone: 'short',
        confidence: 0.5
      },
      {
        id: '2',
        text: language === 'ko' ? '알겠어, 확인했어' : 'Got it, thanks',
        tone: 'normal',
        confidence: 0.5
      },
      {
        id: '3',
        text: language === 'ko' ? '알겠어! 확인했고 나중에 자세히 답변할게' : 'Got it! I saw your message and will get back to you with more details later',
        tone: 'detailed',
        confidence: 0.5
      }
    ];
  }
}
