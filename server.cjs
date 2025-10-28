
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3002;
const PERSONAS_FILE = path.join(__dirname, 'data', 'personas.json');
const CHATROOMS_FILE = path.join(__dirname, 'data', 'chatrooms.json');

app.use(cors());
app.use(bodyParser.json());

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

// Load personas from file or use defaults
function loadPersonas() {
  try {
    if (fs.existsSync(PERSONAS_FILE)) {
      const data = fs.readFileSync(PERSONAS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading personas:', error);
  }
  return DEFAULT_PERSONAS;
}

// Save personas to file
function savePersonas(personas) {
  try {
    fs.writeFileSync(PERSONAS_FILE, JSON.stringify(personas, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving personas:', error);
  }
}

// Load chatrooms from file
function loadChatRooms() {
  try {
    if (fs.existsSync(CHATROOMS_FILE)) {
      const data = fs.readFileSync(CHATROOMS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading chatrooms:', error);
  }
  return DEFAULT_CHATROOMS;
}

// Save chatrooms to file
function saveChatRooms(chatrooms) {
  try {
    fs.writeFileSync(CHATROOMS_FILE, JSON.stringify(chatrooms, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving chatrooms:', error);
  }
}

let personas = loadPersonas();
let chatrooms = loadChatRooms();

// Get all personas
app.get('/api/personas', (req, res) => {
  res.json(personas);
});

// Create a new persona
app.post('/api/personas', (req, res) => {
  const newPersona = { ...req.body, id: uuidv4() };
  personas.push(newPersona);
  savePersonas(personas);
  res.status(201).json(newPersona);
});

// Update a persona
app.put('/api/personas/:id', (req, res) => {
  const { id } = req.params;
  const updatedPersona = req.body;
  personas = personas.map(p => (p.id === id ? updatedPersona : p));
  savePersonas(personas);
  res.json(updatedPersona);
});

// Delete a persona
app.delete('/api/personas/:id', (req, res) => {
  const { id } = req.params;
  personas = personas.filter(p => p.id !== id);
  savePersonas(personas);
  res.status(204).send();
});

// ===== ChatRoom Endpoints =====

// Get all chatrooms
app.get('/api/chatrooms', (req, res) => {
  res.json(chatrooms);
});

// Create a new chatroom
app.post('/api/chatrooms', (req, res) => {
  const newChatRoom = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: req.body.messages || [],
    exampleConversations: req.body.exampleConversations || []
  };
  chatrooms.push(newChatRoom);
  saveChatRooms(chatrooms);
  res.status(201).json(newChatRoom);
});

// Update a chatroom
app.put('/api/chatrooms/:id', (req, res) => {
  const { id } = req.params;
  const updatedChatRoom = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  chatrooms = chatrooms.map(c => (c.id === id ? updatedChatRoom : c));
  saveChatRooms(chatrooms);
  res.json(updatedChatRoom);
});

// Delete a chatroom
app.delete('/api/chatrooms/:id', (req, res) => {
  const { id } = req.params;
  chatrooms = chatrooms.filter(c => c.id !== id);
  saveChatRooms(chatrooms);
  res.status(204).send();
});

// Update chatroom messages
app.put('/api/chatrooms/:id/messages', (req, res) => {
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

  saveChatRooms(chatrooms);
  const updated = chatrooms.find(c => c.id === id);
  res.json(updated);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
