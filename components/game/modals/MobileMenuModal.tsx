import React from 'react';
import { Character, EncyclopediaEntry } from '../../../types';
import Sidebar from '../Sidebar';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface MobileMenuModalProps {
  party: Character[];
  encyclopedia: EncyclopediaEntry[];
  onViewEntry: (entry: Character | EncyclopediaEntry) => void;
  onClose: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
}

const MobileMenuModal: React.FC<MobileMenuModalProps> = ({ 
  party, 
  encyclopedia, 
  onViewEntry, 
  onClose, 
  onOpenInventory, 
  onOpenJournal 
}) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/90 md:hidden flex flex-col animate-in fade-in slide-in-from-right-10 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
            <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Menu</h2>
            <button onClick={onClose} className="p-2"><XMarkIcon className="h-8 w-8 text-slate-400"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Reuse Sidebar component layout logic internally or just wrap it */}
            <div className="flex flex-col h-full">
                <Sidebar 
                    party={party}
                    encyclopedia={encyclopedia}
                    onViewEntry={(entry) => {
                        onViewEntry(entry);
                        onClose();
                    }}
                    onOpenInventory={() => {
                        onOpenInventory();
                        onClose();
                    }}
                    onOpenJournal={() => {
                        onOpenJournal();
                        onClose();
                    }}
                />
            </div>
        </div>
    </div>
  );
};

export default MobileMenuModal;