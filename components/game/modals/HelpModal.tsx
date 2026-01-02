import React from 'react';
import { QuestionMarkCircleIcon, XMarkIcon, MapIcon, BoltIcon, StarIcon, ShieldCheckIcon, BeakerIcon, HeartIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { sysadminLogs } from '../../../services/ai/config';

interface HelpModalProps {
  onClose: () => void;
  history: string[];
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, history }) => {
  const handleDownloadReport = () => {
      const report = sysadminLogs.slice(0, 10);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dreambound-sysadmin-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleDownloadQuestLog = () => {
      const content = history.join('\n\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dreambound-quest-log-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-t-xl z-10">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><QuestionMarkCircleIcon className="h-6 w-6 mr-2"/> DreamBound Manual</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                
                {/* Intro */}
                <section className="text-slate-300 text-sm leading-relaxed border-b border-slate-800 pb-6">
                    <p className="mb-2"><strong className="text-amber-100">DreamBound RPG</strong> is an infinite, procedurally generated adventure. The world is created by AI as you explore it. No two playthroughs are the same.</p>
                </section>

                {/* Controls & Input */}
                <section>
                    <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center"><StarIcon className="h-5 w-5 mr-2"/> How to Interact</h3>
                    <div className="space-y-3 text-sm text-slate-400">
                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                            <strong className="text-white block mb-1">Standard Actions</strong>
                            Use the <span className="text-amber-400">D-Pad / WASD</span> to move. Use the <span className="text-amber-400">Special</span> button for context-sensitive actions like shopping, harvesting, or talking to NPCs generated on the map.
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                            <strong className="text-white block mb-1">Freeform Imagination</strong>
                            <p>The text input box is your most powerful tool. You can type <em>anything</em>.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 pl-2 italic text-slate-500">
                                <li>"I search the rubble for hidden gems."</li>
                                <li>"I try to tame the shadow wolf."</li>
                                <li>"I meditate to regain focus."</li>
                            </ul>
                            <p className="mt-2">The AI Game Master will determine the outcome based on your stats and the current situation.</p>
                        </div>
                    </div>
                </section>

                {/* Combat Mechanics */}
                <section>
                    <h3 className="text-lg font-bold text-red-500 mb-3 flex items-center"><BoltIcon className="h-5 w-5 mr-2"/> Combat & Survival</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <strong className="text-white block border-b border-slate-700 pb-1 mb-2">Turn-Based Battles</strong>
                            <p className="text-slate-400 mb-2">When you encounter an Enemy, the game enters Combat Mode. You cannot move until the enemy is defeated or you flee.</p>
                            <ul className="space-y-1 text-slate-400">
                                <li><span className="text-red-400 font-bold">ATTACK:</span> Deals damage based on (ATK - Enemy DEF) + Random Variance.</li>
                                <li><span className="text-blue-400 font-bold">DEFEND:</span> Reduces incoming damage significantly for one turn.</li>
                                <li><span className="text-slate-200 font-bold">FLEE:</span> A D20 roll to escape combat. Fails often against high-level foes.</li>
                            </ul>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                             <strong className="text-white block border-b border-slate-700 pb-1 mb-2">Stats</strong>
                             <ul className="space-y-2 text-slate-400">
                                <li className="flex justify-between"><span><HeartIcon className="h-3 w-3 inline text-red-500 mr-1"/> HP</span> <span>Health. If it hits 0, you wake up (Game Over).</span></li>
                                <li className="flex justify-between"><span><BoltIcon className="h-3 w-3 inline text-amber-500 mr-1"/> ATK</span> <span>Physical power. Increases damage dealt.</span></li>
                                <li className="flex justify-between"><span><ShieldCheckIcon className="h-3 w-3 inline text-blue-500 mr-1"/> DEF</span> <span>Physical resilience. Reduces damage taken.</span></li>
                             </ul>
                        </div>
                    </div>
                </section>

                {/* Items & Exploration */}
                <section>
                    <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center"><MapIcon className="h-5 w-5 mr-2"/> The World</h3>
                    <div className="space-y-3 text-sm text-slate-400">
                         <p>
                             The world is divided into a grid. As you move, new cells are generated.
                             <span className="text-green-400 ml-1">Wilderness</span> is common. 
                             <span className="text-blue-400 ml-1">Towns</span> are safe havens with merchants. 
                             <span className="text-purple-400 ml-1">Dungeons</span> are dangerous but hold rare loot.
                         </p>
                         <div className="flex gap-4 mt-2">
                             <div className="flex-1 bg-slate-950 p-3 rounded border border-slate-800">
                                 <strong className="text-amber-200 flex items-center mb-1"><BeakerIcon className="h-4 w-4 mr-1"/> Items</strong>
                                 <p>Found in chests or dropped by enemies. Open your inventory to <strong className="text-white">USE</strong> them.</p>
                                 <ul className="list-disc list-inside mt-1 text-xs">
                                     <li>Weapons automatically equip when used.</li>
                                     <li>Armor automatically equips when used.</li>
                                     <li>Potions restore HP immediately.</li>
                                 </ul>
                             </div>
                             <div className="flex-1 bg-slate-950 p-3 rounded border border-slate-800">
                                 <strong className="text-purple-200 flex items-center mb-1"><MapIcon className="h-4 w-4 mr-1"/> Encyclopedia</strong>
                                 <p>The game tracks every unique item and enemy you discover. Check the sidebar to see details about the entities you have encountered.</p>
                             </div>
                         </div>
                    </div>
                </section>
                
                {/* Downloads Button */}
                <div className="pt-6 border-t border-slate-800 flex justify-center gap-4">
                    <button 
                        onClick={handleDownloadQuestLog}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-500 hover:text-amber-400 rounded text-sm transition-colors border border-slate-700"
                    >
                        <DocumentTextIcon className="h-4 w-4"/>
                        Download Quest Log
                    </button>
                    <button 
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-sm transition-colors border border-slate-700"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4"/>
                        Download Sysadmin Report
                    </button>
                </div>

                <div className="text-center text-xs text-slate-600 italic mt-8">
                    "The dream is only as real as you make it."
                </div>
            </div>
        </div>
    </div>
  );
};

export default HelpModal;