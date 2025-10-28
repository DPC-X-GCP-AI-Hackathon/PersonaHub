
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-center">
        <SparklesIcon className="w-8 h-8 text-purple-400 mr-3" />
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Persona<span className="text-purple-400">Hub</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
