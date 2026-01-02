import { ItemEntry, HybridRollResult, MapCell, Enemy, Character } from '../../types';
import { createHybridAiD20Roll, D20 } from '../gameLogic';
import { COMMON_ITEMS, UNCOMMON_ITEMS, RARE_ITEMS } from '../items';
import { COMMON_CLASSES, UNCOMMON_CLASSES, RARE_CLASSES, ClassTemplate } from '../classes';
import { getRandomStockEnemy } from '../enemies';
import { LITE_MODEL, PRIMARY_MODEL, SYSTEM_INSTRUCTION, cleanJson, generateContentWithRetry, safeGenerate } from './config';
import { classSchema, enemySchema, itemEntrySchema, mapCellSchema, objectDetailsSchema, questGenSchema } from './schemas';

// --- ITEM GENERATION ---

const generateUniqueItem = async (rarity: 'CURSED' | 'UNCOMMON' | 'RARE', hybridContext: string): Promise<ItemEntry> => {
    return safeGenerate("generateUniqueItem", async () => {
        let flavor = "";
        if (hybridContext === 'CRITICAL_FAILURE') flavor = "This item is terribly cursed or fundamentally broken.";
        if (hybridContext === 'NEGATIVE_UNIQUE') flavor = "This item has a strange negative quirk or minor curse.";
        if (hybridContext === 'POSITIVE_UNIQUE') flavor = "This item has an interesting, beneficial quirk.";
        if (hybridContext === 'CRITICAL_SUCCESS') flavor = "This item is powerful and legendary.";

        const prompt = `Generate a ${rarity} unique RPG item. Context: ${flavor}. Name, Description.`;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: itemEntrySchema }
        });
        const data = JSON.parse(cleanJson(response.text));
        return {
            id: `item_${Date.now()}`,
            type: 'ITEM',
            name: data.name,
            description: data.description,
            rarity: rarity
        };
    }, {
        id: `item_glitch_${Date.now()}`,
        type: 'ITEM',
        name: `Glitched ${rarity} Item`,
        description: "The item flickers in and out of existence.",
        rarity: rarity
    });
};

export const generateLootItem = async (): Promise<ItemEntry> => {
    const { result } = createHybridAiD20Roll();
    let item: ItemEntry = { id: `item_${Date.now()}`, name: "Unknown Artifact", type: 'ITEM', description: "A strange object shifting in form.", rarity: "COMMON" };

    if (result === HybridRollResult.CRITICAL_FAILURE) {
        item = await generateUniqueItem('CURSED', 'CRITICAL_FAILURE');
    } 
    else if (result === HybridRollResult.NEGATIVE_UNIQUE) {
        item = await generateUniqueItem('CURSED', 'NEGATIVE_UNIQUE');
    }
    else if (result === HybridRollResult.COMMON) {
        item = { ...item, name: COMMON_ITEMS[Math.floor(Math.random() * COMMON_ITEMS.length)], rarity: 'COMMON', description: "A standard item." };
    } 
    else if (result === HybridRollResult.UNCOMMON) {
        item = { ...item, name: UNCOMMON_ITEMS[Math.floor(Math.random() * UNCOMMON_ITEMS.length)], rarity: 'UNCOMMON', description: "Good quality." };
    } 
    else if (result === HybridRollResult.RARE) {
        item = { ...item, name: RARE_ITEMS[Math.floor(Math.random() * RARE_ITEMS.length)], rarity: 'RARE', description: "A rare find." };
    } 
    else if (result === HybridRollResult.POSITIVE_UNIQUE) {
        item = await generateUniqueItem('UNCOMMON', 'POSITIVE_UNIQUE');
    } 
    else if (result === HybridRollResult.CRITICAL_SUCCESS) {
        item = await generateUniqueItem('RARE', 'CRITICAL_SUCCESS');
    }
    
    return item;
};

