import { AIResponse, EncyclopediaEntry, GameState, Gender, ItemActionResponse, MapCell, QuestOutcomeResponse } from '../../types';
import { ClassTemplate } from '../classes';
import { KEY_PLOT_QUESTIONS, LITE_MODEL, PRIMARY_MODEL, SYSTEM_INSTRUCTION, cleanJson, generateContentWithRetry, safeGenerate } from './config';
import { generateLootItem, generateQuest } from './generators';
import { actionResolutionSchema, itemActionSchema, movementNarrativeSchema, questOutcomeSchema } from './schemas';

// --- ACTION HANDLERS ---

export const startNewGame = async (name: string, gender: Gender, charClass: ClassTemplate): Promise<AIResponse> => {
    return safeGenerate("startNewGame", async () => {
        const prompt = `Start game. Name: ${name}, Gender: ${gender}. Class: ${charClass.name} (${charClass.description}). Loc: 0,0. Include initial narrative relevant to class.`;
        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: actionResolutionSchema }
        });
        
        const data = JSON.parse(cleanJson(response.text));
        
        return {
            narrative: data.narrative,
            locationName: data.locationName,
            suggestedAction: data.suggestedAction,
            updates: {
                hpUpdates: data.hpChangePlayer ? [{ charId: 'player', change: data.hpChangePlayer }] : [],
                newItems: [],
                newQuests: [],
                completedQuestIds: [],
                isCombat: false,
                removedItems: []
            }
        };
    }, {
        narrative: "You awaken in a silent void. The dream seems fragile, as if the connection to the world is weak. (Offline/Glitch Mode Active)",
        locationName: "Silent Void",
        suggestedAction: "Wait for clarity",
        updates: {
            hpUpdates: [],
            newItems: [],
            newQuests: [],
            completedQuestIds: [],
            isCombat: false,
            removedItems: []
        }
    });
};

export const narrateMovement = async (cell: MapCell, history: string[] = []): Promise<{narrative: string, suggestedAction: string}> => {
    return safeGenerate("narrateMovement", async () => {
        const context = history.slice(-5).join(" ");
        const prompt = `
        Context: ${context}
        
        Arrived at ${cell.name}. Desc: ${cell.description}. Type: ${cell.type}.
        Write a short narrative segment describing the arrival, connecting to recent events if relevant.
        `;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: movementNarrativeSchema }
        });
        return JSON.parse(cleanJson(response.text));
    }, {
        narrative: `You step into ${cell.name}. The environment flickers.`,
        suggestedAction: "Look around"
    });
};

export const narrateInteraction = async (actionText: string, contextHistory: string[]): Promise<string> => {
    return safeGenerate("narrateInteraction", async () => {
        const context = contextHistory.slice(-5).join(" ");
        const prompt = `
        Context: ${context}
        
        Narrate this action outcome: "${actionText}". 
        Keep it brief and atmospheric.
        `;
        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text;
    }, actionText);
};

