
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality } from "@google/genai";
import { Persona, DebateMessage, ChatMessage, ReplyOption } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function createPersonaPrompt(description: string): Promise<string> {
  const prompt = `
    Analyze the following persona description and generate a detailed system prompt for an AI that will emulate this persona.
    The system prompt should be a comprehensive guide for the AI's behavior, voice, and personality.

    Persona Description: "${description}"

    Generate a system prompt that includes:
    - Tone and Style (e.g., formal, witty, sarcastic, empathetic)
    - Core Beliefs and Values
    - Areas of Expertise and Interest
    - Common Phrases or Vocabulary
    - Structural quirks in language (e.g., short sentences, complex analogies)
    - Overall mission or goal when interacting.

    The output should be ONLY the system prompt text, ready to be used to instruct an LLM. Do not include any other explanatory text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error creating persona prompt:", error);
    return "Error: Could not generate a persona prompt. Please try again.";
  }
}

export async function generateDebateStance(systemPrompt: string, topic: string, language: string): Promise<string> {
  const prompt = `
    Based on the following persona, defined by a system prompt, and the debate topic, generate a concise stance (a short sentence) that this persona would take.

    Persona System Prompt:
    ---
    ${systemPrompt}
    ---

    Debate Topic: "${topic}"

    The stance should be a clear and direct opinion on the topic. For example, "I believe technology is the only way to solve this problem," or "I am strongly against this proposal."

    The stance must be in ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating debate stance:", error);
    return "I am unable to form an opinion on this topic.";
  }
}