export const appraiseItem = async (itemName: string): Promise<ItemEntry> => {
    return safeGenerate("appraiseItem", async () => {
        const prompt = `
        Appraise the item "${itemName}".
        Identify its true nature, category, value, and properties.
        Categories: WEAPON, ARMOR, CONSUMABLE, SPECIAL, JUNK, TREASURE, MATERIAL, QUEST.
        Tags: equippable, consumable, alchemical, craft component, dismantleable, prize, junk.
        If it's a Weapon or Armor, provide 'stats' (atk or def, 1-10 scale).
        If it's a Book or Tome, it may be a CONSUMABLE that grants knowledge/XP.
        Return JSON.
        `;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: itemEntrySchema }
        });
        const data = JSON.parse(cleanJson(response.text));

        const validCategories = ['WEAPON', 'ARMOR', 'CONSUMABLE', 'SPECIAL', 'JUNK', 'TREASURE', 'MATERIAL', 'QUEST'];
        let category = data.category;
        if (!category || !validCategories.includes(category)) {
            category = 'SPECIAL';
        }

        return {
            ...data,
            category,
            id: `item_appraised_${Date.now()}`,
            type: 'ITEM',
            name: itemName
        };
    }, {
        id: `item_fail_${Date.now()}`,
        name: itemName,
        type: 'ITEM',
        description: "The item defies analysis.",
        rarity: 'COMMON',
        category: 'JUNK',
        value: 1
    });
};

// --- CLASS GENERATION ---

export const generateCharacterClass = async (): Promise<ClassTemplate> => {
    const { result } = createHybridAiD20Roll();
    
    if (result === HybridRollResult.COMMON) {
        return COMMON_CLASSES[Math.floor(Math.random() * COMMON_CLASSES.length)];
    }
    if (result === HybridRollResult.UNCOMMON) {
        return UNCOMMON_CLASSES[Math.floor(Math.random() * UNCOMMON_CLASSES.length)];
    }
    if (result === HybridRollResult.RARE) {
        return RARE_CLASSES[Math.floor(Math.random() * RARE_CLASSES.length)];
    }
    
    let prompt = "";
    if (result === HybridRollResult.CRITICAL_FAILURE) {
        prompt = "Generate a 'Custom Weak' RPG class. Flawed, terrible stats (low atk/def/hp), weird description.";
    } else if (result === HybridRollResult.NEGATIVE_UNIQUE) {
        prompt = "Generate a 'Negative Unique' RPG class. It has a downside or curse, but is playable. Mundane power level.";
    } else if (result === HybridRollResult.POSITIVE_UNIQUE) {
        prompt = "Generate an 'Uncommon Unique' RPG class. Interesting mechanic, average stats.";
    } else if (result === HybridRollResult.CRITICAL_SUCCESS) {
        prompt = "Generate a 'Rare Unique' RPG class. Powerful stats, epic description.";
    }

    return safeGenerate("generateCharacterClass", async () => {
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: classSchema }
        });
        return JSON.parse(cleanJson(response.text));
    }, {
        name: "Glitch Walker",
        description: "A class born from a system error. Unpredictable.",
        stats: { atk: 2, def: 2, hp: 5 }
    });
};

export const generateCompanion = async (name: string, playerLevel: number, originId?: string): Promise<Character> => {
    return safeGenerate("generateCompanion", async () => {
        const prompt = `Generate a companion character named "${name}" around level ${playerLevel}. Choose a class and appropriate stats.`;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: classSchema }
        });
        const data = JSON.parse(cleanJson(response.text));
        
        // Scale hp/atk/def loosely by level if AI returned base stats
        const scaledHp = data.stats.hp + (playerLevel * 3);
        const scaledAtk = data.stats.atk + Math.floor(playerLevel * 0.8);
        const scaledDef = data.stats.def + Math.floor(playerLevel * 0.5);

        return {
            id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name || name,
            class: data.class || "Adventurer",
            description: data.description,
            hp: scaledHp,
            maxHp: scaledHp,
            ep: 10 + playerLevel,
            maxEp: 10 + playerLevel,
            level: playerLevel,
            xp: 0,
            atk: scaledAtk,
            def: scaledDef,
            isPlayer: false,
            equipment: {},
            skills: [],
            activeEffects: [],
            originId: originId
        } as Character;

    }, {
        id: `char_fallback_${Date.now()}`,
        name: name,
        class: "Survivor",
        hp: 10, maxHp: 10, ep: 10, maxEp: 10, level: 1, xp: 0, atk: 2, def: 1, isPlayer: false,
        equipment: {}, skills: [], activeEffects: [], originId
    });
};

