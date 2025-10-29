import React from 'react';
import { ChatRoom } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface ChatRoomCardProps {
  chatRoom: ChatRoom;
  personaName: string;
  isSelected: boolean;
  onSelect: (chatRoomId: string) => void;
  onEdit: (chatRoom: ChatRoom) => void;
  onDelete: (chatRoomId: string) => void;
}

const ChatRoomCard: React.FC<ChatRoomCardProps> = ({
  chatRoom,
  personaName,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const messageCount = chatRoom.messages?.length || 0;
  const lastMessage = chatRoom.messages?.[chatRoom.messages.length - 1];
  const lastMessageTime = lastMessage
    ? new Date(lastMessage.timestamp)
    : new Date(chatRoom.updatedAt);

  return (
    <div
      onClick={() => onSelect(chatRoom.id)}
      className={`group relative rounded-lg p-4 bg-gray-800 border-2 transition-all duration-200 cursor-pointer hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/50 ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-700'
      }`}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(chatRoom);
          }}
          className="p-1.5 rounded-full bg-gray-700/50 hover:bg-purple-500/50 text-white"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chatRoom.id);
          }}
          className="p-1.5 rounded-full bg-gray-700/50 hover:bg-red-500/50 text-white"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
          {chatRoom.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white truncate">{chatRoom.name}</h3>
          <p className="text-sm text-gray-400 truncate">{chatRoom.description}</p>

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              👤 {personaName}
            </span>
            <span className="flex items-center gap-1">
              💬 {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </span>
            <span>
              {lastMessageTime.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatRoomCard;
