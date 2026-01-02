import React from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { getAvatarUrl, getXpForNextLevel } from '../../../services/gameLogic';

interface CharacterDetailModalProps {
  entry: any; // Character | EncyclopediaEntry
  onClose: () => void;
}

const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ entry, onClose }) => {
  if (!entry) return null;
  
  // Calculate display stats
  const weaponBonus = entry.equipment?.weapon?.atkBonus || 0;
  const armorBonus = entry.equipment?.armor?.defBonus || 0;
  
  const baseAtk = entry.atk || 0;
  const baseDef = entry.def || 0;
  
  const totalAtk = baseAtk + weaponBonus;
  const totalDef = baseDef + armorBonus;

  // XP logic
  const currentXp = entry.xp || 0;
  const nextLevelXp = entry.level ? getXpForNextLevel(entry.level) : 100;
  const xpPercent = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full border border-amber-900/50 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4"><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-amber-600 shadow-lg">
                    <img src={getAvatarUrl(entry)} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-amber-100">{entry.name}</h2>
                <div className="flex justify-center gap-2 mt-2">
                <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">{entry.type || (entry.isPlayer ? 'PLAYER' : 'UNKNOWN')}</span>
                {entry.rarity && <span className="bg-slate-800 px-2 py-1 rounded text-xs text-amber-500 border border-amber-900">{entry.rarity}</span>}
                {entry.class && <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">{entry.class}</span>}
                </div>
            </div>
            
            {/* XP Bar for characters */}
            {entry.level && (
              <div className="mb-4 px-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center"><SparklesIcon className="h-3 w-3 mr-1 text-purple-400"/> Lvl {entry.level}</span>
                      <span>{currentXp} / {nextLevelXp} XP</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${xpPercent}%` }} 
                      />
                  </div>
              </div>
            )}

            <div className="space-y-4 text-sm text-slate-300">
                <p className="italic bg-black/20 p-3 rounded border border-slate-800">
                    {entry.description || entry.backstory || "No description available."}
                </p>
                {/* Stats if available */}
                {(entry.atk !== undefined || entry.hp !== undefined) && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded">
                        {entry.hp !== undefined && <div className="col-span-2 md:col-span-1 font-mono">HP: <span className="text-red-400">{entry.hp}/{entry.maxHp}</span></div>}
                        
                        {entry.atk !== undefined && (
                            <div className="font-mono">
                                ATK: <span className="text-amber-400 font-bold">{totalAtk}</span>
                                {weaponBonus > 0 && <span className="text-[10px] text-slate-500 ml-1 block">(Base {baseAtk} + {weaponBonus})</span>}
                            </div>
                        )}
                        
                        {entry.def !== undefined && (
                            <div className="font-mono">
                                DEF: <span className="text-blue-400 font-bold">{totalDef}</span>
                                {armorBonus > 0 && <span className="text-[10px] text-slate-500 ml-1 block">(Base {baseDef} + {armorBonus})</span>}
                            </div>
                        )}
                    </div>
                )}
                
                {entry.equipment && (
                     <div className="bg-slate-800/30 p-4 rounded border border-slate-700/50">
                        <h4 className="font-bold text-slate-400 mb-2 border-b border-slate-700 pb-1">Equipment</h4>
                        <div className="flex justify-between mb-1 items-center">
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Weapon</span>
                          <span className={entry.equipment.weapon ? "text-amber-200" : "text-slate-600 italic text-xs"}>
                            {entry.equipment.weapon ? (
                                <span>{entry.equipment.weapon.name} <span className="text-green-400 text-xs font-mono">(+{entry.equipment.weapon.atkBonus} ATK)</span></span>
                            ) : "None"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Armor</span>
                          <span className={entry.equipment.armor ? "text-blue-200" : "text-slate-600 italic text-xs"}>
                            {entry.equipment.armor ? (
                                <span>{entry.equipment.armor.name} <span className="text-green-400 text-xs font-mono">(+{entry.equipment.armor.defBonus} DEF)</span></span>
                            ) : "None"}
                          </span>
                        </div>
                      </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CharacterDetailModal;
