import React, { useEffect, useState, useCallback } from 'react';
import { getAvailableLLMProviders, type LLMProvider } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

interface LLMSelectorProps {
  selectedProvider: string | undefined;
  onProviderChange: (provider: string | undefined) => void;
}

const LLMSelector: React.FC<LLMSelectorProps> = ({ selectedProvider, onProviderChange }) => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const availableProviders = await getAvailableLLMProviders();
      setProviders(availableProviders);
      setLoading(false);
    };

    fetchProviders();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onProviderChange(value === 'default' ? undefined : value);
  }, [onProviderChange]);

  const getProviderDisplayName = (name: string): string => {
    const displayNames: Record<string, string> = {
      'gemini': 'Google Gemini',
      'ollama': 'Ollama (Local)',
      'openai': 'OpenAI'
    };
    return displayNames[name] || name;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="llm-selector" className="text-sm font-medium text-gray-300">
        LLM:
      </label>
      <select
        id="llm-selector"
        value={selectedProvider || 'default'}
        onChange={handleChange}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg
                   focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5
                   hover:bg-gray-750 transition-colors cursor-pointer"
      >
        <option value="default">
          {t('llmSelector.default', 'Default')}
          {providers.find(p => p.isDefault) && ` (${getProviderDisplayName(providers.find(p => p.isDefault)!.name)})`}
        </option>
        {providers.map((provider) => (
          <option
            key={provider.name}
            value={provider.name}
            disabled={!provider.available}
          >
            {getProviderDisplayName(provider.name)}
            {!provider.available && ' (Unavailable)'}
            {provider.supportsAudio && ' 🎵'}
          </option>
        ))}
      </select>

      {selectedProvider && providers.find(p => p.name === selectedProvider)?.supportsAudio && (
        <span className="text-xs text-green-400" title={t('llmSelector.audioSupport', 'Supports audio generation')}>
          🎵
        </span>
      )}
    </div>
  );
};

export default React.memo(LLMSelector);