// --- MAP GENERATION ---

export const generateMapCell = async (x: number, y: number, playerLevel: number, history: string[] = []): Promise<MapCell> => {
    return safeGenerate("generateMapCell", async () => {
        // Pre-calculation Logic
        const roll = D20();
        let schemaType = 'WILDERNESS';
        let flavor = 'Standard Wilderness';
        
        if (roll === 1) {
            schemaType = 'WILDERNESS';
            flavor = 'HIGHLY_DANGEROUS (trapped, corrupted, dangerous, poisoned...)';
        } else if (roll >= 2 && roll <= 4) {
            schemaType = 'DUNGEON';
            flavor = 'DUNGEON (ruins, cave, or structure)';
        } else if (roll >= 5 && roll <= 17) {
            schemaType = 'WILDERNESS';
            flavor = 'Standard wilderness (Forest, Plains, Desert, etc)';
        } else if (roll >= 18 && roll <= 19) {
            schemaType = 'TOWN';
            flavor = 'Small settlement / town / village';
        } else if (roll === 20) {
            schemaType = 'TOWN';
            flavor = 'MAJOR_CITY (Large, bustling, fortified)';
        }

        const d6 = Math.floor(Math.random() * 6) + 1;
        let objectCount = Math.floor(d6 / 2); // 0 to 3
        if (flavor.startsWith('MAJOR_CITY')) objectCount += 2;
        // Ensure not negative just in case
        objectCount = Math.max(0, objectCount);

        const context = history.slice(-5).join(" "); // Last 5 logs
        const prompt = `
        Context: ${context}
        
        Generate a new map location at ${x}, ${y}. Lvl: ${playerLevel}.
        
        Location Configuration:
        1. schemaType: ${schemaType}
        2. Atmosphere/Theme: ${flavor}
        3. Interactable Objects: Generate exactly ${objectCount} notable objects.
           - Provide a 'description' for each object (e.g. what it looks like, why it's there).
        `;

        const mapCellInstructions = SYSTEM_INSTRUCTION + `
important rules for map cell / location metadata generation:
1. Ensure consistency with any travel directions mentioned in context.
2. Return JSON with name, description, type, biome, objects.
3. Each field must contain only its own value.
4. Do not include prefixes or headers like 'Objects:', 'Biome:', 'Description:'.
5. AVOID REPEATED FIELDS, PHRASES, AND SENTENCES.
6. No newline characters in any string value.
        `

        const response = await generateContentWithRetry(PRIMARY_MODEL, {
            contents: prompt,
            config: { maxOutputTokens: 1_000, systemInstruction: mapCellInstructions, responseMimeType: "application/json", responseSchema: mapCellSchema }
        });
        const data = JSON.parse(cleanJson(response.text));
        
        const objectsWithIds: any[] = [];
        
        if (data.objects) {
            for (const obj of data.objects) {
                const newObj: any = {
                    ...obj,
                    id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: obj.description || "A notable object.", // Fallback if schema fails, but schema is now required
                    isDetailed: true, // Eager loaded
                    hasInteracted: false,
                    contents: {}
                };
                objectsWithIds.push(newObj);
            }
        }

        // Ensure critical fields are present
        const cellName = data.name || "Uncharted Territory";
        const cellDesc = data.description || "The environment here is hazy and indistinct, as if the dream has not fully formed.";

        return { ...data, name: cellName, description: cellDesc, x, y, visited: true, objects: objectsWithIds };
    }, {
        x, y, visited: true,
        name: "Unstable Reality", description: "The dreamscape is destabilizing here. Static fills the air.", type: "WILDERNESS", biome: "Glitch Landscape",
        objects: []
    });
};

