import React, { useState } from 'react';
import Button from './Button';
import { Gender } from '../types';

interface MainMenuProps {
  onNewGame: (name: string, gender: Gender) => void;
  onLoadGame: () => void;
  hasSave: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onLoadGame, hasSave }) => {
  const [step, setStep] = useState<'MAIN' | 'CREATE'>('MAIN');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.NonBinary);
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!name.trim()) {
        setError('Please enter a name.');
        return;
    }
    onNewGame(name, gender);
  };

  if (step === 'CREATE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
        <div className="max-w-md w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-amber-500 text-center">Who are you?</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="Enter character name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Gender Identity</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(Gender).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-2 py-2 text-sm rounded border transition-colors ${
                      gender === g 
                        ? 'bg-amber-600 border-amber-500 text-white' 
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={() => setStep('MAIN')} className="flex-1">Back</Button>
              <Button onClick={handleStart} className="flex-1">Awaken</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Ambient Background Effect */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

      <div className="z-10 text-center space-y-8 p-8 max-w-lg w-full">
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 tracking-tighter drop-shadow-sm">
            DREAM<br/>BOUND
          </h1>
          <p className="mt-4 text-slate-400 tracking-widest text-sm uppercase">A Procedural RPG Journey</p>
        </div>

        <div className="space-y-4 flex flex-col items-center w-full">
          <Button onClick={() => setStep('CREATE')} fullWidth className="max-w-xs text-lg py-4">
            New Game
          </Button>
          <Button 
            variant="secondary" 
            onClick={onLoadGame} 
            disabled={!hasSave}
            fullWidth 
            className="max-w-xs text-lg py-4"
          >
            {hasSave ? "Continue Dream" : "No Saved Game"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
