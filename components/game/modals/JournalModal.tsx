import React from 'react';
import { Quest } from '../../../types';
import { BookmarkIcon, XMarkIcon, CheckCircleIcon, CurrencyDollarIcon, SparklesIcon, TrophyIcon, TrashIcon, ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Button from '../../Button';

interface JournalModalProps {
  quests: Quest[];
  onClose: () => void;
  onAbandon: (id: string) => void;
  onFocus: (id: string) => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ quests, onClose, onAbandon, onFocus }) => {
  const active = quests.filter(q => q.status === 'ACTIVE');
  const history = quests.filter(q => q.status === 'COMPLETED' || q.status === 'FAILED');

  const renderRewards = (q: Quest) => {
      if (!q.rewards) return null;
      return (
          <div className="mt-2 flex gap-3 text-xs text-slate-400">
              {q.rewards.gold && <span className="flex items-center text-amber-400"><CurrencyDollarIcon className="h-3 w-3 mr-1"/> {q.rewards.gold}</span>}
              {q.rewards.xp && <span className="flex items-center text-blue-400"><SparklesIcon className="h-3 w-3 mr-1"/> {q.rewards.xp} XP</span>}
              {q.rewards.prestige && <span className="flex items-center text-purple-400"><TrophyIcon className="h-3 w-3 mr-1"/> {q.rewards.prestige} Rep</span>}
          </div>
      );
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-lg w-full border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><BookmarkIcon className="h-6 w-6 mr-2"/> Dream Journal</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-6">
                
                {/* Active Quests */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Active Quests</h3>
                    <div className="space-y-3">
                        {active.length === 0 ? <p className="text-slate-600 italic text-sm">No active quests.</p> : 
                            active.map(q => (
                                <div key={q.id} className="bg-slate-800/50 p-4 rounded border border-amber-900/30">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h4 className="font-bold text-amber-100">{q.title}</h4>
                                            <span className="text-[9px] font-mono text-slate-600 block">#{q.id}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${q.type === 'MAJOR' ? 'bg-amber-900/50 text-amber-400 border-amber-800' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                            {q.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 my-2">{q.description}</p>
                                    {q.target && <div className="text-xs text-slate-500 mt-1">Progress: {q.progress || 0} / {q.target}</div>}
                                    {renderRewards(q)}
                                    
                                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                        <Button 
                                            variant="danger" 
                                            className="text-xs px-2 py-1 flex items-center"
                                            onClick={() => onAbandon(q.id)}
                                            title="Abandon Quest"
                                        >
                                            <TrashIcon className="h-3 w-3 mr-1"/> Abandon
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            className="text-xs px-2 py-1 flex items-center bg-blue-700 hover:bg-blue-600 border-blue-500"
                                            onClick={() => { onFocus(q.id); onClose(); }}
                                            title="Track Quest"
                                        >
                                            <ArrowRightCircleIcon className="h-3 w-3 mr-1"/> Progress
                                        </Button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </section>

                {/* History (Completed / Failed) */}
                {history.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">History</h3>
                        <div className="space-y-3">
                             {history.map(q => {
                                const isFailed = q.status === 'FAILED';
                                return (
                                    <div key={q.id} className={`p-3 rounded border opacity-70 ${isFailed ? 'bg-red-900/20 border-red-900/50' : 'bg-slate-900/50 border-slate-800'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {isFailed ? <XCircleIcon className="h-4 w-4 text-red-500"/> : <CheckCircleIcon className="h-4 w-4 text-green-500"/>}
                                            <div>
                                                <h4 className={`font-bold ${isFailed ? 'text-red-400 line-through' : 'text-slate-500 line-through decoration-slate-600'}`}>{q.title}</h4>
                                                <span className="text-[9px] font-mono text-slate-700 block">#{q.id}</span>
                                            </div>
                                            {isFailed && <span className="ml-auto text-[10px] bg-red-950 text-red-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Failed</span>}
                                        </div>
                                        <p className="text-xs text-slate-600">{q.description}</p>
                                    </div>
                                );
                             })}
                        </div>
                    </section>
                )}

            </div>
        </div>
    </div>
  );
};

export default JournalModal;