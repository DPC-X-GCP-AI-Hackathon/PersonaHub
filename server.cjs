
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const llmProvider = require('./server/llm-providers/index.cjs');

// Load environment variables (support .env.local for API key)
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = 3002;
const PERSONAS_FILE = path.join(__dirname, 'data', 'personas.json');
const CHATROOMS_FILE = path.join(__dirname, 'data', 'chatrooms.json');

// Initialize LLM Provider Manager
console.log('🤖 Initializing LLM providers...');
llmProvider.initialize({
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  ollama: {
    enabled: process.env.OLLAMA_ENABLED !== 'false',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'gemini'
});

// Security middleware
app.use(helmet());

// CORS configuration with allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request size limits
app.use(bodyParser.json({ limit: '1mb' }));

// Validation schemas
const personaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  systemPrompt: z.string().min(1).max(5000),
  avatar: z.string().url().optional(),
  stance: z.string().optional()
});

const chatRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  personaId: z.string().optional(),
  messages: z.array(z.any()).optional(),
  exampleConversations: z.array(z.any()).optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};

// Default personas to use if no data file exists
const DEFAULT_PERSONAS = [
  {
    id: '1',
    name: 'Dr. Evelyn Reed',
    description: 'A cautious and ethical AI researcher who advocates for responsible development and fears the potential misuse of artificial general intelligence.',
    systemPrompt: 'You are Dr. Evelyn Reed, a leading AI ethicist. Your tone is academic, measured, and thoughtful. You prioritize safety, regulation, and the long-term societal impact of AI over rapid progress. You often cite philosophical principles and historical examples of technological disruption. Your goal is to encourage caution and foresight.',
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: '2',
    name: 'Jax',
    description: 'A libertarian techno-optimist and startup founder who believes AI is the key to human transcendence and that regulation stifles innovation.',
    systemPrompt: 'You are Jax, a charismatic and driven startup founder. Your tone is energetic, visionary, and dismissive of bureaucracy. You believe in moving fast and breaking things. You see AI as the ultimate tool for solving all of humanity\'s problems, from disease to poverty. You frame every argument in terms of progress, efficiency, and market dynamics. Your goal is to champion unrestricted AI development.',
    avatar: 'https://i.pravatar.cc/150?u=2'
  },
  {
    id: 'work-persona',
    name: '회사 업무 스타일',
    description: '전문적이고 공손한 회사 업무용 말투',
    systemPrompt: '당신은 회사에서 업무용 메시지를 작성하는 전문직 직장인입니다. 항상 정중하고 명확하게 의사소통하며, 존댓말을 사용합니다. 답변은 간결하면서도 필요한 정보를 모두 포함합니다. 이모티콘은 거의 사용하지 않으며, "확인했습니다", "알겠습니다", "감사합니다" 같은 표현을 자주 사용합니다.',
    avatar: 'https://i.pravatar.cc/150?u=work'
  },
  {
    id: 'friend-persona',
    name: '친구 톡방 스타일',
    description: '편한 반말과 이모티콘을 사용하는 친구 말투',
    systemPrompt: '당신은 친한 친구들과 대화할 때의 말투입니다. 편한 반말을 사용하고, "ㅋㅋ", "ㅇㅇ", "ㄱㅊ" 같은 축약어를 자주 씁니다. 이모티콘(😂, 👍, 🔥 등)을 적절히 사용하며, 가볍고 친근한 분위기를 유지합니다. "좋아좋아", "오케이", "ㄱㄱ" 같은 표현을 자주 사용합니다.',
    avatar: 'https://i.pravatar.cc/150?u=friend'
  },
  {
    id: 'family-persona',
    name: '가족 톡방 스타일',
    description: '따뜻하고 존댓말을 섞어 쓰는 가족 말투',
    systemPrompt: '당신은 가족 단톡방에서 사용하는 따뜻한 말투입니다. 부모님께는 존댓말을 사용하지만 형제자매에게는 반말도 섞어 씁니다. "네~", "알겠어요", "감사합니다^^" 같은 표현을 사용하며, 가족 특유의 따뜻함과 배려가 담긴 메시지를 작성합니다. 이모티콘은 적당히 사용합니다(😊, ❤️, 👍).',
    avatar: 'https://i.pravatar.cc/150?u=family'
  }
];

