import React from 'react';
import { SpecialAction } from '../../../types';
import { StarIcon, XMarkIcon, ShoppingBagIcon, ChatBubbleLeftRightIcon, HandRaisedIcon, MoonIcon, SparklesIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/solid';

interface SpecialActionsModalProps {
  actions: SpecialAction[];
  onAction: (action: SpecialAction) => void;
  onClose: () => void;
}

const SpecialActionsModal: React.FC<SpecialActionsModalProps> = ({ actions, onAction, onClose }) => {
  const renderIcon = (type: string) => {
    switch(type) {
      case 'SHOP': return <ShoppingBagIcon className="h-5 w-5 mr-2 text-amber-400"/>;
      case 'TALK': return <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-400"/>;
      case 'RECRUIT': return <UserPlusIcon className="h-5 w-5 mr-2 text-green-400"/>;
      case 'GATHER': return <HandRaisedIcon className="h-5 w-5 mr-2 text-green-400"/>;
      case 'REST': return <MoonIcon className="h-5 w-5 mr-2 text-purple-400"/>;
      case 'APPRAISE': return <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-purple-300"/>;
      default: return <SparklesIcon className="h-5 w-5 mr-2 text-slate-400"/>;
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full border border-amber-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><StarIcon className="h-6 w-6 mr-2"/> Special Actions</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {actions.length === 0 ? <div className="p-4 text-center text-slate-500 italic">No special interactions found here.</div> : 
                actions.map((action, idx) => (
                    <button key={idx} onClick={() => onAction(action)} className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 rounded flex items-center group transition-all">
                        {renderIcon(action.iconType)}
                        <div>
                            <div className="font-bold text-slate-200 group-hover:text-amber-100">{action.label}</div>
                            <div className="text-xs text-slate-500">{action.description}</div>
                        </div>
                    </button>
                ))
            }
            </div>
        </div>
    </div>
  );
};

export default SpecialActionsModal;
