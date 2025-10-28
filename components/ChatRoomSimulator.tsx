import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatRoom, ChatMessage, Persona, ReplyOption } from '../types';
import { generateReplyOptions } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

interface ChatRoomSimulatorProps {
  chatRoom: ChatRoom;
  persona: Persona;
  onUpdateMessages: (chatRoomId: string, messages: ChatMessage[]) => void;
}

const ChatRoomSimulator: React.FC<ChatRoomSimulatorProps> = ({
  chatRoom,
  persona,
  onUpdateMessages
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(chatRoom.messages || []);
  const [incomingMessage, setIncomingMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [replyOptions, setReplyOptions] = useState<ReplyOption[]>([]);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendIncomingMessage = async () => {
    if (!incomingMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'incoming',
      text: incomingMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    onUpdateMessages(chatRoom.id, updatedMessages);
    setIncomingMessage('');

    // 자동 응답 옵션 생성
    setIsGenerating(true);
    setShowReplyOptions(true);

    try {
      const options = await generateReplyOptions(
        newMessage.text,
        updatedMessages,
        persona,
        i18n.language
      );
      setReplyOptions(options);
    } catch (error) {
      console.error('Error generating reply options:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectReply = (reply: ReplyOption) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: reply.text,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    onUpdateMessages(chatRoom.id, updatedMessages);
    setShowReplyOptions(false);
    setReplyOptions([]);
  };

  const handleDismissReply = () => {
    setShowReplyOptions(false);
    setReplyOptions([]);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-purple-300">{chatRoom.name}</h2>
        <p className="text-sm text-gray-400">{chatRoom.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('usingPersona') || 'Using persona'}: <span className="text-purple-400">{persona.name}</span>
        </p>
      </div>

      {/* 메시지 영역 - 카톡 스타일 */}
      <div className="h-96 bg-gray-900 rounded-md p-4 overflow-y-auto border border-gray-700 mb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t('chatWillAppearHere') || 'Messages will appear here...'}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : msg.sender === 'incoming'
                  ? 'bg-gray-700 text-white rounded-bl-sm'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* AI 응답 제안 영역 */}
      {showReplyOptions && (
        <div className="mb-4 p-4 bg-gray-900 border border-purple-500 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              {t('aiSuggestedReplies') || 'AI Suggested Replies'}
            </h3>
            <button
              onClick={handleDismissReply}
              className="text-xs text-gray-400 hover:text-white"
            >
              {t('dismiss') || 'Dismiss'}
            </button>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-gray-400 text-sm">
                {t('generatingReplies') || 'Generating replies...'}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {replyOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectReply(option)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {option.tone === 'short'
                        ? t('quickReply') || '⚡ Quick'
                        : option.tone === 'normal'
                        ? t('normalReply') || '💬 Normal'
                        : t('detailedReply') || '📝 Detailed'}
                    </span>
                    <span className="text-xs text-green-400">
                      {Math.round(option.confidence * 100)}% {t('confidence') || 'confident'}
                    </span>
                  </div>
                  <p className="text-white text-sm">{option.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 시뮬레이션 메시지 입력 (상대방 메시지 흉내) */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('simulateIncomingMessage') || 'Simulate Incoming Message'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={incomingMessage}
              onChange={(e) => setIncomingMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendIncomingMessage()}
              placeholder={t('typeMessageHere') || 'Type a message from someone else...'}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              onClick={handleSendIncomingMessage}
              disabled={!incomingMessage.trim() || isGenerating}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {t('send') || 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 {t('simulateMessageHint') || 'Simulate someone sending you a message, and get AI-generated reply suggestions!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomSimulator;
