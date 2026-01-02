import { GameStatus, Skill } from '../types';
import { generateCombatNarrative, generateLootItem } from '../services/geminiService';
import { resolveCombatRound } from '../services/gameLogic';
import { ActionContext, CoreActions } from './types';
import { LEVEL_CAP } from '../constants';

export const useCombat = (ctx: ActionContext, core: CoreActions) => {
  const { state, setState, addToLog, setLoading, activeRequestId } = ctx;
  const { awardXpToParty, updateIntuitionQuests, triggerEndingSequence } = core;

  const handleCombatAction = async (action: 'ATTACK' | 'DEFEND' | 'FLEE' | 'SKILL', skill?: Skill) => {
      setLoading(true);
      const reqId = ++activeRequestId.current;

      try {
          const { newState, logs, playerWon, playerDied } = resolveCombatRound(state, action, skill);
          if (activeRequestId.current !== reqId) return;
          
          logs.forEach(l => addToLog(l, 'action'));

          if (playerDied) {
              // FORCE UPDATE: Explicitly set HP to 0 so the UI updates before the async generation finishes
              newState.player.hp = 0;
              newState.party = newState.party.map(p => p.isPlayer ? { ...p, hp: 0 } : p);
              setState(newState);
              
              const narrative = await generateCombatNarrative(logs);
              if (activeRequestId.current !== reqId) return;

              addToLog(narrative, 'combat');
              addToLog("You have died. The dream resets...", 'story');
              setState(prev => ({ ...prev, status: GameStatus.ENDING }));
          } else if (playerWon) {
              const narrative = await generateCombatNarrative(logs);
              if (activeRequestId.current !== reqId) return;

              addToLog(narrative, 'combat');
              addToLog("Victory!", 'story');
              
              let xpGained = 0;
              state.combat?.activeEnemies.forEach(e => xpGained += e.xpValue);
              
              const enemiesDefeated = state.combat?.activeEnemies || [];
              
              for (const enemy of enemiesDefeated) {
                  const goldDrop = Math.floor(Math.random() * (enemy.level * 5)) + 5;
                  newState.gold += goldDrop;
                  addToLog(`Looted ${goldDrop} gold from ${enemy.name}.`, 'action');
                  
                  if (Math.random() > 0.7) {
                      try {
                          const lootItem = await generateLootItem();
                          newState.inventory.push(lootItem.name);
                          addToLog(`Looted ${lootItem.name} from ${enemy.name}.`, 'action');
                      } catch (e) {
                          console.error("Failed to generate loot item", e);
                      }
                  }
              }

              if (xpGained > 0) {
                  addToLog(`Gained ${xpGained} XP.`, 'action');
                  newState.party = awardXpToParty(newState.party, xpGained);
                  const p = newState.party.find(c => c.isPlayer);
                  if (p) newState.player = p;
              }

              if (newState.player.level >= LEVEL_CAP && newState.status !== GameStatus.ENDING) {
                  await triggerEndingSequence(newState);
                  return;
              }

              newState.quests = updateIntuitionQuests(newState, 'COMBAT_WIN');
              setState({ ...newState, currentSuggestion: { text: "Check for loot" } });
          } else {
              setState(newState);
          }
      } catch (e) {
          console.error(e);
          if (activeRequestId.current === reqId) addToLog("Combat chaos overwhelms you...", 'action');
      } finally {
          if (activeRequestId.current === reqId) setLoading(false);
      }
  };

  const handleUseSkill = async (skill: Skill) => {
      const player = state.player;
      if (player.ep < skill.cost) {
          addToLog("Not enough energy!", 'action');
          return;
      }

      if (skill.effect === 'DAMAGE' && state.status !== GameStatus.COMBAT) {
           addToLog("There is nothing to attack here.", 'action');
           return;
      }
      
      if (state.status === GameStatus.COMBAT) {
          handleCombatAction('SKILL', skill);
          return;
      }

      // Non-Combat Skill Usage
      setLoading(true);
      const reqId = ++activeRequestId.current;
      
      let newPlayer = { ...player, ep: player.ep - skill.cost };
      let newParty = state.party.map(p => p.id === player.id ? newPlayer : p);
      let newState = { ...state, player: newPlayer, party: newParty };
      
      addToLog(`> Used ${skill.name}`, 'action');

      if (skill.effect === 'HEAL') {
          const heal = skill.power || 10;
          newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + heal);
          newParty = newParty.map(p => p.id === player.id ? newPlayer : p);
          newState = { ...newState, player: newPlayer, party: newParty };
          addToLog(`Restored ${heal} HP.`, 'action');
      }

      if (activeRequestId.current === reqId) {
          setState(newState);
          setLoading(false);
      }
  };

  return { handleCombatAction, handleUseSkill };
};