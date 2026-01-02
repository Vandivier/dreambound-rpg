import React, { useState } from 'react';
import Button from '../../Button';
import { SparklesIcon, XMarkIcon, QuestionMarkCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { getItemType } from '../../../services/gameLogic';
import { EncyclopediaEntry } from '../../../types';

interface AppraisalModalProps {
  gold: number;
  inventory: string[];
  encyclopedia: EncyclopediaEntry[];
  onAppraise: (item: string) => void;
  onClose: () => void;
  loading: boolean;
}

const AppraisalModal: React.FC<AppraisalModalProps> = ({ gold, inventory, encyclopedia, onAppraise, onClose, loading }) => {
  const [showHelp, setShowHelp] = useState(false);

  // Filter items that are likely "Special" or unknown
  // We can appraise anything, but suggest items that are SPECIAL or don't have detailed stats in encyclopedia yet.
  const appraisableItems = inventory.filter(item => {
      const type = getItemType(item, encyclopedia);
      // Items that are classified as SPECIAL (often unknown) or JUNK/TREASURE are prime candidates.
      // Or if it's already a Weapon/Armor but maybe we want to re-appraise? 
      // For simplicity, let's list everything but highlight SPECIAL items.
      return true; 
  });

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-lg w-full border border-purple-500 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-purple-400 flex items-center"><MagnifyingGlassIcon className="h-6 w-6 mr-2"/> Appraiser</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>

            {showHelp ? (
                <div className="p-4 bg-slate-800 rounded mb-4 text-sm text-slate-300">
                    <h3 className="font-bold text-white mb-2">About Appraisal</h3>
                    <p className="mb-2">
                        Many items in the dreamscape are vague or shifting. 
                        An appraisal focuses the item's reality, revealing its true form.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Reveal hidden stats on Weapons and Armor.</li>
                        <li>Discover if a "Special" item is actually edible (Consumable) or valuable (Treasure).</li>
                        <li>Learn if an item is merely Junk.</li>
                    </ul>
                    <Button onClick={() => setShowHelp(false)} className="mt-4" variant="secondary" fullWidth>Got it</Button>
                </div>
            ) : (
                <div className="flex justify-between items-center mb-4 bg-slate-800 p-2 rounded">
                     <span className="text-amber-500 font-bold ml-2">{gold} Gold</span>
                     <button onClick={() => setShowHelp(true)} className="text-xs text-purple-300 flex items-center hover:text-white px-2">
                         <QuestionMarkCircleIcon className="h-4 w-4 mr-1"/> What is this?
                     </button>
                </div>
            )}

            <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                {appraisableItems.length === 0 ? <p className="text-slate-500 text-center py-4">Inventory empty.</p> :
                    appraisableItems.map((item, idx) => {
                        const type = getItemType(item, encyclopedia);
                        const isUnknown = type === 'SPECIAL';
                        
                        return (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded border transition-colors ${isUnknown ? 'bg-slate-800 border-purple-900/50' : 'bg-slate-900 border-slate-800 opacity-75'}`}>
                                <div>
                                    <span className="text-slate-200 font-medium block">{item}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{type}</span>
                                </div>
                                <Button 
                                    onClick={() => onAppraise(item)} 
                                    disabled={gold < 10 || loading}
                                    className={`text-xs px-3 py-1 ${isUnknown ? 'bg-purple-700 hover:bg-purple-600 border-purple-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                                >
                                    {loading ? '...' : '10g'}
                                </Button>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    </div>
  );
};

export default AppraisalModal;