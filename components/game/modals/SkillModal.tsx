import React from 'react';
import { Character, Skill } from '../../../types';
import { BoltIcon, XMarkIcon, FireIcon, ShieldCheckIcon, EyeIcon } from '@heroicons/react/24/solid';
import Button from '../../Button';

interface SkillModalProps {
  character: Character;
  onUseSkill: (skill: Skill) => void;
  onClose: () => void;
}

const SkillModal: React.FC<SkillModalProps> = ({ character, onUseSkill, onClose }) => {
  const skills = character.skills || [];

  const getIcon = (type: string) => {
      switch(type) {
          case 'MAGIC': return <FireIcon className="h-4 w-4 text-purple-400"/>;
          case 'MELEE': return <ShieldCheckIcon className="h-4 w-4 text-red-400"/>;
          case 'RANGED': return <EyeIcon className="h-4 w-4 text-green-400"/>;
          default: return <BoltIcon className="h-4 w-4 text-amber-400"/>;
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full border border-cyan-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-cyan-500 flex items-center"><BoltIcon className="h-6 w-6 mr-2"/> Skills</h2>
                <div className="text-sm font-mono text-cyan-300">EP: {character.ep} / {character.maxEp}</div>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {skills.length === 0 ? <p className="text-slate-500 italic text-center py-4">No skills learned yet.</p> : 
                    skills.map((skill, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700 group hover:border-cyan-500 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-900 p-2 rounded border border-slate-700 shrink-0">
                                    {getIcon(skill.type)}
                                </div>
                                <div>
                                    <span className="block font-medium text-slate-200 text-sm">{skill.name}</span>
                                    <span className="text-[10px] text-slate-500 block">{skill.description}</span>
                                </div>
                            </div>
                            <Button 
                                onClick={() => onUseSkill(skill)} 
                                disabled={character.ep < skill.cost}
                                variant="secondary"
                                className={`text-xs px-3 py-1 whitespace-nowrap ${character.ep < skill.cost ? 'opacity-50' : ''}`}
                            >
                                {skill.cost} EP
                            </Button>
                        </div>
                    ))
                }
            </div>
        </div>
    </div>
  );
};

export default SkillModal;
