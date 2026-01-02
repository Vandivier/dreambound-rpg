import React, { useState } from 'react';
import { MapCell } from '../../../types';
import { MapIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getPosKey } from '../../../services/gameLogic';

interface WorldMapModalProps {
  worldMap: Record<string, MapCell>;
  playerPos: { x: number, y: number };
  onClose: () => void;
}

const WorldMapModal: React.FC<WorldMapModalProps> = ({ worldMap, playerPos, onClose }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(getPosKey(playerPos.x, playerPos.y));

  const renderWorldMap = () => {
    const keys = Object.keys(worldMap);
    const xs = keys.map(k => parseInt(k.split(',')[0]));
    const ys = keys.map(k => parseInt(k.split(',')[1]));
    
    // Ensure we show at least a 5x5 grid centered on player if map is small, or bounds of explored map
    const minX = Math.min(...xs, playerPos.x - 2);
    const maxX = Math.max(...xs, playerPos.x + 2);
    const minY = Math.min(...ys, playerPos.y - 2);
    const maxY = Math.max(...ys, playerPos.y + 2);

    const grid = [];
    for (let y = maxY; y >= minY; y--) {
        const row = [];
        for (let x = minX; x <= maxX; x++) {
            const key = getPosKey(x, y);
            const cell = worldMap[key];
            const isPlayer = x === playerPos.x && y === playerPos.y;
            const isSelected = key === selectedKey;
            
            let bgClass = "bg-slate-900";
            let borderClass = "border-slate-800";
            
            if (cell) {
                if (cell.type === 'TOWN') bgClass = "bg-blue-900";
                else if (cell.type === 'DUNGEON') bgClass = "bg-purple-900";
                else bgClass = "bg-green-900";
                
                borderClass = "border-slate-700/50";
            }
            
            if (isSelected) {
                borderClass = "border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10";
            }

            row.push(
                <button 
                    key={key} 
                    onClick={() => cell && setSelectedKey(key)}
                    disabled={!cell}
                    className={`w-10 h-10 md:w-12 md:h-12 m-0.5 md:m-1 flex items-center justify-center rounded border transition-all duration-200 ${bgClass} ${borderClass} relative`}
                >
                    {isPlayer && <div className="w-3 h-3 md:w-4 md:h-4 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />}
                    {cell && !isPlayer && <span className="text-[10px] text-slate-400 opacity-50 font-bold">{cell.type[0]}</span>}
                </button>
            );
        }
        grid.push(<div key={y} className="flex justify-center">{row}</div>);
    }
    return <div className="p-4 bg-slate-950 rounded border border-slate-800 overflow-auto">{grid}</div>;
  };

  const selectedCell = selectedKey ? worldMap[selectedKey] : null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><MapIcon className="h-6 w-6 mr-2"/> World Map</h2>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            {renderWorldMap()}
            
            <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700 min-h-[120px]">
                {selectedCell ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-amber-100">{selectedCell.name}</h3>
                            <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">
                                {selectedCell.x}, {selectedCell.y}
                            </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                             <span className={`text-xs px-2 py-0.5 rounded border ${selectedCell.type === 'TOWN' ? 'bg-blue-900/40 border-blue-500 text-blue-200' : selectedCell.type === 'DUNGEON' ? 'bg-purple-900/40 border-purple-500 text-purple-200' : 'bg-green-900/40 border-green-500 text-green-200'}`}>
                                 {selectedCell.type}
                             </span>
                             {selectedCell.biome && <span className="text-xs px-2 py-0.5 rounded border bg-slate-700 border-slate-600 text-slate-300">{selectedCell.biome}</span>}
                        </div>
                        <p className="text-sm text-slate-400 italic">{selectedCell.description}</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
                        Select a location to view details.
                    </div>
                )}
            </div>
            
            <p className="text-center text-slate-600 text-xs mt-2">T = Town | D = Dungeon | W = Wilderness</p>
        </div>
    </div>
  );
};

export default WorldMapModal;