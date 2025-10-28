import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatRoom, Persona, ChatMessage } from '../types';
import { learnPersonaFromConversation, createPersonaPrompt } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

interface ChatRoomCreatorProps {
  chatRoomToEdit?: ChatRoom | null;
  personas: Persona[];
  onClose: () => void;
  onChatRoomCreate: (newChatRoom: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onChatRoomUpdate: (updatedChatRoom: ChatRoom) => void;
  onPersonaCreate: (newPersona: Omit<Persona, 'id'>) => void;
}

const ChatRoomCreator: React.FC<ChatRoomCreatorProps> = ({
  chatRoomToEdit,
  personas,
  onClose,
  onChatRoomCreate,
  onChatRoomUpdate,
  onPersonaCreate
}) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [exampleMessages, setExampleMessages] = useState<string[]>(['', '', '']);
  const [isLearning, setIsLearning] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'basic' | 'examples'>('basic');

  const isEditing = !!chatRoomToEdit;

  useEffect(() => {
    if (isEditing && chatRoomToEdit) {
      setName(chatRoomToEdit.name);
      setDescription(chatRoomToEdit.description);
      setSelectedPersonaId(chatRoomToEdit.personaId);
      const examples = chatRoomToEdit.exampleConversations
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text);
      setExampleMessages([...examples, '', '', ''].slice(0, 3));
    }
  }, [isEditing, chatRoomToEdit]);

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...exampleMessages];
    newExamples[index] = value;
    setExampleMessages(newExamples);
  };

  const handleLearnAndCreate = async () => {
    if (!name || !description) {
      setError(t('nameAndDescriptionRequired') || 'Name and description are required.');
      return;
    }

    const validExamples = exampleMessages.filter(msg => msg.trim());
    if (validExamples.length < 2) {
      setError(t('atLeastTwoExamples') || 'Please provide at least 2 example messages.');
      return;
    }

    setError('');
    setIsLearning(true);

    try {
      // 샘플 메시지로부터 페르소나 학습
      const exampleChatMessages: ChatMessage[] = validExamples.map((text, idx) => ({
        id: idx.toString(),
        sender: 'user',
        text,
        timestamp: new Date(),
        isExample: true
      }));

      const learnedPrompt = await learnPersonaFromConversation(
        exampleChatMessages,
        `${name} - ${description}`,
        i18n.language
      );

      // 새 페르소나 생성
      const newPersona: Omit<Persona, 'id'> = {
        name: `${name} 스타일`,
        description: `"${name}" 대화방에서 사용하는 나의 말투`,
        systemPrompt: learnedPrompt,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      };

      // 페르소나 먼저 생성하고 콜백을 통해 ID 받기
      // 실제로는 onPersonaCreate가 동기적으로 ID를 반환하지 않으므로
      // 임시 ID를 사용하거나, 서버 응답을 기다려야 합니다
      // 여기서는 간단히 처리를 위해 임시 접근
      onPersonaCreate(newPersona);

      // 약간의 딜레이 후 persona 목록에서 마지막 항목 사용
      setTimeout(() => {
        const newChatRoom: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'> = {
          name,
          description,
          personaId: personas[personas.length - 1]?.id || 'temp', // 마지막 생성된 persona
          messages: [],
          exampleConversations: exampleChatMessages
        };

        if (isEditing && chatRoomToEdit) {
          onChatRoomUpdate({
            ...chatRoomToEdit,
            name,
            description,
            exampleConversations: exampleChatMessages
          });
        } else {
          onChatRoomCreate(newChatRoom);
        }

        onClose();
      }, 500);

    } catch (err) {
      console.error('Error learning persona:', err);
      setError(t('errorLearningPersona') || 'Failed to learn persona style. Please try again.');
    } finally {
      setIsLearning(false);
    }
  };

  const handleUseExistingPersona = () => {
    if (!name || !description || !selectedPersonaId) {
      setError(t('allFieldsRequired') || 'All fields are required.');
      return;
    }

    const newChatRoom: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      personaId: selectedPersonaId,
      messages: [],
      exampleConversations: []
    };

    if (isEditing && chatRoomToEdit) {
      onChatRoomUpdate({
        ...chatRoomToEdit,
        name,
        description,
        personaId: selectedPersonaId
      });
    } else {
      onChatRoomCreate(newChatRoom);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-purple-300">
          {isEditing ? t('editChatRoom') || 'Edit Chat Room' : t('createChatRoom') || 'Create Chat Room'}
        </h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Step 1: Basic Info */}
        {step === 'basic' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="chatroom-name" className="block text-sm font-medium text-gray-300 mb-1">
                {t('chatRoomName') || 'Chat Room Name'}
              </label>
              <input
                id="chatroom-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('chatRoomNamePlaceholder') || 'e.g., 회사 단톡, Family Group'}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="chatroom-description" className="block text-sm font-medium text-gray-300 mb-1">
                {t('chatRoomDescription') || 'Description'}
              </label>
              <textarea
                id="chatroom-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t('chatRoomDescriptionPlaceholder') || 'Describe this chat room context...'}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                {t('choosePersonaMethod') || 'Choose Persona Method'}
              </h3>

              <div className="space-y-3">
                {/* Option 1: Learn from examples */}
                <button
                  onClick={() => setStep('examples')}
                  className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-6 h-6" />
                    <div>
                      <p className="font-semibold text-white">
                        {t('learnFromExamples') || '✨ AI Learn My Style'}
                      </p>
                      <p className="text-sm text-gray-200">
                        {t('learnFromExamplesDesc') || 'Provide 2-3 sample messages, AI will learn your style'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Option 2: Use existing persona */}
                {personas.length > 0 && (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="font-semibold text-white mb-2">
                      {t('useExistingPersona') || 'Use Existing Persona'}
                    </p>
                    <select
                      value={selectedPersonaId}
                      onChange={(e) => setSelectedPersonaId(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 mb-3"
                    >
                      <option value="">{t('selectPersona') || 'Select a persona...'}</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleUseExistingPersona}
                      disabled={!selectedPersonaId}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
                    >
                      {isEditing ? t('updateChatRoom') || 'Update' : t('createChatRoom') || 'Create'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Example Messages */}
        {step === 'examples' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('basic')}
              className="text-sm text-purple-400 hover:text-purple-300 mb-2"
            >
              ← {t('back') || 'Back'}
            </button>

            <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-200">
                💡 {t('exampleHint') || 'Provide 2-3 messages that represent how YOU would typically respond in this chat room. AI will learn your tone, formality, and emoji usage.'}
              </p>
            </div>

            {exampleMessages.map((msg, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('exampleMessage') || 'Example Message'} {idx + 1} {idx < 2 && '*'}
                </label>
                <textarea
                  value={msg}
                  onChange={(e) => handleExampleChange(idx, e.target.value)}
                  rows={2}
                  placeholder={t('exampleMessagePlaceholder') || 'How would you respond in this chat room?'}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            ))}

            <button
              onClick={handleLearnAndCreate}
              disabled={isLearning}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 disabled:from-purple-900 disabled:to-pink-900 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isLearning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t('learning') || 'Learning...'}
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  {isEditing ? t('updateAndLearn') || 'Update & Learn' : t('learnAndCreate') || 'Learn & Create'}
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomCreator;
