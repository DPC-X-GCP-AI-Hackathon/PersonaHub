
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Persona, DebateMessage } from '../types';
import { runLiveDebateTurn, summarizeDebate, generateDebateStance } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import ChevronRightIcon from './icons/ChevronRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import DownloadIcon from './icons/DownloadIcon';
import PlayIcon from './icons/PlayIcon';

interface DebateArenaProps {
  participants: Persona[];
  onDebateStateChange: (isDebating: boolean) => void;
  isDebateInProgress: boolean;
}

const DebateArena: React.FC<DebateArenaProps> = ({ participants: initialParticipants, onDebateStateChange, isDebateInProgress }) => {
  const { t, i18n } = useTranslation();
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [participants, setParticipants] = useState<Persona[]>(initialParticipants);
  const [debateScope, setDebateScope] = useState('Strict');
  const [argumentationStyle, setArgumentationStyle] = useState('Adversarial');
  const [debateTurns, setDebateTurns] = useState(3);
  const [isStopping, setIsStopping] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stopDebateRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isDebating]);

  const speak = (audioBlob: Blob): Promise<void> => {
    return new Promise(async (resolve) => {
      if (!isAudioEnabled) {
        resolve();
        return;
      }

      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        resolve();
      }
    });
  };

  
  const handleStopDebate = () => {
    stopDebateRef.current = true;
    setIsStopping(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const startDebate = async () => {
    if (!topic || participants.length < 2) return;
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    stopDebateRef.current = false;
    setIsSettingUp(true);
    onDebateStateChange(true);
    setSummary('');

    const participantsWithStances = await Promise.all(
      participants.map(async (p) => ({
        ...p,
        stance: await generateDebateStance(p.systemPrompt, topic, i18n.language),
      }))
    );
    setParticipants(participantsWithStances);

    setIsSettingUp(false);
    setIsDebating(true);

    const initialMessage: DebateMessage = {
      personaId: 'moderator',
      personaName: 'Moderator',
      text: `Debate starting on the topic: "${topic}"`,
      avatar: ''
    };
    setMessages([initialMessage]);
    
    await new Promise(res => setTimeout(res, 1000));

    let currentMessages = [initialMessage];

    for (let turn = 0; turn < debateTurns * participantsWithStances.length; turn++) {
        if (stopDebateRef.current) break;

        const speakerIndex = turn % participantsWithStances.length;
        const currentSpeaker = participantsWithStances[speakerIndex];
        const isFinalTurn = turn >= (debateTurns - 1) * participantsWithStances.length;
        
        const thinkingMessage: DebateMessage = {
            personaId: 'moderator',
            personaName: 'Moderator',
            text: `${currentSpeaker.name} is thinking...`,
            avatar: ''
        };

        setMessages(prev => [...prev, thinkingMessage]);

        const { text, audio } = await runLiveDebateTurn(topic, currentMessages, currentSpeaker, i18n.language, debateScope, argumentationStyle, isFinalTurn, isAudioEnabled);

        if (stopDebateRef.current) break;

        const newResponseMessage: DebateMessage = {
            personaId: currentSpeaker.id,
            personaName: currentSpeaker.name,
            text: text,
            avatar: currentSpeaker.avatar
        };
        
        currentMessages = [...currentMessages, newResponseMessage];
        setMessages(prev => prev.filter(m => m.personaId !== 'moderator' || m.text.indexOf('is thinking') === -1));
        setMessages(prev => [...prev, newResponseMessage]);
        await speak(audio);
        
        await new Promise(res => setTimeout(res, 500)); // Brief pause between turns
    }
    
    const finalMessage: DebateMessage = {
        personaId: 'moderator',
        personaName: 'Moderator',
        text: stopDebateRef.current ? 'Debate stopped by user.' : 'The debate has concluded.',
        avatar: ''
    };
    setMessages(prev => [...prev, finalMessage]);
    setIsDebating(false);
    onDebateStateChange(false);
    setIsStopping(false);
  };
  
  const handleSummarize = async () => {
    setIsSummarizing(true);
    const debateSummary = await summarizeDebate(topic, messages, i18n.language);
    setSummary(debateSummary);
    setIsSummarizing(false);
  }

  const handleExportDebate = () => {
    const debateData = {
      topic,
      date: new Date().toISOString(),
      participants: participants.map(p => ({
        name: p.name,
        description: p.description,
        stance: p.stance
      })),
      settings: {
        debateScope,
        argumentationStyle,
        debateTurns
      },
      messages: messages.map(m => ({
        personaName: m.personaName,
        text: m.text
      })),
      summary: summary || null
    };

    const blob = new Blob([JSON.stringify(debateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debate-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const handleExportDebateText = () => {
    let textContent = `Debate Topic: ${topic}\n`;
    textContent += `Date: ${new Date().toLocaleString()}\n`;
    textContent += `Participants: ${participants.map(p => p.name).join(', ')}\n`;
    textContent += `Settings: ${debateScope} scope, ${argumentationStyle} style, ${debateTurns} turns\n`;
    textContent += `\n${'='.repeat(80)}\n\n`;

    messages.forEach(msg => {
      if (msg.personaId === 'moderator') {
        textContent += `\n[${msg.personaName}] ${msg.text}\n\n`;
      } else {
        textContent += `${msg.personaName}:\n${msg.text}\n\n`;
      }
    });

    if (summary) {
      textContent += `\n${'='.repeat(80)}\n\nSUMMARY:\n${summary}\n`;
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debate-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 w-full ${isDebateInProgress ? 'flex flex-col flex-grow' : ''}`}>
        <h2 className="text-xl font-bold mb-4 text-center text-purple-300">{t('debateArena')}</h2>
        <div className="flex items-center space-x-4 mb-4">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('enterDebateTopic')}
                disabled={isDebating || isSettingUp}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="flex items-center space-x-2">
              <label htmlFor="debate-turns" className="text-sm font-medium text-gray-300">{t('debateTurns')}</label>
              <input
                  id="debate-turns"
                  type="number"
                  value={debateTurns}
                  onChange={(e) => setDebateTurns(parseInt(e.target.value, 10))}
                  disabled={isDebating || isSettingUp}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-sm w-20"
                  min={1}
                  max={5}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="debate-scope" className="text-sm font-medium text-gray-300">{t('debateScope')}</label>
              <select
                  id="debate-scope"
                  value={debateScope}
                  onChange={(e) => setDebateScope(e.target.value)}
                  disabled={isDebating || isSettingUp}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                  <option value="Strict">{t('strict')}</option>
                  <option value="Expansive">{t('expansive')}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="argumentation-style" className="text-sm font-medium text-gray-300">{t('argumentationStyle')}</label>
              <select
                  id="argumentation-style"
                  value={argumentationStyle}
                  onChange={(e) => setArgumentationStyle(e.target.value)}
                  disabled={isDebating || isSettingUp}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                  <option value="Adversarial">{t('adversarial')}</option>
                  <option value="Collaborative">{t('collaborative')}</option>
              </select>
            </div>
            <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${isAudioEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            >
                <PlayIcon className="w-5 h-5" />
                <span>{isAudioEnabled ? t('audioOn') : t('audioOff')}</span>
            </button>
            {!isDebating ? (
              <button
                  onClick={startDebate}
                  disabled={participants.length < 2 || !topic || isSettingUp}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors font-semibold w-40"
              >
                  {isSettingUp ? (
                    <><SparklesIcon className="w-5 h-5 animate-spin" /> {t('starting')}</>
                  ) : (
                    <>{t('startDebate')} <ChevronRightIcon className="w-5 h-5"/></>
                  )}
              </button>
            ) : (
              <button
                  onClick={handleStopDebate}
                  disabled={isStopping}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition-colors font-semibold w-40"
              >
                  {isStopping ? (
                    <><SparklesIcon className="w-5 h-5 animate-spin" /> {t('stopping')}</>
                  ) : (
                    t('stopDebate')
                  )}
              </button>
            )}
        </div>

        <div className={`bg-gray-900 rounded-md p-4 overflow-y-auto border border-gray-700 ${isDebateInProgress ? 'flex-grow' : 'h-96'}`}>
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
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSummarizing ? t('summarizing') : t('summarizeDebate')}
                        <SparklesIcon className={`w-5 h-5 ${isSummarizing ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleExportDebateText}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        {t('exportText') || 'Export as Text'}
                        <DownloadIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleExportDebate}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        {t('exportJson') || 'Export as JSON'}
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>

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