export const generateObjectDetails = async (name: string, type: string, locationContext: string): Promise<string> => {
    return safeGenerate("generateObjectDetails", async () => {
        const prompt = `
        Describe the object "${name}" (Type: ${type}) found in ${locationContext}.
        Keep it brief (under 2 sentences).
        `;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: objectDetailsSchema }
        });
        const data = JSON.parse(cleanJson(response.text));
        return data.description;
    }, "A generic object.");
};

export const generateQuest = async (context: string): Promise<any> => {
    return safeGenerate("generateQuest", async () => {
        const prompt = `Based on context: ${context}, generate a new quest. Return JSON.`;
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: questGenSchema }
        });
        return JSON.parse(cleanJson(response.text));
    }, { title: "Mystery Quest", description: "Something mysterious happened.", type: "MINOR", rewards: { xp: 50 } });
};

export const generateEnemy = async (playerLevel: number): Promise<Enemy> => {
    const { result } = createHybridAiD20Roll();

    if (result === HybridRollResult.COMMON) return getRandomStockEnemy('COMMON', playerLevel);
    if (result === HybridRollResult.UNCOMMON) return getRandomStockEnemy('UNCOMMON', playerLevel);
    if (result === HybridRollResult.RARE) return getRandomStockEnemy('RARE', playerLevel);

    let prompt = "";
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'UNIQUE' | 'GLITCH' = 'COMMON';
    let fallbackRarity: 'COMMON' | 'UNCOMMON' | 'RARE' = 'COMMON';

    if (result === HybridRollResult.CRITICAL_FAILURE) {
        prompt = `Generate a 'Weak Glitch' RPG enemy for Level ${playerLevel}. The result of a critical failure. Pathetic stats, weird description.`;
        rarity = 'GLITCH';
        fallbackRarity = 'COMMON';
    } else if (result === HybridRollResult.NEGATIVE_UNIQUE) {
        prompt = `Generate a 'Negative Unique' RPG enemy for Level ${playerLevel}. A mundane threat with a twist or annoyance. Stats balanced for Lvl ${playerLevel}.`;
        rarity = 'UNIQUE';
        fallbackRarity = 'COMMON';
    } else if (result === HybridRollResult.POSITIVE_UNIQUE) {
        prompt = `Generate an 'Uncommon Unique' RPG enemy for Level ${playerLevel}. Interesting mechanics. Stats balanced for Lvl ${playerLevel}.`;
        rarity = 'UNIQUE';
        fallbackRarity = 'UNCOMMON';
    } else if (result === HybridRollResult.CRITICAL_SUCCESS) {
        prompt = `Generate a 'Rare Unique' RPG boss/enemy for Level ${playerLevel}. Powerful stats, epic visual.`;
        rarity = 'UNIQUE';
        fallbackRarity = 'RARE';
    }

    const fallbackEnemy = getRandomStockEnemy(fallbackRarity, playerLevel);

    return safeGenerate("generateEnemy", async () => {
        const response = await generateContentWithRetry(LITE_MODEL, {
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: enemySchema }
        });
        
        const data = JSON.parse(cleanJson(response.text));
        if (!data.maxHp || data.maxHp < 1) throw new Error("Invalid HP from AI");

        return { 
            id: `enemy_${Date.now()}`, 
            hp: data.maxHp, 
            isPlayer: false, 
            level: playerLevel, 
            equipment: {}, 
            type: 'ENEMY', 
            rarity: rarity, 
            ...data 
        };
    }, {
        ...fallbackEnemy,
        name: `${fallbackEnemy.name} (Illusion)`,
        description: `The mist clears, revealing a ${fallbackEnemy.name}, though it seems slightly distorted.`,
        rarity: rarity
    });
};