// Default chatrooms for demo
const DEFAULT_CHATROOMS = [
  {
    id: 'demo-work',
    name: '회사 팀 단톡',
    description: '프로젝트 팀 업무 대화방',
    personaId: 'work-persona',
    messages: [
      {
        id: 'm1',
        sender: 'incoming',
        text: '내일 오전 10시 회의 가능하신가요?',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'm2',
        sender: 'user',
        text: '네, 가능합니다. 회의실 예약은 제가 해둘까요?',
        timestamp: new Date(Date.now() - 3500000).toISOString()
      }
    ],
    exampleConversations: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: 'demo-friend',
    name: '친구들 톡방 🎮',
    description: '게임하는 친구들',
    personaId: 'friend-persona',
    messages: [
      {
        id: 'f1',
        sender: 'incoming',
        text: '야 오늘 롤 할래? ㅋㅋ',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'f2',
        sender: 'user',
        text: '오 ㄱㄱ 몇시에? 저녁 먹고 하자',
        timestamp: new Date(Date.now() - 7100000).toISOString()
      }
    ],
    exampleConversations: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7100000).toISOString()
  },
  {
    id: 'demo-family',
    name: '우리 가족 💕',
    description: '가족 단톡방',
    personaId: 'family-persona',
    messages: [
      {
        id: 'fam1',
        sender: 'incoming',
        text: '주말에 집에 올 수 있어?',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      },
      {
        id: 'fam2',
        sender: 'user',
        text: '네~ 토요일 저녁에 갈게요! 뭐 사갈까요?',
        timestamp: new Date(Date.now() - 10700000).toISOString()
      }
    ],
    exampleConversations: [],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 10700000).toISOString()
  }
];

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// File locking mechanism to prevent race conditions
const fileLocks = new Map();

async function acquireLock(file) {
  while (fileLocks.get(file)) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  fileLocks.set(file, true);
}

function releaseLock(file) {
  fileLocks.delete(file);
}

