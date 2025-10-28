import React from 'react';
import { useTranslation } from 'react-i18next';
import { Persona } from '../types';

interface ActiveParticipantsProps {
  participants: Persona[];
}

const ActiveParticipants: React.FC<ActiveParticipantsProps> = ({ participants }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 mb-4">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-bold text-purple-300">{t('participants')}:</h3>
        {participants.map(p => (
          <div key={p.id} className="flex items-center space-x-2" title={p.description}>
            <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full" />
            <span className="text-sm font-semibold">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveParticipants;
