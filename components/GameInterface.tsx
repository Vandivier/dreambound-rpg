import React, { useState } from 'react';
import { GameState, GameStatus, Character, EncyclopediaEntry, SpecialAction } from '../types';
import { getPosKey, getDeterministicActions, getItemType } from '../services/gameLogic';
import { useGameLogic } from '../hooks/useGameLogic';
import { MapIcon, QuestionMarkCircleIcon, CheckCircleIcon, Bars3Icon } from '@heroicons/react/24/solid';

// Subcomponents
import NarrativeLog from './game/NarrativeLog';
import ControlPanel from './game/ControlPanel';
import Sidebar from './game/Sidebar';
import LocationInfo from './game/LocationInfo';
import WorldMapModal from './game/modals/WorldMapModal';
import InventoryModal from './game/modals/InventoryModal';
import SpecialActionsModal from './game/modals/SpecialActionsModal';
import CharacterDetailModal from './game/modals/CharacterDetailModal';
import HelpModal from './game/modals/HelpModal';
import JournalModal from './game/modals/JournalModal';
import ShopModal from './game/modals/ShopModal';
import PartySelectModal from './game/modals/PartySelectModal';
import MobileMenuModal from './game/modals/MobileMenuModal';
import SkillModal from './game/modals/SkillModal';
import AppraisalModal from './game/modals/AppraisalModal';
import RecruitModal from './game/modals/RecruitModal';

