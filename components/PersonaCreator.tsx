
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Persona } from '../types';
import { createPersonaPrompt } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

interface PersonaCreatorProps {
  onClose: () => void;
  onPersonaCreate: (newPersona: Persona) => void;
}

const PersonaCreator: React.FC<PersonaCreatorProps> = ({ onClose, onPersonaCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePrompt = async () => {
    if (!description) {
      setError('Please provide a description to generate a prompt.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const generatedPrompt = await createPersonaPrompt(description);
    setSystemPrompt(generatedPrompt);
    setIsGenerating(false);
  };

  const handleCreate = () => {
    if (!name || !systemPrompt) {
      setError('Name and System Prompt are required.');
      return;
    }
    const newPersona: Persona = {
      id: Date.now().toString(),
      name,
      description,
      systemPrompt,
      avatar: `https://i.pravatar.cc/150?u=${Date.now().toString()}`
    };
    onPersonaCreate(newPersona);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-purple-300">{t('createPersonaTitle')}</h2>
        
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t('personaName')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('personaNamePlaceholder')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">{t('briefDescription')}</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('briefDescriptionPlaceholder')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleGeneratePrompt}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? t('generating') : t('generateSystemPrompt')}
              <SparklesIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-300 mb-1">{t('systemPrompt')}</label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder={t('systemPromptPlaceholder')}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-gray-300 font-mono text-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || !systemPrompt}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
          >
            {t('createPersona')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaCreator;