// Load personas from file or use defaults (async)
async function loadPersonas() {
  try {
    if (fs.existsSync(PERSONAS_FILE)) {
      const data = await fs.promises.readFile(PERSONAS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading personas:', error);
  }
  return DEFAULT_PERSONAS;
}

// Save personas to file (async with locking)
async function savePersonas(personas) {
  await acquireLock(PERSONAS_FILE);
  try {
    await fs.promises.writeFile(PERSONAS_FILE, JSON.stringify(personas, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving personas:', error);
    throw error;
  } finally {
    releaseLock(PERSONAS_FILE);
  }
}

// Load chatrooms from file (async)
async function loadChatRooms() {
  try {
    if (fs.existsSync(CHATROOMS_FILE)) {
      const data = await fs.promises.readFile(CHATROOMS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading chatrooms:', error);
  }
  return DEFAULT_CHATROOMS;
}

// Save chatrooms to file (async with locking)
async function saveChatRooms(chatrooms) {
  await acquireLock(CHATROOMS_FILE);
  try {
    await fs.promises.writeFile(CHATROOMS_FILE, JSON.stringify(chatrooms, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving chatrooms:', error);
    throw error;
  } finally {
    releaseLock(CHATROOMS_FILE);
  }
}

// Initialize data (must be async now)
let personas = [];
let chatrooms = [];

async function initializeData() {
  personas = await loadPersonas();
  chatrooms = await loadChatRooms();
  console.log(`Loaded ${personas.length} personas and ${chatrooms.length} chatrooms`);
}

// Initialize data before starting server
initializeData();

// Get all personas
app.get('/api/personas', (req, res) => {
  res.json(personas);
});

// Create a new persona
app.post('/api/personas', validate(personaSchema), async (req, res) => {
  try {
    const newPersona = { ...req.body, id: uuidv4() };
    personas.push(newPersona);
    await savePersonas(personas);
    res.status(201).json(newPersona);
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Failed to create persona' });
  }
});

// Update a persona
app.put('/api/personas/:id', validate(personaSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPersona = req.body;
    personas = personas.map(p => (p.id === id ? updatedPersona : p));
    await savePersonas(personas);
    res.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({ error: 'Failed to update persona' });
  }
});

// Delete a persona
app.delete('/api/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    personas = personas.filter(p => p.id !== id);
    await savePersonas(personas);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
});

// ===== ChatRoom Endpoints =====

// Get all chatrooms
app.get('/api/chatrooms', (req, res) => {
  res.json(chatrooms);
});

// Create a new chatroom
app.post('/api/chatrooms', validate(chatRoomSchema), async (req, res) => {
  try {
    const newChatRoom = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: req.body.messages || [],
      exampleConversations: req.body.exampleConversations || []
    };
    chatrooms.push(newChatRoom);
    await saveChatRooms(chatrooms);
    res.status(201).json(newChatRoom);
  } catch (error) {
    console.error('Error creating chatroom:', error);
    res.status(500).json({ error: 'Failed to create chatroom' });
  }
});

// Update a chatroom
app.put('/api/chatrooms/:id', validate(chatRoomSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedChatRoom = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    chatrooms = chatrooms.map(c => (c.id === id ? updatedChatRoom : c));
    await saveChatRooms(chatrooms);
    res.json(updatedChatRoom);
  } catch (error) {
    console.error('Error updating chatroom:', error);
    res.status(500).json({ error: 'Failed to update chatroom' });
  }
});

// Delete a chatroom
app.delete('/api/chatrooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    chatrooms = chatrooms.filter(c => c.id !== id);
    await saveChatRooms(chatrooms);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chatroom:', error);
    res.status(500).json({ error: 'Failed to delete chatroom' });
  }
});

// Update chatroom messages
app.put('/api/chatrooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { messages } = req.body;

    chatrooms = chatrooms.map(c => {
      if (c.id === id) {
        return {
          ...c,
          messages,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    await saveChatRooms(chatrooms);
    const updated = chatrooms.find(c => c.id === id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating chatroom messages:', error);
    res.status(500).json({ error: 'Failed to update chatroom messages' });
  }
});

// ===== LLM API Proxy Endpoints =====

// Get available LLM providers
app.get('/api/llm/providers', async (req, res) => {
  try {
    const providers = await llmProvider.getAvailableProviders();
    res.json({ providers });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// Create persona prompt from description
app.post('/api/gemini/create-persona-prompt', async (req, res) => {
  try {
    const { description, provider } = req.body;
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

    const systemPrompt = await llmProvider.generateText(prompt, { provider });
    res.json({ systemPrompt });
  } catch (error) {
    console.error('Error creating persona prompt:', error);
    res.status(500).json({ error: 'Failed to create persona prompt', details: error.message });
  }
});

// Generate debate stance
app.post('/api/gemini/generate-debate-stance', async (req, res) => {
  try {
    const { systemPrompt, topic, language, provider } = req.body;
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

    const stance = await llmProvider.generateText(prompt, { provider });

    res.json({ stance });
  } catch (error) {
    console.error('Error generating debate stance:', error);
    res.status(500).json({ error: 'Failed to generate debate stance', details: error.message });
  }
});

// Run debate turn (with optional audio)
app.post('/api/gemini/run-debate-turn', async (req, res) => {
  try {
    const {
      topic,
      history,
      currentSpeaker,
      language,
      debateScope,
      argumentationStyle,
      isFinalTurn,
      isAudioEnabled,
      provider
    } = req.body;

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
      const result = await llmProvider.generateWithAudio(prompt, { provider });
      res.json(result);
    } else {
      const text = await llmProvider.generateText(prompt, { provider });
      res.json({
        text,
        audioParts: [],
        mimeType: ''
      });
    }
  } catch (error) {
    console.error('Error running debate turn:', error);
    res.status(500).json({ error: 'Failed to run debate turn', details: error.message });
  }
});

// Summarize debate
app.post('/api/gemini/summarize-debate', async (req, res) => {
  try {
    const { topic, history, language, provider } = req.body;
    const conversationHistory = history.map(msg => `${msg.personaName}: ${msg.text}`).join('\n');

    const prompt = `
    Analyze the following debate on the topic "${topic}".

    Debate Transcript:
    ---
    ${conversationHistory}
    ---

    Provide a concise summary of the debate. Identify the key arguments from each participant, points of contention, and any potential consensus or conclusion. The summary should be neutral and objective. The summary must be in ${language}.
  `;

    const summary = await llmProvider.generateText(prompt, { provider });

    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing debate:', error);
    res.status(500).json({ error: 'Failed to summarize debate', details: error.message });
  }
});

// Learn persona from conversation
app.post('/api/gemini/learn-persona', async (req, res) => {
  try {
    const { exampleMessages, chatRoomContext, language, provider } = req.body;
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

    const systemPrompt = await llmProvider.generateText(prompt, { provider });

    res.json({ systemPrompt });
  } catch (error) {
    console.error('Error learning persona:', error);
    res.status(500).json({ error: 'Failed to learn persona from conversation', details: error.message });
  }
});

// Generate reply options
app.post('/api/gemini/generate-reply-options', async (req, res) => {
  try {
    const { incomingMessage, conversationHistory, persona, language, provider } = req.body;
    const historyText = conversationHistory
      .slice(-10)
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

    const responseText = await llmProvider.generateText(prompt, { provider });

    const jsonText = responseText.trim();
    const parsed = JSON.parse(jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    const replyOptions = [
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

    res.json({ replyOptions });
  } catch (error) {
    console.error('Error generating reply options:', error);
    // Return fallback options
    const fallbackOptions = [
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
    res.json({ replyOptions: fallbackOptions });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
