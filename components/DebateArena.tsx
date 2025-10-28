
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Persona, DebateMessage } from '../types';
import { runDebateTurn, summarizeDebate, generateDebateStance } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import ChevronRightIcon from './icons/ChevronRightIcon';
import SparklesIcon from './icons/SparklesIcon';

interface DebateArenaProps {
  participants: Persona[];
}

const DEBATE_TURNS = 3; // 3 turns per participant

const DebateArena: React.FC<DebateArenaProps> = ({ participants: initialParticipants }) => {
  const { t, i18n } = useTranslation();
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [participants, setParticipants] = useState<Persona[]>(initialParticipants);
  const [debateScope, setDebateScope] = useState('Strict');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isDebating]);
  
  const startDebate = async () => {
    if (!topic || participants.length < 2) return;
    
    setIsDebating(true);
    setSummary('');

    const participantsWithStances = await Promise.all(
      participants.map(async (p) => ({
        ...p,
        stance: await generateDebateStance(p.systemPrompt, topic, i18n.language),
      }))
    );
    setParticipants(participantsWithStances);

    const initialMessage: DebateMessage = {
      personaId: 'moderator',
      personaName: 'Moderator',
      text: `Debate starting on the topic: "${topic}"`,
      avatar: ''
    };
    setMessages([initialMessage]);
    
    await new Promise(res => setTimeout(res, 1000));

    let currentMessages = [initialMessage];

    for (let turn = 0; turn < DEBATE_TURNS * participantsWithStances.length; turn++) {
        const speakerIndex = turn % participantsWithStances.length;
        const currentSpeaker = participantsWithStances[speakerIndex];
        
        const thinkingMessage: DebateMessage = {
            personaId: 'moderator',
            personaName: 'Moderator',
            text: `${currentSpeaker.name} is thinking...`,
            avatar: ''
        };

        setMessages(prev => [...prev, thinkingMessage]);

        const responseText = await runDebateTurn(topic, currentMessages, currentSpeaker, i18n.language, debateScope);

        const newResponseMessage: DebateMessage = {
            personaId: currentSpeaker.id,
            personaName: currentSpeaker.name,
            text: responseText,
            avatar: currentSpeaker.avatar
        };
        
        currentMessages = [...currentMessages, newResponseMessage];
        setMessages(prev => [...prev.slice(0, -1), newResponseMessage]);
        
        await new Promise(res => setTimeout(res, 500)); // Brief pause between turns
    }
    
    const finalMessage: DebateMessage = {
        personaId: 'moderator',
        personaName: 'Moderator',
        text: 'The debate has concluded.',
        avatar: ''
    };
    setMessages(prev => [...prev, finalMessage]);
    setIsDebating(false);
  };
  
  const handleSummarize = async () => {
    setIsSummarizing(true);
    const debateSummary = await summarizeDebate(topic, messages, i18n.language);
    setSummary(debateSummary);
    setIsSummarizing(false);
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full mt-6">
        <h2 className="text-xl font-bold mb-4 text-center text-purple-300">{t('debateArena')}</h2>
        <div className="flex items-center space-x-4 mb-4">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('enterDebateTopic')}
                disabled={isDebating}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="flex items-center space-x-2">
              <label htmlFor="debate-scope" className="text-sm font-medium text-gray-300">{t('debateScope')}</label>
              <select
                  id="debate-scope"
                  value={debateScope}
                  onChange={(e) => setDebateScope(e.target.value)}
                  disabled={isDebating}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                  <option value="Strict">{t('strict')}</option>
                  <option value="Expansive">{t('expansive')}</option>
              </select>
            </div>
            <button
                onClick={startDebate}
                disabled={isDebating || participants.length < 2 || !topic}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors font-semibold"
            >
                {t('startDebate')} <ChevronRightIcon className="w-5 h-5"/>
            </button>
        </div>

        <div className="h-96 bg-gray-900 rounded-md p-4 overflow-y-auto border border-gray-700">
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    {t('debateWillAppearHere')}
                </div>
            )}
            {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
            ))}
            <div ref={chatEndRef} />
        </div>
        
        {!isDebating && messages.length > 1 && (
            <div className="mt-4 flex flex-col items-center">
                <button
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
                >
                    {isSummarizing ? t('summarizing') : t('summarizeDebate')}
                    <SparklesIcon className={`w-5 h-5 ${isSummarizing ? 'animate-spin' : ''}`} />
                </button>

                {summary && (
                    <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg w-full">
                        <h3 className="text-lg font-bold text-green-300 mb-2">{t('debateSummary')}</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default DebateArena;
