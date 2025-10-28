
import { GoogleGenAI } from "@google/genai";
import { Persona, DebateMessage } from '../types';

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


export async function runDebateTurn(topic: string, history: DebateMessage[], currentSpeaker: Persona, language: string, debateScope: string, argumentationStyle: string, isFinalTurn: boolean): Promise<string> {
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
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error running debate turn:", error);
    return "I am unable to continue the debate at this moment due to a system error.";
  }
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
