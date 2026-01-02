import { GameState, GameStatus, Gender, Quest } from './types';

export const LEVEL_CAP = 5;

export const INTUITION_QUESTS: Quest[] = [
    { 
        id: 'intuition_explore', 
        title: "Wanderlust", 
        description: "Your gut tells you to explore the dreamscape. Visit 5 unique locations.", 
        type: 'INTUITION', 
        status: 'ACTIVE', 
        criteria: 'EXPLORE', 
        progress: 0, 
        target: 5,
        rewards: { gold: 50, xp: 100 }
    },
    { 
        id: 'intuition_town', 
        title: "Civilization", 
        description: "You feel a pull towards others. Find a Town.", 
        type: 'INTUITION', 
        status: 'ACTIVE', 
        criteria: 'FIND_TOWN', 
        target: 1,
        rewards: { gold: 25, xp: 50, prestige: 5 }
    },
    { 
        id: 'intuition_quest', 
        title: "Purpose", 
        description: "You need direction. Find and accept a quest from the world.", 
        type: 'INTUITION', 
        status: 'ACTIVE', 
        criteria: 'FIND_QUEST', 
        target: 1,
        rewards: { xp: 75, items: ['Healing Potion'] }
    },
    { 
        id: 'intuition_recruit', 
        title: "Companionship", 
        description: "It is dangerous to go alone. Recruit a party member (via Special Actions or Events).", 
        type: 'INTUITION', 
        status: 'ACTIVE', 
        criteria: 'RECRUIT', 
        target: 2, // Player + 1
        rewards: { gold: 100, prestige: 10 }
    },
    { 
        id: 'intuition_combat', 
        title: "Survival Instinct", 
        description: "Prove your strength. Win a combat encounter.", 
        type: 'INTUITION', 
        status: 'ACTIVE', 
        criteria: 'COMBAT', 
        target: 1,
        rewards: { gold: 40, xp: 150, items: ['Dried Rations'] }
    }
];

const INITIAL_GAME_STATE_SUGGESTIONS = [
  'Estimate the time of day',
  'Inspect the sky',
  'Listen closely for any interesting sounds',
  'Scrutinize the weather',
  'Ponder the time of day',
]

export const INITIAL_GAME_STATE: GameState = {
  player: {
    id: 'player',
    name: '',
    class: 'Dreamer',
    hp: 30,
    maxHp: 30,
    ep: 10,
    maxEp: 10,
    level: 1,
    xp: 0,
    atk: 3,
    def: 1,
    isPlayer: true,
    backstory: "A mysterious adventurer.",
    equipment: {},
    skills: [],
    activeEffects: []
  },
  party: [],
  inventory: [],
  gold: 0,
  quests: [],
  
  // Map Init
  worldMap: {
    "0,0": {
      x: 0,
      y: 0,
      name: "The Awakening Stone",
      description: "A smooth, flat, circular stone. The diameter is about equal to your height. The stone sits amidst a featureless monotonous grassy field.",
      type: "WILDERNESS",
      biome: "Grassy Field",
      visited: true,
      objects: []
    }
  },

  playerPos: { x: 0, y: 0 },
  
  encyclopedia: [],
  combat: null,

  turnCount: 0,
  status: GameStatus.MENU,
  history: [],
  lastEventSummary: 'The story has just begun.',
  currentSuggestion: { text: INITIAL_GAME_STATE_SUGGESTIONS[Math.floor(Math.random() * INITIAL_GAME_STATE_SUGGESTIONS.length)] },
  pendingRecruit: null
};

export const GENDER_OPTIONS = [Gender.Male, Gender.Female, Gender.NonBinary];

export const THEME_COLORS = {
  primary: 'amber-500',
  secondary: 'slate-800',
  text: 'slate-200',
  accent: 'cyan-400'
};