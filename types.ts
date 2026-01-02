
export enum GameStatus {
  MENU = 'MENU',
  CREATION = 'CREATION',
  PLAYING = 'PLAYING',
  COMBAT = 'COMBAT',
  ENDING = 'ENDING',
  LOADING = 'LOADING'
}

export enum HybridRollResult {
  CRITICAL_FAILURE = 'CRITICAL_FAILURE', // 1
  NEGATIVE_UNIQUE = 'NEGATIVE_UNIQUE',   // 2
  COMMON = 'COMMON',                     // 3-12
  UNCOMMON = 'UNCOMMON',                 // 13-15
  RARE = 'RARE',                         // 16-18
  POSITIVE_UNIQUE = 'POSITIVE_UNIQUE',   // 19
  CRITICAL_SUCCESS = 'CRITICAL_SUCCESS'  // 20
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  NonBinary = 'Non-Binary'
}

export type SkillType = 'MAGIC' | 'MELEE' | 'RANGED' | 'SUPPORT';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  cost: number;
  power?: number; // Damage or Heal amount
  description: string;
  effect: 'DAMAGE' | 'HEAL' | 'BUFF_CRIT' | 'DEBUFF_ACC' | 'ESCAPE' | 'STUN';
}

export interface ActiveEffect {
  type: 'CRIT_NEXT' | 'BLINDED' | 'STUNNED';
  duration: number; // Turns
}

export interface Equipment {
  weapon?: { name: string; atkBonus: number };
  armor?: { name: string; defBonus: number };
}

export interface Character {
  id: string;
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  level: number;
  xp?: number; // Current XP towards next level
  atk: number;
  def: number;
  isPlayer: boolean;
  backstory?: string;
  equipment: Equipment;
  skills: Skill[];
  activeEffects: ActiveEffect[];
  originId?: string; // ID of the map object this character originated from
}

export interface Enemy extends Character {
  description: string;
  xpValue: number;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'UNIQUE' | 'GLITCH';
  // Encyclopedia compatibility
  type?: 'ENEMY'; 
  weaknesses: SkillType[];
}

export type ItemCategory = 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'SPECIAL' | 'JUNK' | 'TREASURE' | 'MATERIAL' | 'QUEST';

export interface ItemEntry {
  id: string;
  name: string;
  type: 'ITEM';
  category?: ItemCategory;
  tags?: string[]; // e.g. 'alchemical', 'craft component'
  value?: number; // Gold value
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'CURSED' | 'UNIQUE';
  stats?: { atk?: number; def?: number };
}

export interface LocationEntry {
    id: string;
    name: string;
    type: 'LOCATION';
    description: string;
}

export type EncyclopediaEntry = Enemy | ItemEntry | LocationEntry;

export interface QuestRewards {
    gold?: number;
    xp?: number;
    items?: string[];
    prestige?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'MAJOR' | 'MINOR' | 'INTUITION';
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  rewards: QuestRewards;
  progress?: number;
  target?: number;
  criteria?: 'EXPLORE' | 'FIND_TOWN' | 'COMBAT' | 'RECRUIT' | 'FIND_QUEST'; // For intuition logic
}

export type CellType = 'WILDERNESS' | 'TOWN' | 'DUNGEON';

export type MapObjectType = 'MERCHANT' | 'HEALER' | 'NPC' | 'RESOURCE' | 'LOOT' | 'OBSTACLE' | 'APPRAISER';

export interface MapObject {
  id: string; // Unique ID within the cell
  name: string;
  type: MapObjectType;
  description: string;
  isDetailed?: boolean; // Lazy load flag
  hasInteracted?: boolean; // For one-off interactions like Loot/Resource
  contents?: {
      items?: string[];
      gold?: number;
      message?: string;
  };
}

export interface MapCell {
  x: number;
  y: number;
  name: string;
  description: string;
  type: CellType;
  biome?: string;
  visited: boolean;
  objects: MapObject[];
}

export interface CombatState {
  activeEnemies: Enemy[];
  log: string[];
  turnIndex: number; // 0 for player, 1+ for enemies
}

export interface Suggestion {
    text: string;
    questId?: string;
}

export interface PendingRecruit {
    name: string;
    level: number;
    originId?: string;
}

export interface GameState {
  player: Character;
  party: Character[];
  inventory: string[];
  gold: number;
  quests: Quest[];
  
  // Map System
  worldMap: Record<string, MapCell>; // Key format "x,y"
  playerPos: { x: number; y: number };
  
  // Encyclopedia
  encyclopedia: EncyclopediaEntry[];
  
  // Combat
  combat: CombatState | null;

  turnCount: number;
  status: GameStatus;
  history: string[]; 
  lastEventSummary: string;
  currentSuggestion: Suggestion; // The AI's suggested move for this turn
  pendingRecruit: PendingRecruit | null; // Staging area for recruitment consent
}

export interface AIResponse {
  narrative: string;
  locationName?: string;
  choices?: string[]; 
  suggestedAction?: string;
  recruitTriggered?: boolean;
  recruitName?: string;
  
  // Generators
  newMapCell?: MapCell;
  newEnemy?: Enemy;
  
  updates: any; // Keep flexible for generic updates
}

export interface ItemActionResponse {
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'FLAVOR' | 'CAPTURE';
  narrative: string;
  stats?: { atk?: number; def?: number };
  hpChange?: number;
  xpChange?: number;
}

export interface QuestOutcomeResponse {
  narrative: string;
  damage?: number;
}

export interface SpecialAction {
  label: string;
  action: string;
  description: string;
  iconType: 'SHOP' | 'TALK' | 'GATHER' | 'INTERACT' | 'REST' | 'APPRAISE' | 'RECRUIT';
  objectId?: string; // Links action to specific map object
}
