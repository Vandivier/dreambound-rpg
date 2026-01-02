import React from 'react';
import Button from '../../Button';
import { ArchiveBoxIcon, XMarkIcon, BoltIcon, ShieldCheckIcon, SparklesIcon, BeakerIcon } from '@heroicons/react/24/solid';
import { getItemType, ItemType } from '../../../services/gameLogic';
import { getDeterministicStats } from '../../../services/items';
import { EncyclopediaEntry } from '../../../types';

interface InventoryModalProps {
  inventory: string[];
  encyclopedia: EncyclopediaEntry[];
  loading: boolean;
  onUseItem: (item: string) => void;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, encyclopedia, loading, onUseItem, onClose }) => {
  
  const renderAction = (item: string) => {
      const type = getItemType(item, encyclopedia);
      let label = "Inspect";
      let icon = <SparklesIcon className="h-3 w-3 mr-1"/>;
      let btnClass = "bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/50";

      if (type === 'WEAPON') {
          label = "Equip";
          icon = <BoltIcon className="h-3 w-3 mr-1"/>;
          btnClass = "bg-red-900/40 hover:bg-red-800/40 border-red-500/50 text-red-200";
      } else if (type === 'ARMOR') {
          label = "Equip";
          icon = <ShieldCheckIcon className="h-3 w-3 mr-1"/>;
          btnClass = "bg-blue-900/40 hover:bg-blue-800/40 border-blue-500/50 text-blue-200";
      } else if (type === 'CONSUMABLE') {
          label = "Consume";
          icon = <BeakerIcon className="h-3 w-3 mr-1"/>;
          btnClass = "bg-green-900/40 hover:bg-green-800/40 border-green-500/50 text-green-200";
      }

      return (
        <Button 
            onClick={() => onUseItem(item)} 
            disabled={loading}
            className={`text-xs px-3 py-1 flex items-center ${btnClass}`}
        >
            {icon} {label}
        </Button>
      );
  };

  const getTypeIcon = (type: ItemType) => {
      switch(type) {
          case 'WEAPON': return <BoltIcon className="h-4 w-4 text-red-500"/>;
          case 'ARMOR': return <ShieldCheckIcon className="h-4 w-4 text-blue-500"/>;
          case 'CONSUMABLE': return <BeakerIcon className="h-4 w-4 text-green-500"/>;
          default: return <SparklesIcon className="h-4 w-4 text-amber-500"/>;
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-lg w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><ArchiveBoxIcon className="h-6 w-6 mr-2"/> Inventory</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {inventory.length === 0 ? <p className="text-slate-500 italic text-center py-4">Your pockets are empty...</p> : 
                inventory.map((item, idx) => {
                    const type = getItemType(item, encyclopedia);
                    const entry = encyclopedia.find(e => e.name === item);
                    
                    let statBadge = null;
                    if (type === 'WEAPON') {
                        // Use stats from encyclopedia if appraised, else deterministic fallback
                        const bonus = (entry?.type === 'ITEM' && entry.stats?.atk) 
                           ? entry.stats.atk 
                           : getDeterministicStats(item, 'WEAPON');
                        statBadge = <span className="ml-2 text-[10px] bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded border border-red-800 font-mono">+{bonus} ATK</span>
                    } else if (type === 'ARMOR') {
                        const bonus = (entry?.type === 'ITEM' && entry.stats?.def) 
                           ? entry.stats.def 
                           : getDeterministicStats(item, 'ARMOR');
                        statBadge = <span className="ml-2 text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 font-mono">+{bonus} DEF</span>
                    }

                    return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-900 p-2 rounded border border-slate-700 shrink-0">
                                    {getTypeIcon(type)}
                                </div>
                                <div>
                                    <span className="block font-medium text-slate-200 text-sm md:text-base">{item}</span>
                                    <div className="flex items-center mt-0.5">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{type}</span>
                                        {statBadge}
                                    </div>
                                </div>
                            </div>
                            {renderAction(item)}
                        </div>
                    );
                })
            }
            </div>
        </div>
    </div>
  );
};

export default InventoryModal;