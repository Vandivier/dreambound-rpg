import { GameState, GameStatus, AIResponse, EncyclopediaEntry, Skill } from '../types';
import { generateEnemy, generateEnding, generateCompanion } from '../services/geminiService';
import { shouldGenerateNewEnemy, getRandomKnownEnemy, getXpForNextLevel, D6, getMaxPartySize } from '../services/gameLogic';
import { getRandomClassSkill } from '../services/skills';
import { ActionContext, CoreActions } from './types';
import { LEVEL_CAP } from '../constants';

export const useCore = (ctx: ActionContext): CoreActions => {
  const { state, setState, addToLog, setLoading, activeRequestId } = ctx;

  const triggerEndingSequence = async (currentState: GameState) => {
       addToLog("The fabric of the dream begins to tear... (Destiny Fulfilled)", 'story');
       setLoading(true);
       const reqId = ++activeRequestId.current;
       try {
          const currentHistory = [...currentState.history];
          const endingText = await generateEnding(currentHistory);
          if (activeRequestId.current !== reqId) return;
          addToLog(endingText, 'story');
          setState(prev => ({ ...prev, status: GameStatus.ENDING, currentSuggestion: { text: "Game Over" } }));
       } catch(e) {
           console.error(e);
       } finally {
           if (activeRequestId.current === reqId) setLoading(false);
       }
  };

  const awardXpToParty = (currentParty: any[], amount: number) => {
      return currentParty.map(char => {
          let c = { ...char };
          if (!c.xp) c.xp = 0;
          c.xp += amount;

          let req = getXpForNextLevel(c.level);
          while (c.xp >= req) {
              c.xp -= req;
              c.level += 1;
              c.maxHp += 5;
              c.hp = c.maxHp;
              c.maxEp = (c.maxEp || 10) + 2;
              c.ep = c.maxEp;
              c.atk += 1;
              if (c.level % 2 === 0) c.def += 1;
              
              addToLog(`${c.name} reached Level ${c.level}!`, 'story');
              
              if (D6() === 6) {
                  const newSkill = getRandomClassSkill(c.class, c.skills || []);
                  if (newSkill) {
                      if (!c.skills) c.skills = [];
                      c.skills.push(newSkill);
                      addToLog(`${c.name} learned ${newSkill.name}!`, 'action');
                  }
              }

              req = getXpForNextLevel(c.level);
          }
          return c;
      });
  };

  const updateIntuitionQuests = (current: GameState, eventType: string, val?: any) => {
    let updatedQuests = [...current.quests];
    let completed: string[] = [];

    updatedQuests = updatedQuests.map(q => {
        if (q.status !== 'ACTIVE' || q.type !== 'INTUITION') return q;

        let newProgress = q.progress || 0;
        let didComplete = false;

        if (eventType === 'EXPLORE' && q.criteria === 'EXPLORE') {
            newProgress += 1; 
        } else if (eventType === 'FIND_TOWN' && q.criteria === 'FIND_TOWN') {
            if (val === 'TOWN') newProgress = 1;
        } else if (eventType === 'COMBAT_WIN' && q.criteria === 'COMBAT') {
            newProgress += 1;
        } else if (eventType === 'RECRUIT' && q.criteria === 'RECRUIT') {
            newProgress = current.party.length;
        } else if (eventType === 'FIND_QUEST' && q.criteria === 'FIND_QUEST') {
            newProgress += 1;
        }

        if (q.target && newProgress >= q.target) {
            didComplete = true;
            completed.push(q.title);
            return { ...q, progress: newProgress, status: 'COMPLETED' as const };
        }
        return { ...q, progress: newProgress };
    });

    if (completed.length > 0) {
        let goldBonus = 0;
        let xpBonus = 0;
        let itemBonus: string[] = [];

        updatedQuests.forEach(q => {
             if (completed.includes(q.title)) {
                 if (q.rewards.gold) goldBonus += q.rewards.gold;
                 if (q.rewards.xp) xpBonus += q.rewards.xp;
                 if (q.rewards.items) itemBonus.push(...q.rewards.items);
                 addToLog(`Intuition fulfilled: ${q.title}!`, 'story');
             }
        });
        
        current.gold += goldBonus;
        current.inventory.push(...itemBonus);
        
        if (xpBonus > 0) {
            current.party = awardXpToParty(current.party, xpBonus);
            const p = current.party.find(c => c.isPlayer);
            if (p) current.player = p;
        }
    }
    
    return updatedQuests;
  };

  const handleAIResponseUpdates = async (response: AIResponse & { generatedItems?: EncyclopediaEntry[] }, isCombatTrigger: boolean, originId?: string) => {
    const updates = response.updates || {};
    let newState = { ...state };
    newState.turnCount = (newState.turnCount || 0) + 1;

    let majorQuestCompleted = false;
    let newQuestFound = false;

    if (updates.hpUpdates) {
        newState.party = newState.party.map(p => {
            const up = updates.hpUpdates.find((u: any) => u.charId === p.id);
            return up ? { ...p, hp: Math.floor(Math.min(p.maxHp, Math.max(0, p.hp + up.change))) } : p;
        });
    }

    if (updates.newItems) {
        newState.inventory = [...newState.inventory, ...updates.newItems];
        if (response.generatedItems && response.generatedItems.length > 0) {
            const newEntries = response.generatedItems.filter(i => !newState.encyclopedia.find(e => e.name === i.name));
            newState.encyclopedia = [...newState.encyclopedia, ...newEntries];
        }
        updates.newItems.forEach((itemName: string) => {
             const exists = newState.encyclopedia.find(e => e.name === itemName);
             if (!exists) {
                 const generated = response.generatedItems?.find(g => g.name === itemName);
                 if (!generated) {
                    newState.encyclopedia.push({
                        id: `item_auto_${Date.now()}_${Math.random()}`,
                        name: itemName,
                        type: 'ITEM',
                        rarity: 'COMMON',
                        description: 'A discovered item.',
                    });
                 }
             }
        });
    }

    if (updates.newQuests && updates.newQuests.length > 0) {
        const uniqueNewQuests = updates.newQuests.filter((nq: any) => !newState.quests.find(eq => eq.id === nq.id));
        
        if (uniqueNewQuests.length > 0) {
            const sanitizedQuests = uniqueNewQuests.map((q: any) => {
                const typeRoll = Math.floor(Math.random() * 6) + 1;
                const questType = typeRoll === 6 ? 'MAJOR' : 'MINOR';

                return {
                    ...q,
                    id: q.id || `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: 'ACTIVE', 
                    type: questType
                };
            });

            newState.quests = [...newState.quests, ...sanitizedQuests];
            newQuestFound = true;
            sanitizedQuests.forEach((q: any) => {
                addToLog(`New Quest Received: ${q.title}`, 'story');
            });

            const newestQuest = sanitizedQuests[sanitizedQuests.length - 1];
            if (newestQuest) {
                let suggestionText = `Attempt to advance ${newestQuest.title}`;
                if (newestQuest.criteria) {
                    switch (newestQuest.criteria) {
                        case 'EXPLORE': suggestionText = "Visit unique locations"; break;
                        case 'FIND_TOWN': suggestionText = "Search for a Town"; break;
                        case 'COMBAT': suggestionText = "Find an enemy to fight"; break;
                        default: suggestionText = `Advance ${newestQuest.title}`;
                    }
                }
                newState.currentSuggestion = {
                    text: suggestionText,
                    questId: newestQuest.id
                };
                addToLog(`Auto-tracking: ${newestQuest.title}`, 'action');
            }
        }
    }

    if (updates.completedQuestIds && updates.completedQuestIds.length > 0) {
        const completedIds = updates.completedQuestIds as string[];
        const completedMajor = newState.quests.find(q => completedIds.includes(q.id) && q.type === 'MAJOR');
        if (completedMajor) majorQuestCompleted = true;

        newState.quests = newState.quests.map(q => {
            if (completedIds.includes(q.id) && q.status !== 'COMPLETED') {
                if (q.rewards) {
                     if (q.rewards.gold) newState.gold += q.rewards.gold;
                     if (q.rewards.items) newState.inventory.push(...q.rewards.items);
                     if (q.rewards.xp) {
                         newState.party = awardXpToParty(newState.party, q.rewards.xp);
                         const p = newState.party.find(c => c.isPlayer);
                         if (p) newState.player = p;
                     }
                }
                return { ...q, status: 'COMPLETED' };
            }
            return q;
        });

        completedIds.forEach(id => {
            const q = state.quests.find(qx => qx.id === id);
            if(q) addToLog(`Quest Completed: ${q.title}`, 'story');
        });
    }

    if (updates.removedItems) newState.inventory = newState.inventory.filter(i => !updates.removedItems.includes(i));
    
    // RECRUITMENT HANDLING
    if (response.recruitTriggered) {
        const recruitName = response.recruitName || "Mysterious Wanderer";
        const maxPartySize = getMaxPartySize(newState.player.level);
        
        // Uniqueness check: If the character originated from a map object, prevent recruiting again
        const isDuplicate = originId && newState.party.some(p => p.originId === originId);

        if (isDuplicate) {
             addToLog(`${recruitName} is already in your party.`, 'action');
        } else if (newState.party.length >= maxPartySize) {
             addToLog(`${recruitName} is willing to join, but your connection to the dream is too weak to sustain another bond. (Max Party: ${maxPartySize})`, 'action');
             addToLog(`Reach Level ${Math.pow(newState.party.length, 2)} to recruit more allies.`, 'action');
        } else {
             // Instead of adding immediately, set pending recruit state
             addToLog(`${recruitName} offers to join your party.`, 'story');
             newState.pendingRecruit = {
                 name: recruitName,
                 level: newState.player.level,
                 originId: originId
             };
        }
    }

    if (!newQuestFound && response.suggestedAction) {
        const activeQuestId = state.currentSuggestion?.questId;
        const relatedQuest = activeQuestId ? newState.quests.find(q => q.id === activeQuestId) : null;
        
        if (relatedQuest && relatedQuest.status === 'ACTIVE') {
            // Keep existing recommendation
            newState.currentSuggestion = state.currentSuggestion;
        } else {
            // Use AI suggestion
            newState.currentSuggestion = { text: response.suggestedAction };
        }
    }

    if (response.locationName) newState.worldMap[`${newState.playerPos.x},${newState.playerPos.y}`].name = response.locationName;

    if (newQuestFound) newState.quests = updateIntuitionQuests(newState, 'FIND_QUEST');

    if (newState.player.level >= LEVEL_CAP && newState.status !== GameStatus.ENDING) {
         await triggerEndingSequence(newState);
         return;
    }

    if (majorQuestCompleted) {
        const roll = D6();
        if (roll === 6 && newState.status !== GameStatus.ENDING) {
             await triggerEndingSequence(newState);
             return;
        }
    }

    if (updates.isCombat || isCombatTrigger) {
         let enemy;
        if (shouldGenerateNewEnemy(state.encyclopedia as any)) {
            addToLog("An enemy approaches!", 'action');
            enemy = await generateEnemy(newState.player.level);
            if (!newState.encyclopedia.find(e => e.name === enemy.name)) {
                newState.encyclopedia.push(enemy);
            }
        } else {
            const enemies = state.encyclopedia.filter(e => e.type === 'ENEMY') as any[];
            if (enemies.length > 0) {
                 enemy = getRandomKnownEnemy(enemies);
                 addToLog(`A ${enemy.name} blocks your path!`, 'action');
            } else {
                 enemy = await generateEnemy(newState.player.level);
                 newState.encyclopedia.push(enemy);
            }
        }
        if (newState.status !== GameStatus.ENDING) {
            newState.status = GameStatus.COMBAT;
            newState.combat = { activeEnemies: [enemy], log: [], turnIndex: 0 };
        }
    }

    setState(newState);
  };

  const finalizeRecruit = async () => {
      if (!state.pendingRecruit) return;
      
      const { name, level, originId } = state.pendingRecruit;
      setLoading(true);
      const reqId = ++activeRequestId.current;

      try {
           addToLog(`${name} has joined your party!`, 'story');
           const companion = await generateCompanion(name, level, originId);
           if (activeRequestId.current !== reqId) return;

           setState(prev => {
               const newParty = [...prev.party, companion];
               const updated = updateIntuitionQuests({ ...prev, party: newParty }, 'RECRUIT');
               return {
                   ...prev,
                   party: newParty,
                   quests: updated,
                   pendingRecruit: null
               };
           });
      } catch (e) {
          console.error("Failed to finalize recruitment", e);
          addToLog(`${name} tried to join, but faded away...`, 'action');
          setState(prev => ({ ...prev, pendingRecruit: null }));
      } finally {
          if (activeRequestId.current === reqId) setLoading(false);
      }
  };

  const cancelRecruit = () => {
      addToLog(`You declined ${state.pendingRecruit?.name}'s offer.`, 'action');
      setState(prev => ({ ...prev, pendingRecruit: null }));
  };

  return {
      awardXpToParty,
      updateIntuitionQuests,
      handleAIResponseUpdates,
      triggerEndingSequence,
      finalizeRecruit,
      cancelRecruit
  };
};