import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';
import { useCore } from './useCore';
import { useCombat } from './useCombat';
import { useExploration } from './useExploration';
import { useInventory } from './useInventory';
import { ActionContext } from './types';
import { addSysadminLog } from '../services/ai/config';

export const useGameLogic = (state: GameState, setState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const [loading, setLoading] = useState(false);
  const [narrativeLog, setNarrativeLog] = useState<{ text: string, type: 'story' | 'action' | 'combat' }[]>([]);
  const activeRequestId = useRef(0);

  // Init Log
  useEffect(() => {
    if (narrativeLog.length === 0 && state.history.length > 0) {
       setNarrativeLog(state.history.map(text => ({ text, type: 'story' })));
    }
  }, []);

  useEffect(() => {
    if (narrativeLog.length > state.history.length) {
       const newHistory = narrativeLog.map(l => l.text);
       setState(prev => ({ ...prev, history: newHistory }));
    }
  }, [narrativeLog, state.history.length, setState]);

  const addToLog = (text: string, type: 'story' | 'action' | 'combat') => {
    setNarrativeLog(prev => [...prev, { text, type }]);
  };

  const cancelAction = () => {
      if (loading) {
          activeRequestId.current += 1;
          setLoading(false);
          addToLog("...Action cancelled.", 'action');
          addSysadminLog('ACTION', { message: '...Action cancelled.' });
      }
  };

  const context: ActionContext = {
      state,
      setState,
      loading,
      setLoading,
      addToLog,
      activeRequestId
  };

  // Initialize sub-hooks
  const core = useCore(context);
  const combat = useCombat(context, core);
  const exploration = useExploration(context, core);
  const inventory = useInventory(context, core);

  return {
    loading,
    narrativeLog,
    cancelAction,
    
    // Core (exposed if needed, but mostly internal to other hooks)
    finalizeRecruit: core.finalizeRecruit,
    cancelRecruit: core.cancelRecruit,

    // Exploration
    handleMove: exploration.handleMove,
    handleFreeformAction: exploration.handleFreeformAction,
    handleSpecialInteraction: exploration.handleSpecialInteraction,
    handleAbandonQuest: exploration.handleAbandonQuest,
    handleQuestFocus: exploration.handleQuestFocus,

    // Combat
    handleCombatAction: combat.handleCombatAction,
    handleUseSkill: combat.handleUseSkill,

    // Inventory
    handleUseItem: inventory.handleUseItem,
    handleEquipItem: inventory.handleEquipItem,
    handleShopTransaction: inventory.handleShopTransaction,
    handleAppraiseItem: inventory.handleAppraiseItem,
  };
};