
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Persona } from './types';
import Header from './components/Header';
import PersonaCard from './components/PersonaCard';
import PersonaCreator from './components/PersonaCreator';
import DebateArena from './components/DebateArena';
import PlusIcon from './components/icons/PlusIcon';
import usePersistentState from './hooks/usePersistentState';
import ActiveParticipants from './components/ActiveParticipants';

const initialPersonas: Persona[] = [
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

const App: React.FC = () => {
  const { t } = useTranslation();
  const [personas, setPersonas] = usePersistentState<Persona[]>('personas', initialPersonas);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isDebateInProgress, setIsDebateInProgress] = useState(false);

  const handleSelectPersona = (personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handlePersonaCreate = (newPersona: Persona) => {
    setPersonas(prev => [...prev, newPersona]);
  };

  const handlePersonaUpdate = (updatedPersona: Persona) => {
    setPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
  };

  const handlePersonaDelete = (personaId: string) => {
    if (window.confirm(t('deleteConfirmation'))) {
        setPersonas(prev => prev.filter(p => p.id !== personaId));
    }
  };

  const handleEditClick = (persona: Persona) => {
    setEditingPersona(persona);
    setIsCreatingOrEditing(true);
  };

  const handleCloseCreator = () => {
    setEditingPersona(null);
    setIsCreatingOrEditing(false);
  };

  const selectedPersonas = personas.filter(p => selectedPersonaIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-6 flex-grow flex flex-col">
        {isDebateInProgress ? (
          <ActiveParticipants participants={selectedPersonas} />
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-1 text-purple-300">{t('personaHub')}</h2>
              <p className="text-gray-400 mb-4">{t('selectPersonas')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personas.map(persona => (
                  <PersonaCard
                      key={persona.id}
                      persona={persona}
                      isSelected={selectedPersonaIds.includes(persona.id)}
                      onSelect={handleSelectPersona}
                      onEdit={handleEditClick}
                      onDelete={handlePersonaDelete}
                  />
                  ))}
                  <button
                      onClick={() => setIsCreatingOrEditing(true)}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-600 text-gray-500 hover:border-purple-500 hover:text-purple-400 transition-colors"
                  >
                      <PlusIcon className="w-12 h-12 mb-2" />
                      <span className="font-semibold">{t('createNewPersona')}</span>
                  </button>
              </div>
          </div>
        )}

        {selectedPersonas.length >= 2 && 
          <div className={`mt-6 ${isDebateInProgress ? 'flex-grow flex flex-col' : ''}`}>
            <DebateArena 
              participants={selectedPersonas} 
              onDebateStateChange={setIsDebateInProgress} 
              isDebateInProgress={isDebateInProgress} 
            />
          </div>
        }
      </main>

      {isCreatingOrEditing && (
        <PersonaCreator
          personaToEdit={editingPersona}
          onClose={handleCloseCreator}
          onPersonaCreate={handlePersonaCreate}
          onPersonaUpdate={handlePersonaUpdate}
        />
      )}
    </div>
  );
};

export default App;