interface GameInterfaceProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onSave: () => void;
  onMainMenu: () => void;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ state, setState, onSave, onMainMenu }) => {
  const {
    loading,
    narrativeLog,
    handleMove,
    handleFreeformAction,
    handleSpecialInteraction,
    handleUseItem,
    handleEquipItem,
    handleShopTransaction,
    handleCombatAction,
    handleAbandonQuest,
    handleQuestFocus,
    handleUseSkill,
    handleAppraiseItem,
    finalizeRecruit,
    cancelRecruit,
    cancelAction
  } = useGameLogic(state, setState);

  // UI State
  const [customInput, setCustomInput] = useState('');
  const [activeModal, setActiveModal] = useState<'NONE' | 'MAP' | 'INVENTORY' | 'HELP' | 'SPECIAL' | 'DETAIL' | 'JOURNAL' | 'SHOP' | 'PARTY_SELECT' | 'MOBILE_MENU' | 'SKILLS' | 'APPRAISAL'>('NONE');
  const [viewEntry, setViewEntry] = useState<EncyclopediaEntry | Character | null>(null);
  const [specialActions, setSpecialActions] = useState<SpecialAction[]>([]);
  
  // Staging for equipment selection
  const [pendingEquipItem, setPendingEquipItem] = useState<string | null>(null);

  // Save feedback state
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveClick = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleOpenSpecialMenu = () => {
    const cell = state.worldMap[getPosKey(state.playerPos.x, state.playerPos.y)];
    setSpecialActions(cell ? getDeterministicActions(cell) : []);
    setActiveModal('SPECIAL');
  };

  const handleCustomAction = (text: string) => {
    handleFreeformAction(text);
    setActiveModal('NONE');
    setCustomInput('');
  };

  const onInventoryUse = (item: string) => {
      // Pass encyclopedia for correct type resolution
      const type = getItemType(item, state.encyclopedia);
      const isEquip = type === 'WEAPON' || type === 'ARMOR';
      
      if (isEquip) {
          if (state.party.length > 1) {
              setPendingEquipItem(item);
              setActiveModal('PARTY_SELECT');
          } else {
              handleEquipItem(item, state.player.id);
              setActiveModal('NONE');
          }
      } else {
          handleUseItem(item); 
          setActiveModal('NONE');
      }
  };

  const currentCell = state.worldMap[getPosKey(state.playerPos.x, state.playerPos.y)];
  // Use biome or name as the seed for visual context since visualCue is removed from map cells
  const visualSeed = currentCell?.biome || currentCell?.name || (state.status === GameStatus.COMBAT ? "combat nightmare" : "void");
  const bgUrl = `https://picsum.photos/seed/${visualSeed.replace(/\s/g, '')}/1024/768`;

  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-1000" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

      {/* MODALS */}
      {state.pendingRecruit && (
          <RecruitModal 
             recruit={state.pendingRecruit}
             onConfirm={finalizeRecruit}
             onCancel={cancelRecruit}
             loading={loading}
          />
      )}

      {activeModal === 'MAP' && (
          <WorldMapModal worldMap={state.worldMap} playerPos={state.playerPos} onClose={() => setActiveModal('NONE')} />
      )}
      {activeModal === 'INVENTORY' && (
          <InventoryModal 
            inventory={state.inventory} 
            encyclopedia={state.encyclopedia}
            loading={loading} 
            onUseItem={onInventoryUse} 
            onClose={() => setActiveModal('NONE')} 
          />
      )}
      {activeModal === 'JOURNAL' && (
          <JournalModal 
            quests={state.quests} 
            onClose={() => setActiveModal('NONE')} 
            onAbandon={handleAbandonQuest}
            onFocus={handleQuestFocus}
          />
      )}
      {activeModal === 'SKILLS' && (
          <SkillModal 
              character={state.player}
              onUseSkill={(skill) => {
                  handleUseSkill(skill);
                  setActiveModal('NONE');
              }}
              onClose={() => setActiveModal('NONE')}
          />
      )}
      {activeModal === 'SPECIAL' && (
          <SpecialActionsModal 
            actions={specialActions} 
            onAction={(action) => {
                if (action.iconType === 'SHOP') {
                    setActiveModal('SHOP');
                } else if (action.iconType === 'APPRAISE') {
                    setActiveModal('APPRAISAL');
                } else {
                    handleSpecialInteraction(action);
                    setActiveModal('NONE');
                }
            }} 
            onClose={() => setActiveModal('NONE')} 
          />
      )}
      {activeModal === 'SHOP' && (
          <ShopModal 
            gold={state.gold}
            inventory={state.inventory}
            onBuy={(item, price) => handleShopTransaction('BUY', item, price)}
            onSell={(item, price) => handleShopTransaction('SELL', item, price)}
            onClose={() => setActiveModal('NONE')}
          />
      )}
      {activeModal === 'APPRAISAL' && (
          <AppraisalModal 
              gold={state.gold}
              inventory={state.inventory}
              encyclopedia={state.encyclopedia}
              loading={loading}
              onAppraise={handleAppraiseItem}
              onClose={() => setActiveModal('NONE')}
          />
      )}
      {activeModal === 'PARTY_SELECT' && (
          <PartySelectModal
             party={state.party}
             title={pendingEquipItem ? "Equip on who?" : "Select Character"}
             onSelect={(charId) => {
                 if (pendingEquipItem) {
                     handleEquipItem(pendingEquipItem, charId);
                     setPendingEquipItem(null);
                     setActiveModal('NONE');
                 } else {
                     // Detail View context
                     const char = state.party.find(c => c.id === charId);
                     if (char) setViewEntry(char);
                     setActiveModal('DETAIL');
                 }
             }}
             onClose={() => {
                 setPendingEquipItem(null);
                 setActiveModal('NONE');
             }}
          />
      )}
      {activeModal === 'HELP' && (
          <HelpModal onClose={() => setActiveModal('NONE')} history={state.history} />
      )}
      {activeModal === 'DETAIL' && viewEntry && (
          <CharacterDetailModal entry={viewEntry} onClose={() => { setViewEntry(null); setActiveModal('NONE'); }} />
      )}
      {activeModal === 'MOBILE_MENU' && (
          <MobileMenuModal 
             party={state.party}
             encyclopedia={state.encyclopedia}
             onViewEntry={(entry) => { setViewEntry(entry); setActiveModal('DETAIL'); }}
             onClose={() => setActiveModal('NONE')}
             onOpenInventory={() => setActiveModal('INVENTORY')}
             onOpenJournal={() => setActiveModal('JOURNAL')}
          />
      )}

      {/* Sidebar (Desktop) */}
      <Sidebar 
         party={state.party}
         encyclopedia={state.encyclopedia}
         onViewEntry={(entry) => { setViewEntry(entry); setActiveModal('DETAIL'); }}
         onOpenInventory={() => setActiveModal('INVENTORY')}
         onOpenJournal={() => setActiveModal('JOURNAL')}
         className="hidden md:flex flex-col w-80 bg-slate-900/90 border-r border-slate-700 p-4 overflow-y-auto relative z-10"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative z-10 p-2 md:p-4 overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex justify-between items-start mb-2 md:mb-4 shrink-0 bg-slate-900/60 p-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center flex-1 min-w-0">
                   <LocationInfo 
                        cell={currentCell} 
                        status={state.status} 
                        turnCount={state.turnCount} 
                        playerPos={state.playerPos} 
                        gold={state.gold}
                   />
              </div>
              
              <div className="flex gap-1 md:gap-2 shrink-0">
                   <button onClick={() => setActiveModal('MAP')} className="p-1.5 md:p-2 bg-slate-800 rounded hover:bg-slate-700 text-amber-500" title="Map">
                       <MapIcon className="h-5 w-5 md:h-6 md:w-6"/>
                   </button>
                   <button onClick={() => setActiveModal('HELP')} className="p-1.5 md:p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400" title="Help">
                       <QuestionMarkCircleIcon className="h-5 w-5 md:h-6 md:w-6"/>
                   </button>
                   <button onClick={handleSaveClick} className="p-1.5 md:p-2 bg-slate-800 rounded hover:bg-slate-700 text-green-500" title="Save Game">
                       {isSaved ? <CheckCircleIcon className="h-5 w-5 md:h-6 md:w-6"/> : <span className="font-bold text-[10px] md:text-xs h-5 md:h-6 flex items-center">SAVE</span>}
                   </button>
                   <button onClick={() => setActiveModal('MOBILE_MENU')} className="md:hidden p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-white">
                       <Bars3Icon className="h-5 w-5"/>
                   </button>
                   <button onClick={onMainMenu} className="hidden md:block p-2 bg-slate-800 rounded hover:bg-slate-700 text-red-400 text-xs font-bold uppercase" title="Exit">
                       Exit
                   </button>
              </div>
          </div>

          {/* Log */}
          <NarrativeLog logs={narrativeLog} loading={loading} onCancel={cancelAction} />

          {/* Controls */}
          <div className="shrink-0">
             <ControlPanel 
                loading={loading}
                combatActive={state.status === GameStatus.COMBAT}
                activeEnemy={state.combat?.activeEnemies[0]}
                currentSuggestion={state.currentSuggestion}
                customInput={customInput}
                setCustomInput={setCustomInput}
                onMove={handleMove}
                onAction={handleCustomAction}
                onCombatAction={handleCombatAction}
                onOpenSpecial={handleOpenSpecialMenu}
                onOpenInventory={() => setActiveModal('INVENTORY')}
                onOpenSkills={() => setActiveModal('SKILLS')}
             />
          </div>
      </div>
    </div>
  );
};

export default GameInterface;