import React from 'react';
import { Character } from '../../../types';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from '../../Button';

interface PartySelectModalProps {
  party: Character[];
  onSelect: (charId: string) => void;
  onClose: () => void;
  title?: string;
}

const PartySelectModal: React.FC<PartySelectModalProps> = ({ party, onSelect, onClose, title = "Select Character" }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-sm w-full border border-slate-600 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center"><UserIcon className="h-5 w-5 mr-2"/> {title}</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            <div className="space-y-2">
                {party.map(char => (
                    <Button 
                        key={char.id} 
                        onClick={() => onSelect(char.id)}
                        fullWidth
                        className="flex justify-between items-center py-3"
                        variant="secondary"
                    >
                        <span>{char.name}</span>
                        <span className="text-xs text-slate-400">{char.class} (Lvl {char.level})</span>
                    </Button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default PartySelectModal;
