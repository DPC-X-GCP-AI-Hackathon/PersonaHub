
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Persona } from './types';
import Header from './components/Header';
import PersonaCard from './components/PersonaCard';
import PersonaCreator from './components/PersonaCreator';
import DebateArena from './components/DebateArena';
import PlusIcon from './components/icons/PlusIcon';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('http://localhost:3001/api/personas');
        if (!res.ok) {
          throw new Error('Failed to fetch personas');
        }
        const data = await res.json();
        setPersonas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load personas');
        console.error('Error fetching personas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersonas();
  }, []);

  const handleSelectPersona = (personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handlePersonaCreate = async (newPersona: Omit<Persona, 'id'>) => {
    try {
      const res = await fetch('http://localhost:3001/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPersona),
      });
      if (!res.ok) {
        throw new Error('Failed to create persona');
      }
      const createdPersona = await res.json();
      setPersonas(prev => [...prev, createdPersona]);
    } catch (err) {
      console.error('Error creating persona:', err);
      alert(t('errorCreatingPersona') || 'Failed to create persona');
    }
  };

  const handlePersonaUpdate = async (updatedPersona: Persona) => {
    try {
      const res = await fetch(`http://localhost:3001/api/personas/${updatedPersona.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPersona),
      });
      if (!res.ok) {
        throw new Error('Failed to update persona');
      }
      const returnedPersona = await res.json();
      setPersonas(prev => prev.map(p => p.id === returnedPersona.id ? returnedPersona : p));
    } catch (err) {
      console.error('Error updating persona:', err);
      alert(t('errorUpdatingPersona') || 'Failed to update persona');
    }
  };

  const handlePersonaDelete = async (personaId: string) => {
    if (window.confirm(t('deleteConfirmation'))) {
      try {
        const res = await fetch(`http://localhost:3001/api/personas/${personaId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete persona');
        }
        setPersonas(prev => prev.filter(p => p.id !== personaId));
        setSelectedPersonaIds(prev => prev.filter(id => id !== personaId));
      } catch (err) {
        console.error('Error deleting persona:', err);
        alert(t('errorDeletingPersona') || 'Failed to delete persona');
      }
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
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-1 text-purple-300">{t('personaHub')}</h2>
            <p className="text-gray-400 mb-4">{t('selectPersonas')}</p>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <span className="ml-4 text-gray-400">{t('loading') || 'Loading...'}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-200">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
                >
                  {t('retry') || 'Retry'}
                </button>
              </div>
            )}

            {!isLoading && !error && (
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
            )}
        </div>

        {selectedPersonas.length >= 2 && <DebateArena participants={selectedPersonas} />}
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
