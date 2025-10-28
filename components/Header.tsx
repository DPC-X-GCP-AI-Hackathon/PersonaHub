
import React from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="py-4 px-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <SparklesIcon className="w-8 h-8 text-purple-400 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Persona<span className="text-purple-400">Hub</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 text-sm rounded-md ${i18n.language === 'en' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
            English
          </button>
          <button
            onClick={() => changeLanguage('ko')}
            className={`px-3 py-1 text-sm rounded-md ${i18n.language === 'ko' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
            한국어
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
