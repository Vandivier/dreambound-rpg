import React from 'react';
import { MapCell, GameStatus } from '../../types';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

interface LocationInfoProps {
  cell?: MapCell;
  status: GameStatus;
  turnCount: number;
  playerPos: { x: number; y: number };
  gold: number;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ cell, status, turnCount, playerPos, gold }) => {
  const isCombat = status === GameStatus.COMBAT;
  
  return (
    <div className="flex flex-col min-w-0 flex-1 mr-2">
      <h2 className={`text-sm md:text-xl font-bold tracking-wider uppercase truncate ${isCombat ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
        {isCombat ? "COMBAT" : cell?.name || "Unknown"}
      </h2>
      
      {!isCombat && cell && (
        <div className="flex gap-1 md:gap-2 text-[8px] md:text-xs font-semibold text-slate-300 uppercase tracking-wide mt-0.5 md:mt-1">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-blue-400">{cell.type}</span>
            {cell.biome && <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-green-400 truncate max-w-[60px] md:max-w-none">{cell.biome}</span>}
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-xs text-slate-500 mt-1 font-mono">
        <span className="shrink-0">{playerPos.x},{playerPos.y}</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full shrink-0"></span>
        <span className="shrink-0">T {turnCount}</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full shrink-0"></span>
        <span className="flex items-center text-amber-500 shrink-0"><CurrencyDollarIcon className="h-3 w-3 mr-0.5"/> {gold}</span>
      </div>
    </div>
  );
};

export default LocationInfo;