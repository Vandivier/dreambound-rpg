import { GameStatus, SpecialAction, Quest } from '../types';
import { generateMapCell, generateEnemy, resolveFreeformAction, narrateMovement, resolveQuestOutcome, generateObjectDetails, generateLootItem } from '../services/geminiService';
import { checkForEncounter, shouldGenerateNewEnemy, getRandomKnownEnemy, getPosKey, D6, getDeterministicActions } from '../services/gameLogic';
import { ActionContext, CoreActions } from './types';
import { LEVEL_CAP } from '../constants';

export const useExploration = (ctx: ActionContext, core: CoreActions) => {
  const { state, setState, addToLog, setLoading, activeRequestId } = ctx;
  const { updateIntuitionQuests, handleAIResponseUpdates, awardXpToParty, triggerEndingSequence } = core;

  const handleMove = async (dx: number, dy: number) => {
    if (ctx.loading || state.status === GameStatus.COMBAT || state.status === GameStatus.ENDING) return;
    setLoading(true);
    const reqId = ++activeRequestId.current;

    const newX = state.playerPos.x + dx;
    const newY = state.playerPos.y + dy;
    const key = getPosKey(newX, newY);
    const direction = dx === 0 ? (dy > 0 ? 'North' : 'South') : (dx > 0 ? 'East' : 'West');
    addToLog(`> Heading ${direction}...`, 'action');
    
    const currentHistory = [...state.history, `> Heading ${direction}...`];

    try {
        let cell = state.worldMap[key];
        let isNew = false;
        
        if (!cell) {
          isNew = true;
          cell = await generateMapCell(newX, newY, state.player.level, currentHistory);
        } else {
             if (cell.objects && cell.objects.some(o => !o.id)) {
                 console.warn("Repairing map objects with missing IDs");
                 cell = {
                     ...cell,
                     objects: cell.objects.map(o => o.id ? o : { 
                         ...o, 
                         id: `obj_repair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                         contents: o.contents || (o.type === 'LOOT' ? { gold: 10, items: [], message: 'Scavenged loot.' } : undefined)
                     })
                 };
             }
        }
        
        if (activeRequestId.current !== reqId) return;

        const encounterType = checkForEncounter(state, isNew);
        const combatStart = encounterType === 'COMBAT';
        const updatedMap = { ...state.worldMap, [key]: cell };
        
        let suggestion = "Explore the area";
        let narrative = `You return to ${cell.name}.`;

        if (isNew) {
            narrative = `You arrive at ${cell.name}. ${cell.description || ""}`;
            addToLog(`Discovered: ${cell.name}`, 'story');
            addToLog(narrative, 'story');
        } else {
            addToLog(narrative, 'story');
        }
        
        let newState = {
             ...state,
             playerPos: { x: newX, y: newY },
             worldMap: updatedMap,
             currentSuggestion: { text: suggestion },
             turnCount: state.turnCount + 1
        };

        if (isNew) newState.quests = updateIntuitionQuests(newState, 'EXPLORE');
        if (cell.type === 'TOWN') newState.quests = updateIntuitionQuests(newState, 'FIND_TOWN', 'TOWN');

        setState(newState);

        if (combatStart) {
            let enemy;
            const enemies = state.encyclopedia.filter(e => e.type === 'ENEMY') as any[];
            if (shouldGenerateNewEnemy(enemies)) {
                addToLog("An enemy approaches!", 'action');
                enemy = await generateEnemy(state.player.level);
            } else {
                 if(enemies.length > 0) enemy = getRandomKnownEnemy(enemies);
                 else enemy = await generateEnemy(state.player.level);
                addToLog(`A ${enemy.name} blocks your path!`, 'action');
            }
            if (activeRequestId.current !== reqId) return;

            setState(prev => {
                const newEncy = prev.encyclopedia.find(e => e.name === enemy.name) ? prev.encyclopedia : [...prev.encyclopedia, enemy];
                return {
                    ...prev,
                    status: GameStatus.COMBAT,
                    encyclopedia: newEncy,
                    combat: { activeEnemies: [enemy], log: [], turnIndex: 0 }
                };
            });
        }
    } catch (e) {
        console.error(e);
        if (activeRequestId.current === reqId) addToLog("The dream fog is too thick. You cannot move there.", 'story');
    } finally {
        if (activeRequestId.current === reqId) setLoading(false);
    }
  };

  const handleFreeformAction = async (actionText: string, options?: { originId?: string }) => {
      if (!actionText.trim() || ctx.loading || state.status === GameStatus.COMBAT || state.status === GameStatus.ENDING) return;
      
      if (state.currentSuggestion?.questId && actionText === state.currentSuggestion.text) {
          const quest = state.quests.find(q => q.id === state.currentSuggestion.questId);
          if (quest && !quest.criteria && quest.status === 'ACTIVE') {
              setLoading(true);
              const reqId = ++activeRequestId.current;
              
              const roll = D6();
              
              if (roll === 6) {
                  addToLog(`> ${actionText}`, 'action');
                  addToLog(`(Dice Roll: 6) Critical Success!`, 'action');
                  try {
                      const res = await resolveQuestOutcome(quest.title, actionText, 'SUCCESS', state.history);
                      if (activeRequestId.current !== reqId) return;
                      addToLog(res.narrative, 'story');

                      const newState = { ...state };
                      newState.turnCount = (newState.turnCount || 0) + 1;
                      
                      let xpAwarded = 0;

                      newState.quests = newState.quests.map(q => {
                          if (q.id === quest.id) {
                             if (q.rewards) {
                                if (q.rewards.gold) newState.gold += q.rewards.gold;
                                if (q.rewards.items) newState.inventory.push(...q.rewards.items);
                                if (q.rewards.xp) xpAwarded += q.rewards.xp;
                             }
                             return { ...q, status: 'COMPLETED' as const };
                          }
                          return q;
                      });

                      if (xpAwarded > 0) {
                          newState.party = awardXpToParty(newState.party, xpAwarded);
                          const p = newState.party.find(c => c.isPlayer);
                          if (p) newState.player = p;
                          addToLog(`Quest Complete! Gained ${xpAwarded} XP.`, 'action');
                      }

                      newState.currentSuggestion = { text: 'Look around' };
                      addToLog(`Quest Completed: ${quest.title}`, 'story');
                      
                      if (newState.player.level >= LEVEL_CAP && newState.status !== GameStatus.ENDING) {
                         await triggerEndingSequence(newState);
                         return;
                      }

                      // FIX: Ensure Major Quest success can trigger End Game via Dice Roll mechanic too
                      if (quest.type === 'MAJOR' && newState.status !== GameStatus.ENDING) {
                          if (D6() === 6) {
                              await triggerEndingSequence(newState);
                              return;
                          }
                      }

                      setState(newState);
                  } catch (e) { console.error(e); }
                  finally { if (activeRequestId.current === reqId) setLoading(false); }
                  return;
              } 
              else if (roll === 2) {
                  addToLog(`> ${actionText}`, 'action');
                  addToLog(`(Dice Roll: 2) Ambush! The action attracts unwanted attention.`, 'combat');
                  
                  try {
                      const enemy = await generateEnemy(state.player.level);
                      if (activeRequestId.current !== reqId) return;
                      
                      addToLog(`A ${enemy.name} emerges from the shadows!`, 'action');
                      
                      setState(prev => {
                          const newEncy = prev.encyclopedia.find(e => e.name === enemy.name) ? prev.encyclopedia : [...prev.encyclopedia, enemy];
                          return {
                              ...prev,
                              turnCount: (prev.turnCount || 0) + 1,
                              status: GameStatus.COMBAT,
                              encyclopedia: newEncy,
                              combat: { activeEnemies: [enemy], log: [], turnIndex: 0 }
                          };
                      });
                  } catch (e) {
                      console.error("Failed to generate encounter", e);
                      addToLog("You feel watched, but nothing happens.", 'story');
                  } finally {
                      if (activeRequestId.current === reqId) setLoading(false);
                  }
                  return;
              }
              else if (roll === 1) {
                  addToLog(`> ${actionText}`, 'action');
                  addToLog(`(Dice Roll: 1) Critical Failure!`, 'action');
                  try {
                      const res = await resolveQuestOutcome(quest.title, actionText, 'FAILURE', state.history);
                      if (activeRequestId.current !== reqId) return;
                      addToLog(res.narrative, 'story');

                      const newState = { ...state };
                      newState.turnCount = (newState.turnCount || 0) + 1;
                      
                      if (res.damage && res.damage > 0) {
                          const p = newState.player;
                          p.hp = Math.floor(Math.max(0, p.hp - res.damage));
                          newState.party = newState.party.map(c => c.isPlayer ? p : c);
                          addToLog(`You took ${res.damage} damage.`, 'combat');
                          
                          if (p.hp <= 0) {
                              addToLog("The failure was fatal. You have died...", 'story');
                              newState.status = GameStatus.ENDING;
                          }
                      }

                      if (newState.status !== GameStatus.ENDING) {
                          newState.quests = newState.quests.map(q => {
                              if (q.id === quest.id) {
                                 return { ...q, status: 'FAILED' as const };
                              }
                              return q;
                          });
                          newState.currentSuggestion = { text: 'Look around' };
                          addToLog(`Quest Failed: ${quest.title}`, 'story');
                      }
                      
                      setState(newState);
                  } catch (e) { console.error(e); }
                  finally { if (activeRequestId.current === reqId) setLoading(false); }
                  return;
              }
              setLoading(false);
          }
      }

      setLoading(true);
      const reqId = ++activeRequestId.current;

      addToLog(`> ${actionText}`, 'action');

      try {
          const response = await resolveFreeformAction(actionText, state);
          if (activeRequestId.current !== reqId) return;

          addToLog(response.narrative, 'story');
          await handleAIResponseUpdates(response, false, options?.originId);
      } catch (e) {
          if (activeRequestId.current === reqId) addToLog("Your mind wanders... (Error processing action)", 'action');
      } finally {
          if (activeRequestId.current === reqId) setLoading(false);
      }
  };

  const handleSpecialInteraction = async (action: SpecialAction) => {
      const key = getPosKey(state.playerPos.x, state.playerPos.y);
      const cell = state.worldMap[key];
      
      if (!cell || !action.objectId) {
         addToLog("Error: Target not found.", 'action');
         return;
      }

      // Handle Dungeon Entry (Deterministic Quest Generation)
      if (action.action === 'ENTER_DUNGEON') {
          const questId = `dungeon_quest_${cell.x}_${cell.y}`;
          const alreadyActive = state.quests.find(q => q.id === questId);
          
          if (alreadyActive) {
              addToLog("You are already exploring this dungeon.", 'action');
              return;
          }

          const dungeonQuest: Quest = {
              id: questId,
              title: `Delve: ${cell.name}`,
              description: `Defeat 3 enemies within ${cell.name} to clear the area.`,
              type: 'INTUITION', // Use INTUITION type so combat wins auto-update progress via useCore
              status: 'ACTIVE',
              criteria: 'COMBAT',
              progress: 0,
              target: 3,
              rewards: { gold: 150, xp: 200, items: ['Ancient Relic'] }
          };

          setState(prev => ({
              ...prev,
              quests: [...prev.quests, dungeonQuest]
          }));
          
          addToLog(`Quest Accepted: ${dungeonQuest.title}`, 'story');
          addToLog("You descend into the darkness...", 'action');
          return;
      }
      
      const objIndex = cell.objects.findIndex(o => o.id === action.objectId);
      if (objIndex === -1) {
          addToLog("Object is gone.", 'action');
          return;
      }

      const obj = cell.objects[objIndex];

      // HEALER LOGIC (Deterministic)
      if (action.iconType === 'REST') {
          setState(prev => {
              const healedParty = prev.party.map(c => ({
                  ...c,
                  hp: c.maxHp,
                  ep: c.maxEp || 10
              }));
              const healedPlayer = healedParty.find(c => c.isPlayer) || prev.player;
              
              return {
                  ...prev,
                  party: healedParty,
                  player: healedPlayer,
                  turnCount: prev.turnCount + 1
              };
          });
          addToLog("You rest. The party's health and energy are fully restored.", 'story');
          return;
      }

      // LAZY LOAD: If object is not detailed, fetch details now.
      if (!obj.isDetailed) {
          setLoading(true);
          const reqId = ++activeRequestId.current;
          addToLog(`Examining ${obj.name}...`, 'action');

          try {
              const description = await generateObjectDetails(obj.name, obj.type, cell.name);
              if (activeRequestId.current !== reqId) return;

              const newObjects = cell.objects.map(o => ({...o}));
              let updatedObj = { ...obj, description, isDetailed: true };
              
              if ((updatedObj.type === 'LOOT' || updatedObj.type === 'RESOURCE') && !updatedObj.contents) {
                  if (updatedObj.type === 'LOOT') {
                       const lootItem = await generateLootItem();
                       const goldAmount = Math.floor(Math.random() * 50) + 10;
                       updatedObj.contents = {
                            items: [lootItem.name],
                            gold: goldAmount,
                            message: `You found ${lootItem.name} and ${goldAmount} gold!`
                       };
                  } else {
                       const resourceRoll = Math.floor(Math.random() * 3);
                       let item = "Strange Herb";
                       if (resourceRoll === 1) item = "Raw Ore";
                       if (resourceRoll === 2) item = "Magical Essence";
                       updatedObj.contents = {
                           items: [item],
                           message: `You gathered ${item}.`
                       };
                  }
              }

              newObjects[objIndex] = updatedObj;
              
              const isActionOpen = action.label === 'Open' || action.label === 'Harvest';
              
              if (isActionOpen && updatedObj.contents && !updatedObj.hasInteracted) {
                  updatedObj.hasInteracted = true;
                  newObjects[objIndex] = updatedObj;
                  
                  if (updatedObj.contents.message) addToLog(updatedObj.contents.message, 'action');
                  
                  let goldAdded = 0;
                  if (updatedObj.contents.gold) goldAdded = updatedObj.contents.gold;
                  
                  const itemsAdded = updatedObj.contents.items || [];
                  
                  setState(prev => ({
                      ...prev,
                      gold: prev.gold + goldAdded,
                      inventory: [...prev.inventory, ...itemsAdded],
                      worldMap: { ...prev.worldMap, [key]: { ...cell, objects: newObjects } }
                  }));
                  addToLog(description, 'story');
              } else {
                  setState(prev => ({
                      ...prev,
                      worldMap: { ...prev.worldMap, [key]: { ...cell, objects: newObjects } }
                  }));
                  addToLog(description, 'story');
              }

          } catch (e) {
              console.error(e);
              if (activeRequestId.current === reqId) addToLog("You stare at it, but gain no insight.", 'action');
          } finally {
              if (activeRequestId.current === reqId) setLoading(false);
          }
      } else {
           if ((obj.type === 'LOOT' || obj.type === 'RESOURCE') && !obj.hasInteracted) {
               // Fix for Eager Loading: Generate contents if they are missing
               const newObjects = cell.objects.map(o => ({...o}));
               let updatedObj = { ...obj, hasInteracted: true };
               
               if (!updatedObj.contents || !updatedObj.contents.items || updatedObj.contents.items.length === 0) {
                   // Generate on demand
                   if (updatedObj.type === 'LOOT') {
                        const lootItem = await generateLootItem();
                        const goldAmount = Math.floor(Math.random() * 50) + 10;
                        updatedObj.contents = {
                             items: [lootItem.name],
                             gold: goldAmount,
                             message: `You found ${lootItem.name} and ${goldAmount} gold!`
                        };
                   } else {
                        const resourceRoll = Math.floor(Math.random() * 3);
                        let item = "Strange Herb";
                        if (resourceRoll === 1) item = "Raw Ore";
                        if (resourceRoll === 2) item = "Magical Essence";
                        updatedObj.contents = {
                            items: [item],
                            message: `You gathered ${item}.`
                        };
                   }
               }
               
               newObjects[objIndex] = updatedObj;
               
               if (updatedObj.contents.message) addToLog(updatedObj.contents.message, 'action');
               
               setState(prev => ({
                   ...prev,
                   gold: prev.gold + (updatedObj.contents?.gold || 0),
                   inventory: [...prev.inventory, ...(updatedObj.contents?.items || [])],
                   worldMap: { ...prev.worldMap, [key]: { ...cell, objects: newObjects } }
               }));
           } else if (action.iconType === 'TALK' || action.iconType === 'RECRUIT') {
               // Delegate to freeform, passing the objectId for recruitment validation
               handleFreeformAction(action.action, { originId: action.objectId });
           } else {
               addToLog(obj.description || "Nothing of interest.", 'story');
           }
      }
  };

  const handleAbandonQuest = (id: string) => {
      setState(prev => ({
          ...prev,
          quests: prev.quests.map(q => q.id === id ? { ...q, status: 'FAILED' as const } : q)
      }));
      addToLog("Quest abandoned.", 'action');
  };

  const handleQuestFocus = (id: string) => {
      const quest = state.quests.find(q => q.id === id);
      if (quest) {
          let suggestionText = `Advance ${quest.title}`;
          if (quest.criteria === 'EXPLORE') suggestionText = "Visit unique locations";
          if (quest.criteria === 'FIND_TOWN') suggestionText = "Search for a Town";
          if (quest.criteria === 'COMBAT') suggestionText = "Find an enemy to fight";
          if (quest.criteria === 'RECRUIT') suggestionText = "Find a companion";
          
          setState(prev => ({
              ...prev,
              currentSuggestion: {
                  text: suggestionText,
                  questId: quest.id
              }
          }));
          addToLog(`Tracking: ${quest.title}`, 'action');
      }
  };

  return { handleMove, handleFreeformAction, handleSpecialInteraction, handleAbandonQuest, handleQuestFocus };
};