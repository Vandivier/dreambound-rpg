import { GameStatus, ItemEntry } from '../types';
import { identifyItemAction, appraiseItem } from '../services/geminiService';
import { getItemType, getMaxPartySize } from '../services/gameLogic';
import { getDeterministicStats } from '../services/items';
import { ActionContext, CoreActions } from './types';

export const useInventory = (ctx: ActionContext, core: CoreActions) => {
  const { state, setState, addToLog, setLoading, activeRequestId } = ctx;
  const { awardXpToParty, updateIntuitionQuests } = core;

  const handleEquipItem = (item: string, charId: string) => {
      const char = state.party.find(c => c.id === charId);
      if (!char) return;

      const entry = state.encyclopedia.find(e => e.name === item && e.type === 'ITEM') as ItemEntry | undefined;
      const type = getItemType(item, state.encyclopedia) as 'WEAPON' | 'ARMOR';
      
      let stats = 0;
      if (entry && entry.stats) {
          if (type === 'WEAPON' && entry.stats.atk) stats = entry.stats.atk;
          else if (type === 'ARMOR' && entry.stats.def) stats = entry.stats.def;
          else stats = getDeterministicStats(item, type);
      } else {
          stats = getDeterministicStats(item, type);
      }
      
      let newInventory = [...state.inventory];
      const itemIdx = newInventory.indexOf(item);
      if (itemIdx > -1) newInventory.splice(itemIdx, 1);

      const newParty = state.party.map(p => {
          if (p.id === charId) {
              const updatedP = { ...p, equipment: { ...p.equipment } };
              if (type === 'WEAPON') {
                  if (updatedP.equipment.weapon) newInventory.push(updatedP.equipment.weapon.name);
                  updatedP.equipment.weapon = { name: item, atkBonus: stats };
              } else {
                  if (updatedP.equipment.armor) newInventory.push(updatedP.equipment.armor.name);
                  updatedP.equipment.armor = { name: item, defBonus: stats };
              }
              return updatedP;
          }
          return p;
      });

      const updatedPlayer = newParty.find(p => p.isPlayer) || state.player;

      setState(prev => ({
          ...prev,
          party: newParty,
          inventory: newInventory,
          player: updatedPlayer
      }));

      addToLog(`${char.name} equipped ${item}.`, 'story');
  };

  const handleShopTransaction = (type: 'BUY' | 'SELL', item: string, value: number) => {
      const newState = { ...state };
      if (type === 'BUY') {
          if (newState.gold >= value) {
              newState.gold -= value;
              newState.inventory.push(item);
              addToLog(`Bought ${item} for ${value} gold.`, 'action');
          }
      } else {
          const idx = newState.inventory.indexOf(item);
          if (idx > -1) {
              newState.inventory.splice(idx, 1);
              newState.gold += value;
              addToLog(`Sold ${item} for ${value} gold.`, 'action');
          }
      }
      setState(newState);
  };

  const handleUseItem = async (item: string) => {
    setLoading(true);
    const reqId = ++activeRequestId.current;
    addToLog(`> Using ${item}...`, 'action');
    
    const context = state.status === GameStatus.COMBAT 
      ? `In combat with ${state.combat?.activeEnemies[0]?.name || 'Unknown'}`
      : 'Exploring normally.';

    try {
      const result = await identifyItemAction(item, context);
      if (activeRequestId.current !== reqId) return;

      let newState = { ...state };
      newState.inventory = newState.inventory.filter((i, idx) => newState.inventory.indexOf(item) !== idx);
      
      if (result.type === 'CONSUMABLE') {
        if (result.hpChange) {
            const p = newState.player;
            p.hp = Math.floor(Math.min(p.maxHp, Math.max(0, p.hp + result.hpChange)));
            newState.party = newState.party.map(c => c.isPlayer ? p : c);
        }
        if (result.xpChange) {
             newState.party = awardXpToParty(newState.party, result.xpChange);
             const p = newState.party.find(c => c.isPlayer);
             if (p) newState.player = p;
             addToLog(`You gained ${result.xpChange} XP.`, 'action');
        }
        addToLog(result.narrative, 'action');
      } else if (result.type === 'CAPTURE') {
        const maxPartySize = getMaxPartySize(state.player.level);
        if (state.party.length >= maxPartySize) {
            addToLog(result.narrative, 'action');
            addToLog(`But your party is full (Max ${maxPartySize}). The entity cannot be bound.`, 'action');
        } else {
            addToLog(result.narrative, 'action');
            if (state.status === GameStatus.COMBAT && state.combat?.activeEnemies[0]) {
                const captured = { ...state.combat.activeEnemies[0] };
                newState.party.push(captured);
                newState.combat.activeEnemies.shift();
                newState.quests = updateIntuitionQuests(newState, 'RECRUIT');

                if (newState.combat.activeEnemies.length === 0) {
                     newState.status = GameStatus.PLAYING;
                     newState.combat = null;
                     newState.currentSuggestion = { text: 'Check for loot' };
                }
            }
        }
      } else {
        addToLog(result.narrative, 'story');
      }
      setState(newState);
    } catch (e) {
      console.error(e);
      if (activeRequestId.current === reqId) addToLog("Nothing happened.", 'action');
    } finally {
      if (activeRequestId.current === reqId) setLoading(false);
    }
  };

  const handleAppraiseItem = async (itemName: string) => {
      if (state.gold < 10) {
          addToLog("Not enough gold (10g required).", 'action');
          return;
      }

      setLoading(true);
      const reqId = ++activeRequestId.current;
      addToLog(`> Appraising ${itemName}...`, 'action');

      try {
          const entry = await appraiseItem(itemName);
          if (activeRequestId.current !== reqId) return;

          let newState = { ...state };
          newState.gold -= 10;
          
          const existingIdx = newState.encyclopedia.findIndex(e => e.name === itemName && e.type === 'ITEM');
          if (existingIdx > -1) {
              newState.encyclopedia[existingIdx] = entry;
          } else {
              newState.encyclopedia.push(entry);
          }

          // Use fallback for logging if category is somehow missing in type check
          const catDisplay = entry.category || 'SPECIAL';

          addToLog(`Analysis Complete: ${itemName} is classified as ${catDisplay}.`, 'story');
          if (entry.stats) {
             const statsStr = [];
             if (entry.stats.atk) statsStr.push(`ATK ${entry.stats.atk}`);
             if (entry.stats.def) statsStr.push(`DEF ${entry.stats.def}`);
             if (statsStr.length) addToLog(`Stats: ${statsStr.join(', ')}`, 'action');
          }
          if (entry.category === 'CONSUMABLE' && entry.description) {
              addToLog(`Note: ${entry.description}`, 'action');
          }

          setState(newState);
      } catch(e) {
          console.error(e);
          if (activeRequestId.current === reqId) addToLog("The appraiser looks confused. (Error)", 'action');
      } finally {
          if (activeRequestId.current === reqId) setLoading(false);
      }
  };

  return { handleEquipItem, handleShopTransaction, handleUseItem, handleAppraiseItem };
};