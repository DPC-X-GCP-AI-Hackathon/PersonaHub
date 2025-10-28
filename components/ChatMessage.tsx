
import React from 'react';
import { DebateMessage } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface ChatMessageProps {
  message: DebateMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModerator = message.personaId === 'moderator';

  if (isModerator) {
    return (
      <div className="flex justify-center items-center my-4">
        <div className="px-4 py-2 bg-gray-700 rounded-full text-sm text-gray-300 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-purple-400"/>
            {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4 my-4">
      <img src={message.avatar} alt={message.personaName} className="w-10 h-10 rounded-full border-2 border-gray-600" />
      <div className="flex-1 bg-gray-700 rounded-lg p-3">
        <p className="font-bold text-purple-300">{message.personaName}</p>
        <p className="text-white whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