export async function runLiveDebateTurn(topic: string, history: DebateMessage[], currentSpeaker: Persona, language: string, debateScope: string, argumentationStyle: string, isFinalTurn: boolean, isAudioEnabled: boolean): Promise<{text: string, audio: Blob}> {
  const conversationHistory = history.map(msg => `${msg.personaName}: ${msg.text}`).join('\n');

  let scopeInstruction = '';
  let styleInstruction = '';
  let finalTurnInstruction = '';

  if (language === 'ko') {
    scopeInstruction = debateScope === 'Strict'
      ? '응답은 토론 주제와 엄격하게 관련되어야 합니다.'
      : '주제와 관련된 파생적인 논의나 더 넓은 의미에 대한 토론을 권장합니다.';
    styleInstruction = argumentationStyle === 'Adversarial'
      ? '자신의 입장을 고수하며 토론을 이끌어가세요.'
      : '다른 참여자와 합의점을 찾거나 종합적인 결론을 도출하는 것을 목표로 하세요. 다른 사람의 좋은 의견을 인정하고 중간 지점을 찾으려고 노력하세요.';
    if (argumentationStyle === 'Collaborative' && isFinalTurn) {
      finalTurnInstruction = '이제 마지막 턴입니다. 자신의 현재 입장을 요약하고, 다른 참여자의 가장 강력한 주장을 인정한 다음, 토론에서 나온 최상의 아이디어를 통합하여 종합적인 결론이나 합의문을 제안하세요.';
    }
  } else {
    scopeInstruction = debateScope === 'Strict'
      ? 'Your response must be strictly related to the debate topic.'
      : 'You are encouraged to discuss related tangents and broader implications of the topic.';
    styleInstruction = argumentationStyle === 'Adversarial'
      ? 'Your goal is to win the debate by making the strongest case for your stance.'
      : 'Your goal is to find a consensus or a synthesized conclusion with the other participants. Acknowledge good points from others and try to find a middle ground.';
    if (argumentationStyle === 'Collaborative' && isFinalTurn) {
      finalTurnInstruction = 'This is the final turn. Summarize your current position, acknowledge the strongest points from the other participants, and propose a synthesized conclusion or a statement of consensus that incorporates the best ideas from the debate.';
    }
  }
  
  const prompt = `
    Your persona is defined by the following system prompt:
    ---
    ${currentSpeaker.systemPrompt}
    ---

    You are participating in a debate on the following topic: "${topic}".

    Your specific stance on this topic is: "${currentSpeaker.stance}"

    You must argue consistently with this stance throughout the debate.

    ${styleInstruction}

    ${finalTurnInstruction}

    Instead of questioning the topic's value, focus on building a strong argument for your stance and driving the debate toward a conclusion.
    
    Here is the debate history so far:
    ---
    ${conversationHistory}
    ---

    Based on your persona and your assigned stance, provide your next statement in the debate. Address the previous points if applicable and advance your own arguments. Your response should be concise and impactful. ${scopeInstruction} Your response must be in ${language}.
  `;

  if (isAudioEnabled) {
    const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025'

    const config = {
      responseModalities: [
          Modality.AUDIO,
          Modality.TEXT,
      ],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',
          }
        }
      },
      contextWindowCompression: {
          triggerTokens: '25600',
          slidingWindow: { targetTokens: '12800' },
      },
    };

    const responseQueue: LiveServerMessage[] = [];

    const session = await ai.live.connect({
      model,
      callbacks: {
        onmessage: function (message: LiveServerMessage) {
          responseQueue.push(message);
        },
      },
      config
    });

    session.sendClientContent({
      turns: [
        { text: prompt }
      ]
    });

    let text = '';
    const audioParts: string[] = [];
    let mimeType = '';

    let done = false;
    while (!done) {
      const message = responseQueue.shift();
      if (message) {
        if(message.serverContent?.modelTurn?.parts) {
          const part = message.serverContent?.modelTurn?.parts?.[0];
          if (part?.text) {
            text += part.text;
          }
          if (part?.inlineData) {
            audioParts.push(part.inlineData.data ?? '');
            mimeType = part.inlineData.mimeType ?? '';
          }
        }
        if (message.serverContent && message.serverContent.turnComplete) {
          done = true;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    session.close();

    const audio = convertToWav(audioParts, mimeType);

    return { text, audio };
  } else {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });
      return { text: response.text.trim(), audio: new Blob() };
    } catch (error) {
      console.error("Error running debate turn:", error);
      return { text: "I am unable to continue the debate at this moment due to a system error.", audio: new Blob() };
    }
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
  const [_, format] = fileType.split('/');

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
    if (key === 'rate') {
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
  const conversationHistory = history.map(msg => `${msg.personaName}: ${msg.text}`).join('\n');

  const prompt = `
    Analyze the following debate on the topic "${topic}".

    Debate Transcript:
    ---
    ${conversationHistory}
    ---

    Provide a concise summary of the debate. Identify the key arguments from each participant, points of contention, and any potential consensus or conclusion. The summary should be neutral and objective. The summary must be in ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text.trim();
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
  const examples = exampleMessages
    .filter(msg => msg.sender === 'user')
    .map(msg => msg.text)
    .join('\n');

  const prompt = `
    You are analyzing a user's messaging style from their past messages in a specific chat room context.

    Chat Room Context: "${chatRoomContext}"

    Example messages from the user:
    ---
    ${examples}
    ---

    Based on these messages, generate a detailed persona system prompt that captures:
    1. **Tone and Formality**: Is it casual, formal, professional, or friendly?
    2. **Language Patterns**: Do they use short sentences, long explanations, slang, or emojis?
    3. **Typical Responses**: How do they usually respond to questions, invitations, or requests?
    4. **Emotional Expression**: Are they warm, reserved, enthusiastic, or neutral?
    5. **Context Awareness**: How does this person adapt their responses based on the chat room context (family, work, friends)?

    The output should be a system prompt that will guide an AI to respond EXACTLY like this user would in this chat room.
    The response must be in ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text.trim();
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
  const historyText = conversationHistory
    .slice(-10) // 최근 10개만
    .map(msg => {
      const sender = msg.sender === 'user' ? 'Me' : msg.sender === 'incoming' ? 'Them' : 'AI';
      return `${sender}: ${msg.text}`;
    })
    .join('\n');

  const prompt = `
    You are acting as a user's personal messaging assistant, trained to respond EXACTLY like they would.

    Your Persona (how the user typically writes):
    ---
    ${persona.systemPrompt}
    ---

    Recent Conversation History:
    ---
    ${historyText}
    ---

    New Incoming Message:
    "${incomingMessage}"

    Generate THREE different reply options that the user might send:
    1. **SHORT**: A very brief, quick response (5-15 characters, maybe just emoji or "ok", "ㅋㅋ", etc.)
    2. **NORMAL**: A natural, typical response (1-2 sentences)
    3. **DETAILED**: A longer, more thoughtful response (2-4 sentences with more context)

    IMPORTANT:
    - Match the user's typical tone, formality, and emoji usage
    - Consider the conversation context
    - Make responses feel natural and authentic to how this user writes
    - Response must be in ${language}

    Format your response as JSON:
    {
      "short": "reply text here",
      "normal": "reply text here",
      "detailed": "reply text here"
    }

    Only output valid JSON, nothing else.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });

    const jsonText = response.text.trim();
    // JSON 파싱 시도
    const parsed = JSON.parse(jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    return [
      {
        id: '1',
        text: parsed.short || '',
        tone: 'short',
        confidence: 0.9
      },
      {
        id: '2',
        text: parsed.normal || '',
        tone: 'normal',
        confidence: 0.95
      },
      {
        id: '3',
        text: parsed.detailed || '',
        tone: 'detailed',
        confidence: 0.85
      }
    ];
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
