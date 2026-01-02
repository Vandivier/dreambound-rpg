import { Schema, Type } from "@google/genai";

export const classSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    stats: {
      type: Type.OBJECT,
      properties: {
        atk: { type: Type.NUMBER },
        def: { type: Type.NUMBER },
        hp: { type: Type.NUMBER }
      }
    }
  }
};

export const mapCellSchema: Schema = {
  type: Type.OBJECT,
  required: ["name", "description", "type", "biome", "objects"],
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['WILDERNESS', 'TOWN', 'DUNGEON'] },
    biome: { type: Type.STRING },
    objects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "type", "description"],
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['MERCHANT', 'HEALER', 'NPC', 'RESOURCE', 'LOOT', 'OBSTACLE', 'APPRAISER'] },
          description: { type: Type.STRING }
        }
      }
    }
  }
};

export const objectDetailsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING } as any
    }
};

export const enemySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING } as any,
    class: { type: Type.STRING },
    maxHp: { type: Type.NUMBER },
    atk: { type: Type.NUMBER },
    def: { type: Type.NUMBER },
    description: { type: Type.STRING } as any,
    xpValue: { type: Type.NUMBER }
  }
};

export const itemEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING } as any,
    description: { type: Type.STRING } as any,
    rarity: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['WEAPON', 'ARMOR', 'CONSUMABLE', 'SPECIAL', 'JUNK', 'TREASURE', 'MATERIAL', 'QUEST'] },
    value: { type: Type.NUMBER },
    stats: {
        type: Type.OBJECT,
        properties: {
            atk: { type: Type.NUMBER },
            def: { type: Type.NUMBER }
        }
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

export const movementNarrativeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING } as any,
    suggestedAction: { type: Type.STRING, description: "A logical, short, non-directional action." } as any
  }
};

export const itemActionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['WEAPON', 'ARMOR', 'CONSUMABLE', 'FLAVOR', 'CAPTURE'] },
    narrative: { type: Type.STRING } as any,
    stats: {
      type: Type.OBJECT,
      properties: {
        atk: { type: Type.NUMBER },
        def: { type: Type.NUMBER }
      }
    },
    hpChange: { type: Type.NUMBER },
    xpChange: { type: Type.NUMBER }
  }
};

export const questOutcomeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        narrative: { type: Type.STRING } as any,
        damage: { type: Type.NUMBER, description: "Optional damage to player on failure (0-5)." }
    }
};

export const actionResolutionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING } as any,
    locationName: { type: Type.STRING } as any,
    suggestedAction: { type: Type.STRING } as any,
    isCombat: { type: Type.BOOLEAN },
    hpChangePlayer: { type: Type.NUMBER },
    lootFound: { type: Type.BOOLEAN, description: "True if the player found items/loot." },
    newQuestTriggered: { type: Type.BOOLEAN, description: "True if a new quest should start." },
    recruitTriggered: { type: Type.BOOLEAN, description: "True if a character formally agreed to join the player's party." },
    recruitName: { type: Type.STRING, description: "The name of the character joining the party, if applicable." },
    questCompletedId: { type: Type.STRING, description: "ID of quest completed, if any." },
    removedItem: { type: Type.STRING, description: "Name of item removed from inventory, if any." }
  }
};

export const questGenSchema: Schema = {
  type: Type.OBJECT,
  required: ["title", "description", "type", "rewards"],
  properties: {
    title: { type: Type.STRING } as any,
    description: { type: Type.STRING } as any,
    type: { type: Type.STRING, enum: ['MAJOR', 'MINOR'] },
    rewards: {
        type: Type.OBJECT,
        properties: {
            gold: { type: Type.NUMBER },
            xp: { type: Type.NUMBER },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    }
  }
};
