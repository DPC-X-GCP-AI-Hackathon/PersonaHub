
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'personas.json');

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
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(personas, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving personas:', error);
  }
}

let personas = loadPersonas();

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
