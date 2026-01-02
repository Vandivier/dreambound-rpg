import React from 'react';
import { Character, EncyclopediaEntry } from '../../types';
import Button from '../Button';
import { UserIcon, InformationCircleIcon, HeartIcon, BookOpenIcon, ArchiveBoxIcon, BookmarkIcon, BoltIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
  party: Character[];
  encyclopedia: EncyclopediaEntry[];
  onViewEntry: (entry: Character | EncyclopediaEntry) => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ party, encyclopedia, onViewEntry, onOpenInventory, onOpenJournal, className = "" }) => {
  const enemies = encyclopedia.filter(e => e.type === 'ENEMY');

  const defaultClasses = "relative z-20 md:w-80 bg-slate-900/95 border-l border-slate-800 p-4 overflow-y-auto hidden md:flex flex-col";
  
  // If we are passed a className, it might be for mobile menu use, so we remove the hidden classes
  const appliedClasses = className ? className : defaultClasses;

  return (
    <div className={appliedClasses}>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mb-6 shrink-0">
            <Button onClick={onOpenInventory} variant="secondary" className="text-xs flex items-center justify-center py-2">
                <ArchiveBoxIcon className="h-4 w-4 mr-1"/> Items
            </Button>
            <Button onClick={onOpenJournal} variant="secondary" className="text-xs flex items-center justify-center py-2">
                <BookmarkIcon className="h-4 w-4 mr-1"/> Journal
            </Button>
        </div>

        <h3 className="text-amber-500 font-bold mb-4 flex items-center shrink-0">
            <UserIcon className="h-5 w-5 mr-2"/> Party
        </h3>
        <div className="space-y-3 mb-6 shrink-0">
            {party.map(char => (
                <div key={char.id} className="bg-slate-800 p-3 rounded border border-slate-700 relative group">
                    <button 
                        onClick={() => onViewEntry(char)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-amber-400 transition-colors"
                        title="View Details"
                    >
                        <InformationCircleIcon className="h-5 w-5"/>
                    </button>
                    <div className="flex justify-between items-center mb-1">
                        <span className={`font-semibold ${char.isPlayer ? 'text-amber-100' : 'text-slate-300'}`}>{char.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 block mb-2">{char.class} (Lvl {char.level})</span>
                    
                    {/* HP Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mb-1">
                        <div 
                        className="bg-red-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(char.hp / char.maxHp) * 100}%` }} 
                        />
                    </div>
                    
                    {/* EP Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mb-2">
                        <div 
                        className="bg-cyan-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(char.ep / (char.maxEp || 10)) * 100}%` }} 
                        />
                    </div>

                    <div className="flex justify-between text-xs mt-1 text-slate-400">
                        <span className="flex items-center"><HeartIcon className="h-3 w-3 mr-1 text-red-500" /> {char.hp}/{char.maxHp}</span>
                        <span className="flex items-center"><BoltIcon className="h-3 w-3 mr-1 text-cyan-500" /> {char.ep}/{char.maxEp || 10}</span>
                    </div>
                </div>
            ))}
        </div>

        <h3 className="text-amber-500 font-bold mb-4 flex items-center shrink-0">
             <BookOpenIcon className="h-5 w-5 mr-2"/> Encyclopedia
        </h3>
        <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {encyclopedia.length === 0 && <p className="text-xs text-slate-600 italic">Explore to find entries.</p>}
            
            {enemies.length > 0 && (
                  <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Bestiary</h4>
                      <div className="space-y-1">
                          {enemies.map((e, idx) => (
                              <button key={idx} onClick={() => onViewEntry(e)} className="w-full text-left p-2 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 flex justify-between group">
                                  <span className="text-red-300 group-hover:text-red-100">{e.name}</span>
                                  <InformationCircleIcon className="h-4 w-4 text-slate-500"/>
                              </button>
                          ))}
                      </div>
                  </div>
              )}
        </div>
    </div>
  );
};

export default Sidebar;
