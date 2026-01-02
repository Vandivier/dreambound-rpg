
import { Enemy, SkillType } from '../types';

export interface EnemyTemplate {
  name: string;
  class: string;
  maxHp: number;
  atk: number;
  def: number;
  xpValue: number;
  description: string;
}

// 8 Common Enemies (Roll 2-12)
export const COMMON_ENEMIES: EnemyTemplate[] = [
  { name: "Giant Rat", class: "Beast", maxHp: 8, atk: 2, def: 0, xpValue: 5, description: "A large, mangy rodent with glowing eyes." },
  { name: "Slime", class: "Ooze", maxHp: 12, atk: 1, def: 1, xpValue: 5, description: "A gelatinous blob that dissolves organic matter." },
  { name: "Bandit", class: "Humanoid", maxHp: 15, atk: 3, def: 1, xpValue: 10, description: "A desperate highwayman looking for coin." },
  { name: "Wild Wolf", class: "Beast", maxHp: 12, atk: 4, def: 0, xpValue: 10, description: "A hungry predator stalking the void." },
  { name: "Skeleton", class: "Undead", maxHp: 10, atk: 2, def: 2, xpValue: 8, description: "Bones animated by a weak curse." },
  { name: "Giant Spider", class: "Beast", maxHp: 10, atk: 3, def: 0, xpValue: 8, description: "It weaves webs from dream silk." },
  { name: "Lost Soul", class: "Spirit", maxHp: 5, atk: 1, def: 4, xpValue: 6, description: "A wandering spirit that attacks out of confusion." },
  { name: "Goblin Scavenger", class: "Humanoid", maxHp: 10, atk: 2, def: 1, xpValue: 7, description: "Picks through the debris of the dream." }
];

// 7 Uncommon Enemies (Roll 13-15)
export const UNCOMMON_ENEMIES: EnemyTemplate[] = [
  { name: "Orc Raider", class: "Humanoid", maxHp: 25, atk: 5, def: 2, xpValue: 20, description: "Brutal and strong, wielding a heavy axe." },
  { name: "Shadow Bear", class: "Beast", maxHp: 30, atk: 4, def: 3, xpValue: 25, description: "A bear made of solidified shadow." },
  { name: "Harpy", class: "Monstrosity", maxHp: 18, atk: 5, def: 1, xpValue: 18, description: "A winged creature with a piercing shriek." },
  { name: "Animated Armor", class: "Construct", maxHp: 20, atk: 3, def: 5, xpValue: 20, description: "An empty suit of plate mail walking on its own." },
  { name: "Dream Cultist", class: "Humanoid", maxHp: 18, atk: 4, def: 1, xpValue: 18, description: "Worships the instability of the realm." },
  { name: "Gryphon Fledgling", class: "Monstrosity", maxHp: 28, atk: 6, def: 2, xpValue: 30, description: "A young but dangerous majestic beast." },
  { name: "Stone Golem", class: "Construct", maxHp: 40, atk: 2, def: 6, xpValue: 35, description: "Slow but incredibly durable." }
];

// 5 Rare Enemies (Roll 16-18)
export const RARE_ENEMIES: EnemyTemplate[] = [
  { name: "Void Dragon Whelp", class: "Dragon", maxHp: 50, atk: 8, def: 4, xpValue: 100, description: "A small dragon breathing purple fire." },
  { name: "Lich Apprentice", class: "Undead", maxHp: 35, atk: 10, def: 2, xpValue: 80, description: "Wields forbidden necromantic arts." },
  { name: "Hydra", class: "Monstrosity", maxHp: 60, atk: 6, def: 3, xpValue: 120, description: "Cut off one head, and it gets angry." },
  { name: "Vampire Lord", class: "Undead", maxHp: 45, atk: 7, def: 3, xpValue: 90, description: "Sophisticated and deadly." },
  { name: "Nightmare Demon", class: "Fiend", maxHp: 55, atk: 9, def: 3, xpValue: 110, description: "A manifestation of pure fear." }
];

export const getScaledEnemy = (template: EnemyTemplate, level: number, rarity: 'COMMON' | 'UNCOMMON' | 'RARE'): Enemy => {
  // Scaling Formula
  // HP: Base + (Level * 4)
  // ATK: Base + (Level * 1)
  // DEF: Base + (Level * 0.5)
  // XP: Base + (Level * 5)

  // Generate 1 random weakness
  const types: SkillType[] = ['MAGIC', 'MELEE', 'RANGED', 'SUPPORT'];
  const weakness = [types[Math.floor(Math.random() * types.length)]];
  
  return {
    id: `enemy_${Date.now()}_${Math.random()}`,
    isPlayer: false,
    level: level,
    equipment: {},
    skills: [],
    activeEffects: [],
    type: 'ENEMY',
    rarity: rarity,
    weaknesses: weakness,
    
    name: template.name,
    class: template.class,
    description: template.description,
    
    hp: Math.floor(template.maxHp + (level * 4)),
    maxHp: Math.floor(template.maxHp + (level * 4)),
    atk: Math.floor(template.atk + (level * 1)),
    def: Math.floor(template.def + (level * 0.5)),
    xpValue: Math.floor(template.xpValue + (level * 5)),
    ep: 10, // Stock EP for enemies
    maxEp: 10
  };
};

export const getRandomStockEnemy = (rarity: 'COMMON' | 'UNCOMMON' | 'RARE', level: number): Enemy => {
  let list = COMMON_ENEMIES;
  if (rarity === 'UNCOMMON') list = UNCOMMON_ENEMIES;
  if (rarity === 'RARE') list = RARE_ENEMIES;

  const template = list[Math.floor(Math.random() * list.length)];
  return getScaledEnemy(template, level, rarity);
};
