import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface LogEntry {
  text: string;
  type: 'story' | 'action' | 'combat';
}

interface NarrativeLogProps {
  logs: LogEntry[];
  loading: boolean;
  onCancel?: () => void;
}

const NarrativeLog: React.FC<NarrativeLogProps> = ({ logs, loading, onCancel }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3 md:space-y-4 mb-2 md:mb-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
      {logs.map((log, idx) => (
        <div 
          key={idx} 
          className={`p-2 md:p-3 rounded-lg leading-relaxed transition-all duration-300 ${
            log.type === 'action' 
              ? 'bg-slate-800/50 text-slate-400 text-xs md:text-sm italic border-l-2 border-slate-600' 
              : log.type === 'combat'
              ? 'bg-red-900/30 text-red-200 text-sm md:text-base border-l-2 border-red-600'
              : 'bg-black/30 text-slate-200 text-sm md:text-base border-l-2 border-amber-500/50 shadow-sm'
          }`}
        >
          {log.text}
        </div>
      ))}
      {loading && (
        <div className="flex items-center gap-4">
            <div className="flex gap-2 p-3 text-amber-500/50 animate-pulse text-xs uppercase tracking-widest font-bold">
               <div className="w-1.5 h-4 bg-amber-500/50 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-4 bg-amber-500/50 rounded-full animate-bounce delay-75"></div>
               <div className="w-1.5 h-4 bg-amber-500/50 rounded-full animate-bounce delay-150"></div>
               <span className="ml-2">Dreaming...</span>
            </div>
            {onCancel && (
                <button 
                    onClick={onCancel}
                    className="p-1 px-2 text-xs bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white rounded border border-slate-700 hover:border-red-500 transition-colors flex items-center"
                >
                    <XMarkIcon className="h-3 w-3 mr-1"/> Cancel
                </button>
            )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default NarrativeLog;