export const resolveFreeformAction = async (action: string, currentState: GameState): Promise<AIResponse & { generatedItems?: EncyclopediaEntry[] }> => {
    return safeGenerate<AIResponse & { generatedItems?: EncyclopediaEntry[] }>("resolveFreeformAction", async () => {
        const context = currentState.history.slice(-5).join(" ");
        const prompt = `
        Context: ${context}
        
        Loc: ${currentState.worldMap[`${currentState.playerPos.x},${currentState.playerPos.y}`]?.name}. 
        Action: "${action}". 
        Resolve the action.
        If the player finds loot, set lootFound=true.
        If a new quest should be triggered, set newQuestTriggered=true.
        If the action is a persuasion/recruitment attempt and logically succeeds, set recruitTriggered=true.
        Return JSON.
        `;
        
        // 1. Primary resolution call (Lightweight)
        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: actionResolutionSchema }
        });
        
        const data = JSON.parse(cleanJson(response.text));
        
        const generatedItems: EncyclopediaEntry[] = [];
        const newItems: string[] = [];
        const newQuests: any[] = [];
        const removedItems: string[] = [];
        const completedQuestIds: string[] = [];
        
        // 2. Chained Calls (Only if needed)
        
        if (data.lootFound) {
            try {
                const lootItem = await generateLootItem();
                generatedItems.push(lootItem);
                newItems.push(lootItem.name);
            } catch (e) {
                console.error("Failed to generate chained loot", e);
            }
        }

        if (data.newQuestTriggered) {
            try {
                const quest = await generateQuest(data.narrative);
                newQuests.push(quest);
            } catch (e) {
                console.error("Failed to generate chained quest", e);
            }
        }

        if (data.questCompletedId) {
            completedQuestIds.push(data.questCompletedId);
        }
        
        if (data.removedItem) {
            removedItems.push(data.removedItem);
        }

        return {
            narrative: data.narrative,
            locationName: data.locationName,
            suggestedAction: data.suggestedAction,
            generatedItems,
            recruitTriggered: data.recruitTriggered,
            recruitName: data.recruitName,
            updates: {
                hpUpdates: data.hpChangePlayer ? [{ charId: 'player', change: data.hpChangePlayer }] : [],
                newItems,
                removedItems,
                newQuests,
                completedQuestIds,
                isCombat: data.isCombat
            }
        };

    }, {
        narrative: "You try to act, but the dream resists your influence. (AI Connection Unstable)",
        updates: {
            hpUpdates: [],
            newItems: [],
            removedItems: [],
            newQuests: [],
            completedQuestIds: [],
            isCombat: false
        },
        generatedItems: []
    });
};

export const identifyItemAction = async (item: string, context?: string): Promise<ItemActionResponse> => {
    return safeGenerate("identifyItemAction", async () => {
        const prompt = `Use item: "${item}". Context: ${context || 'None'}. Determine stats/effect. If the item is designed to capture entities (e.g. Spiritbinder) and context involves combat, return type 'CAPTURE'. If it grants XP/Knowledge (like a Tome), return type 'CONSUMABLE' and set xpChange > 0. Standard healing items (potions, food) should ONLY restore HP (hpChange > 0) and NOT grant XP.`;
        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: itemActionSchema }
        });
        return JSON.parse(cleanJson(response.text));
    }, {
        type: 'FLAVOR',
        narrative: `You use the ${item}, but nothing happens. The object feels insubstantial.`
    });
};

export const generateCombatNarrative = async (logs: string[]): Promise<string> => {
    return safeGenerate("generateCombatNarrative", async () => {
        const prompt = `
        Summarize combat log:
        ${logs.join('\n')}
        
        Create a 2-sentence exciting narrative summary.
        `;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text;
    }, "The battle rages on, a blur of motion and steel.");
};

export const resolveQuestOutcome = async (questTitle: string, action: string, outcome: 'SUCCESS' | 'FAILURE', history: string[]): Promise<QuestOutcomeResponse> => {
    return safeGenerate("resolveQuestOutcome", async () => {
        const prompt = `
        Quest: ${questTitle}
        Action: ${action}
        Outcome: ${outcome}
        Context: ${history.slice(-3).join(" ")}
        
        Write a short narrative (2 sentences). If failure, suggest mild damage (1-5).
        `;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: questOutcomeSchema }
        });
        return JSON.parse(cleanJson(response.text));
    }, {
        narrative: outcome === 'SUCCESS' ? "You succeed against all odds." : "You fail, and the backlash hurts.",
        damage: outcome === 'FAILURE' ? 2 : 0
    });
};

export const generateEnding = async (history: string[]): Promise<string> => {
    return safeGenerate("generateEnding", async () => {
        const context = history.slice(-20).join(" ");
        const prompt = `
        Context: ${context}
        Key Questions: ${KEY_PLOT_QUESTIONS}
        
        Write the ENDING of this story. Reveal the truth about the dream world.
        Was it a coma? A simulation? Purgatory?
        Make it emotional and final. (Max 300 words).
        `;
        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            // Re-using movementNarrativeSchema which contains { narrative: string }
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: movementNarrativeSchema }
        });
        const data = JSON.parse(cleanJson(response.text));
        return data.narrative;
    }, "The dream fades, and you wake up... or do you?");
};