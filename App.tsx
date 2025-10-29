import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import { Persona, ChatRoom, ChatMessage } from './types';
import Header from './components/Header';
import PersonaCard from './components/PersonaCard';
import PersonaCreator from './components/PersonaCreator';
import DebateArena from './components/DebateArena';
import ChatRoomCard from './components/ChatRoomCard';
import ChatRoomCreator from './components/ChatRoomCreator';
import ChatRoomSimulator from './components/ChatRoomSimulator';
import SkeletonCard from './components/SkeletonCard';
import PlusIcon from './components/icons/PlusIcon';

type TabType = 'debate' | 'messenger';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('debate');

  // LLM Provider state
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);

  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ChatRoom state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [isCreatingChatRoom, setIsCreatingChatRoom] = useState(false);
  const [editingChatRoom, setEditingChatRoom] = useState<ChatRoom | null>(null);
  const [isChatRoomsLoading, setIsChatRoomsLoading] = useState(false);
  const [isDebateInProgress, setIsDebateInProgress] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/personas');
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

  useEffect(() => {
    if (activeTab === 'messenger') {
      fetchChatRooms();
    }
  }, [activeTab]);

  const fetchChatRooms = async () => {
    try {
      setIsChatRoomsLoading(true);
      const res = await fetch('/api/chatrooms');
      if (!res.ok) throw new Error('Failed to fetch chatrooms');
      const data = await res.json();
      setChatRooms(data);
    } catch (err) {
      console.error('Error fetching chatrooms:', err);
    } finally {
      setIsChatRoomsLoading(false);
    }
  };

  const handleSelectPersona = useCallback((personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  }, []);

  const handlePersonaCreate = useCallback(async (newPersona: Omit<Persona, 'id'>) => {
    try {
      const res = await fetch('/api/personas', {
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
      toast.success(t('personaCreated') || 'Persona created successfully');
    } catch (err) {
      console.error('Error creating persona:', err);
      toast.error(t('errorCreatingPersona') || 'Failed to create persona');
    }
  }, [t]);

  const handlePersonaUpdate = useCallback(async (updatedPersona: Persona) => {
    try {
      const res = await fetch(`/api/personas/${updatedPersona.id}`, {
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
      toast.success(t('personaUpdated') || 'Persona updated successfully');
    } catch (err) {
      console.error('Error updating persona:', err);
      toast.error(t('errorUpdatingPersona') || 'Failed to update persona');
    }
  }, [t]);

  const handlePersonaDelete = useCallback(async (personaId: string) => {
    if (window.confirm(t('deleteConfirmation'))) {
      try {
        const res = await fetch(`/api/personas/${personaId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete persona');
        }
        setPersonas(prev => prev.filter(p => p.id !== personaId));
        setSelectedPersonaIds(prev => prev.filter(id => id !== personaId));
        toast.success(t('personaDeleted') || 'Persona deleted successfully');
      } catch (err) {
        console.error('Error deleting persona:', err);
        toast.error(t('errorDeletingPersona') || 'Failed to delete persona');
      }
    }
  }, [t]);

  const handleEditClick = useCallback((persona: Persona) => {
    setEditingPersona(persona);
    setIsCreatingOrEditing(true);
  }, []);

  const handleCloseCreator = useCallback(() => {
    setEditingPersona(null);
    setIsCreatingOrEditing(false);
  }, []);

  // ChatRoom handlers
  const handleChatRoomCreate = useCallback(async (newChatRoom: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChatRoom),
      });
      if (!res.ok) throw new Error('Failed to create chatroom');
      const created = await res.json();
      setChatRooms(prev => [...prev, created]);
      toast.success(t('chatRoomCreated') || 'Chat room created successfully');
    } catch (err) {
      console.error('Error creating chatroom:', err);
      toast.error(t('errorCreatingChatRoom') || 'Failed to create chat room');
    }
  }, [t]);

  const handleChatRoomUpdate = useCallback(async (updated: ChatRoom) => {
    try {
      const res = await fetch(`/api/chatrooms/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update chatroom');
      const result = await res.json();
      setChatRooms(prev => prev.map(c => c.id === result.id ? result : c));
      toast.success(t('chatRoomUpdated') || 'Chat room updated successfully');
    } catch (err) {
      console.error('Error updating chatroom:', err);
      toast.error(t('errorUpdatingChatRoom') || 'Failed to update chat room');
    }
  }, [t]);

  const handleChatRoomDelete = useCallback(async (id: string) => {
    if (window.confirm(t('deleteChatRoomConfirmation'))) {
      try {
        const res = await fetch(`/api/chatrooms/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete chatroom');
        setChatRooms(prev => prev.filter(c => c.id !== id));
        if (selectedChatRoomId === id) setSelectedChatRoomId(null);
        toast.success(t('chatRoomDeleted') || 'Chat room deleted successfully');
      } catch (err) {
        console.error('Error deleting chatroom:', err);
        toast.error(t('errorDeletingChatRoom') || 'Failed to delete chat room');
      }
    }
  }, [t]);

  const handleUpdateMessages = useCallback(async (chatRoomId: string, messages: ChatMessage[]) => {
    try {
      const res = await fetch(`/api/chatrooms/${chatRoomId}/messages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error('Failed to update messages');
      const updated = await res.json();
      setChatRooms(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      console.error('Error updating messages:', err);
    }
  }, []);

  // Memoized computed values
  const selectedPersonas = useMemo(
    () => personas.filter(p => selectedPersonaIds.includes(p.id)),
    [personas, selectedPersonaIds]
  );

  const selectedChatRoom = useMemo(
    () => chatRooms.find(c => c.id === selectedChatRoomId),
    [chatRooms, selectedChatRoomId]
  );

  const selectedChatRoomPersona = useMemo(
    () => selectedChatRoom ? personas.find(p => p.id === selectedChatRoom.personaId) : null,
    [selectedChatRoom, personas]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
      />

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('debate')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'debate'
                  ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎭 {t('debateArena')}
            </button>
            <button
              onClick={() => setActiveTab('messenger')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'messenger'
                  ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💬 {t('messengerSimulator')}
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto p-4 md:p-6 flex-grow flex flex-col">
        {/* Debate Tab */}
        {activeTab === 'debate' && (
          <>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-1 text-purple-300">{t('personaHub')}</h2>
              <p className="text-gray-400 mb-4">{t('selectPersonas')}</p>

              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                  <p className="text-red-200">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
                  >
                    {t('retry')}
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

            {selectedPersonas.length >= 2 && (
              <DebateArena
                participants={selectedPersonas}
                onDebateStateChange={setIsDebateInProgress}
                isDebateInProgress={isDebateInProgress}
                selectedProvider={selectedProvider}
              />
            )}
          </>
        )}

        {/* Messenger Tab */}
        {activeTab === 'messenger' && (
          <>
            {!selectedChatRoom ? (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-1 text-purple-300">{t('chatRooms')}</h2>
                <p className="text-gray-400 mb-4">{t('selectPersonas')}</p>

                {isChatRoomsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chatRooms.map(chatRoom => (
                      <ChatRoomCard
                        key={chatRoom.id}
                        chatRoom={chatRoom}
                        personaName={personas.find(p => p.id === chatRoom.personaId)?.name || 'Unknown'}
                        isSelected={selectedChatRoomId === chatRoom.id}
                        onSelect={setSelectedChatRoomId}
                        onEdit={(room) => {
                          setEditingChatRoom(room);
                          setIsCreatingChatRoom(true);
                        }}
                        onDelete={handleChatRoomDelete}
                      />
                    ))}
                    <button
                      onClick={() => setIsCreatingChatRoom(true)}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-600 text-gray-500 hover:border-purple-500 hover:text-purple-400 transition-colors"
                    >
                      <PlusIcon className="w-12 h-12 mb-2" />
                      <span className="font-semibold">{t('createNewChatRoom')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedChatRoomId(null)}
                  className="mb-4 text-purple-400 hover:text-purple-300 flex items-center gap-2"
                >
                  ← {t('back')} {t('chatRooms')}
                </button>
                {selectedChatRoomPersona && (
                  <ChatRoomSimulator
                    chatRoom={selectedChatRoom}
                    persona={selectedChatRoomPersona}
                    onUpdateMessages={handleUpdateMessages}
                    selectedProvider={selectedProvider}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {isCreatingOrEditing && (
        <PersonaCreator
          personaToEdit={editingPersona}
          onClose={handleCloseCreator}
          onPersonaCreate={handlePersonaCreate}
          onPersonaUpdate={handlePersonaUpdate}
          selectedProvider={selectedProvider}
        />
      )}

      {isCreatingChatRoom && (
        <ChatRoomCreator
          chatRoomToEdit={editingChatRoom}
          personas={personas}
          onClose={() => {
            setIsCreatingChatRoom(false);
            setEditingChatRoom(null);
          }}
          onChatRoomCreate={handleChatRoomCreate}
          onChatRoomUpdate={handleChatRoomUpdate}
          onPersonaCreate={handlePersonaCreate}
          selectedProvider={selectedProvider}
        />
      )}
    </div>
  );
};

export default App;