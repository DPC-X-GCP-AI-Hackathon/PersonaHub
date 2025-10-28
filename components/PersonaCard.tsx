
import React from 'react';
import { Persona } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: (personaId: string) => void;
  onEdit: (persona: Persona) => void;
  onDelete: (personaId: string) => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <div
      onClick={() => onSelect(persona.id)}
      className={`group relative rounded-lg p-4 bg-gray-800 border-2 transition-all duration-200 cursor-pointer hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/50 ${isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-700'}`}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(persona); }}
          className="p-1.5 rounded-full bg-gray-700/50 hover:bg-purple-500/50 text-white"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(persona.id); }}
          className="p-1.5 rounded-full bg-gray-700/50 hover:bg-red-500/50 text-white"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-start space-x-4">
        <img src={persona.avatar} alt={persona.name} className="w-16 h-16 rounded-full border-2 border-gray-600" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{persona.name}</h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-3">{persona.description}</p>
        </div>
      </div>
      {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
      )}
    </div>
  );
};

export default PersonaCard;
