import React from 'react';
import Button from '../Button';
import { 
  ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon,
  SparklesIcon, StarIcon, BoltIcon, ShieldCheckIcon, ArchiveBoxIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { getAvatarUrl } from '../../services/gameLogic';
import { Enemy, Suggestion } from '../../types';

interface ControlPanelProps {
  loading: boolean;
  combatActive: boolean;
  activeEnemy?: Enemy;
  currentSuggestion: Suggestion;
  customInput: string;
  setCustomInput: (s: string) => void;
  onMove: (dx: number, dy: number) => void;
  onAction: (text: string) => void;
  onCombatAction: (type: 'ATTACK' | 'DEFEND' | 'FLEE') => void;
  onOpenSpecial: () => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  loading,
  combatActive,
  activeEnemy,
  currentSuggestion,
  customInput,
  setCustomInput,
  onMove,
  onAction,
  onCombatAction,
  onOpenSpecial,
  onOpenInventory,
  onOpenSkills
}) => {
  if (combatActive && activeEnemy) {
    return (
      <div className="bg-slate-900/80 rounded-xl p-3 md:p-4 border border-slate-700 backdrop-blur-md">
        <div className="flex flex-col md:flex-row h-full gap-3 md:gap-4">
             {/* Enemy Visual */}
             <div className="w-full md:w-1/3 flex flex-row md:flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700/50 pb-3 md:pb-0 md:pr-4 gap-4">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] shrink-0">
                     <img src={getAvatarUrl(activeEnemy)} className="w-full h-full object-cover"/>
                 </div>
                 <div className="flex-1 w-full text-left md:text-center">
                    <span className="text-red-300 font-bold uppercase tracking-widest text-xs md:text-sm block">
                        {activeEnemy.name}
                    </span>
                    <div className="w-full bg-slate-950 rounded-full h-2 mt-1">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(activeEnemy.hp / activeEnemy.maxHp) * 100}%` }} 
                        />
                    </div>
                    {/* Enemy EP Bar (Optional, but consistent) */}
                    <div className="w-full bg-slate-950 rounded-full h-1 mt-1 opacity-50">
                        <div 
                          className="bg-purple-600 h-1 rounded-full transition-all duration-500" 
                          style={{ width: `${(activeEnemy.ep / (activeEnemy.maxEp || 10)) * 100}%` }} 
                        />
                    </div>
                    <span className="text-[10px] text-red-400 mt-0.5 block">{activeEnemy.hp} HP</span>
                 </div>
            </div>

            {/* Combat Controls */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <Button onClick={() => onCombatAction('ATTACK')} disabled={loading} className="py-3 md:py-4 bg-red-900/50 border-red-500 hover:bg-red-800 flex items-center justify-center text-sm">
                        <BoltIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2"/> Attack
                    </Button>
                    <Button onClick={onOpenSkills} disabled={loading} className="py-3 md:py-4 bg-purple-900/50 border-purple-500 hover:bg-purple-800 flex items-center justify-center text-sm">
                        <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2"/> Skills
                    </Button>
                    <Button onClick={() => onCombatAction('DEFEND')} disabled={loading} variant="secondary" className="py-2 flex items-center justify-center text-xs md:text-sm">
                        <ShieldCheckIcon className="h-4 w-4 mr-1 md:mr-2"/> Defend
                    </Button>
                    <Button onClick={onOpenInventory} disabled={loading} variant="secondary" className="py-2 flex items-center justify-center text-xs md:text-sm">
                        <ArchiveBoxIcon className="h-4 w-4 mr-1 md:mr-2"/> Items
                    </Button>
                    <Button onClick={() => onCombatAction('FLEE')} disabled={loading} variant="ghost" className="col-span-2 py-2 border border-slate-600 flex items-center justify-center text-xs md:text-sm">
                        Run
                    </Button>
                </div>
            </div>
        </div>
      </div>
    );
  }
  
  const isQuestSuggestion = !!currentSuggestion?.questId;
  const suggestionText = currentSuggestion?.text || "Look around";
  
  return (
    <div className="bg-slate-900/80 rounded-xl p-3 md:p-4 border border-slate-700 backdrop-blur-md">
        <div className="flex flex-col md:flex-row flex-wrap items-center justify-between h-full gap-3 md:gap-4">
            
            {/* Center: Suggestion & Input */}
            <div className="flex-1 w-full space-y-2 md:space-y-3 order-2 md:order-1 min-w-[200px]">
                {/* Suggestions Row */}
                <div className="flex gap-2">
                    <Button 
                        onClick={onOpenSpecial}
                        disabled={loading}
                        className="bg-slate-800 border-slate-600 text-amber-400 px-3 md:px-4 flex items-center justify-center hover:bg-slate-700 text-xs md:text-sm"
                        title="Special Actions"
                    >
                        <StarIcon className="h-4 w-4 md:h-5 md:w-5 mr-1"/> Special
                    </Button>
                     <Button 
                        onClick={onOpenSkills}
                        disabled={loading}
                        className="bg-slate-800 border-slate-600 text-purple-400 px-3 md:px-4 flex items-center justify-center hover:bg-slate-700 text-xs md:text-sm"
                        title="Skills"
                    >
                        <BoltIcon className="h-4 w-4 md:h-5 md:w-5 mr-1"/> Skills
                    </Button>
                    {suggestionText && (
                        <Button 
                            onClick={() => onAction(suggestionText)} 
                            disabled={loading} 
                            className={`flex-1 flex items-center justify-center group text-xs md:text-sm overflow-hidden py-2 md:py-3 ${
                                isQuestSuggestion 
                                    ? "bg-purple-900 hover:bg-purple-800 border-purple-500 text-purple-100"
                                    : "bg-gradient-to-r from-amber-900/80 to-slate-900 border-amber-700/50 text-amber-100"
                            }`}
                        >
                            {isQuestSuggestion ? <ExclamationTriangleIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-purple-300 shrink-0"/> : <SparklesIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-amber-400 group-hover:animate-spin shrink-0"/>}
                            <span className="truncate">
                                {suggestionText} 
                                {isQuestSuggestion && <span className="opacity-50 ml-1 text-[10px] font-mono">({currentSuggestion.questId})</span>}
                            </span>
                        </Button>
                    )}
                </div>

                <form 
                    onSubmit={(e) => { e.preventDefault(); onAction(customInput); }}
                    className="flex gap-2"
                >
                    <input 
                        type="text" 
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Attempt action..."
                        className="flex-1 bg-black/50 border border-slate-700 rounded px-2 md:px-3 py-1.5 md:py-2 text-white focus:outline-none focus:border-amber-500 text-xs md:text-sm"
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !customInput.trim()} variant="secondary" className="px-3 text-xs md:text-sm">Go</Button>
                </form>
            </div>

            {/* Right: D-PAD */}
            <div className="grid grid-cols-3 gap-1 w-28 md:w-32 shrink-0 order-1 md:order-2">
                <div />
                <Button onClick={() => onMove(0, 1)} disabled={loading} className="h-8 md:h-10 !p-0 flex items-center justify-center bg-slate-800 border-slate-700 hover:bg-slate-700"><ChevronUpIcon className="h-4 w-4 md:h-5 md:w-5"/></Button>
                <div />
                
                <Button onClick={() => onMove(-1, 0)} disabled={loading} className="h-8 md:h-10 !p-0 flex items-center justify-center bg-slate-800 border-slate-700 hover:bg-slate-700"><ChevronLeftIcon className="h-4 w-4 md:h-5 md:w-5"/></Button>
                <div className="flex items-center justify-center text-slate-600 text-[8px] md:text-[10px] select-none"></div>
                <Button onClick={() => onMove(1, 0)} disabled={loading} className="h-8 md:h-10 !p-0 flex items-center justify-center bg-slate-800 border-slate-700 hover:bg-slate-700"><ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5"/></Button>

                <div />
                <Button onClick={() => onMove(0, -1)} disabled={loading} className="h-8 md:h-10 !p-0 flex items-center justify-center bg-slate-800 border-slate-700 hover:bg-slate-700"><ChevronDownIcon className="h-4 w-4 md:h-5 md:w-5"/></Button>
                <div />
            </div>
        </div>
    </div>
  );
};

export default ControlPanel;