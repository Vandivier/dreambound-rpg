
export interface ClassTemplate {
  name: string;
  description: string;
  stats: { atk: number; def: number; hp: number };
}

export const COMMON_CLASSES: ClassTemplate[] = [
  { name: "Soldier", description: "A veteran of many wars, reliable and sturdy.", stats: { atk: 1, def: 2, hp: 5 } },
  { name: "Rogue", description: "Quick and deadly, preferring the shadows.", stats: { atk: 3, def: 0, hp: 0 } },
  { name: "Scholar", description: "Knowledge is power, though the body is weak.", stats: { atk: 0, def: 0, hp: 0 } },
  { name: "Farmer", description: "Strong from years of hard work.", stats: { atk: 2, def: 1, hp: 10 } },
  { name: "Sailor", description: "At home on the sea, hardy and adventurous.", stats: { atk: 1, def: 1, hp: 5 } },
  { name: "Priest", description: "A servant of the divine, focuses on preservation.", stats: { atk: 0, def: 1, hp: 5 } },
  { name: "Archer", description: "Strikes from afar with precision.", stats: { atk: 3, def: 0, hp: 0 } },
  { name: "Spearman", description: "Keeps enemies at bay with long reach.", stats: { atk: 2, def: 1, hp: 5 } },
  { name: "Merchant", description: "Knows the value of things, persuasive.", stats: { atk: 1, def: 0, hp: 5 } },
  { name: "Chef", description: "Expert in sustenance, turning monsters into meals.", stats: { atk: 1, def: 1, hp: 8 } },
];

export const UNCOMMON_CLASSES: ClassTemplate[] = [
  { name: "Spellblade", description: "Weaves magic into martial strikes.", stats: { atk: 3, def: 1, hp: 5 } },
  { name: "Alchemist", description: "Uses volatile mixtures to fight.", stats: { atk: 2, def: 1, hp: 5 } },
  { name: "Beastmaster", description: "Commands the loyalty of nature.", stats: { atk: 2, def: 0, hp: 10 } },
  { name: "Berserker", description: "Fueled by rage, ignoring pain for power.", stats: { atk: 4, def: -1, hp: 15 } },
  { name: "Bard", description: "Inspires allies and distracts foes with song.", stats: { atk: 1, def: 1, hp: 5 } },
  { name: "Blacksmith", description: "Strong arm and knowledge of steel.", stats: { atk: 2, def: 2, hp: 10 } },
  { name: "Fire Mage", description: "Destructive magic that burns everything.", stats: { atk: 4, def: 0, hp: 0 } },
  { name: "Water Mage", description: "Fluid and adaptable magic.", stats: { atk: 2, def: 2, hp: 5 } },
  { name: "Earth Mage", description: "Resilient magic rooted in stone.", stats: { atk: 1, def: 3, hp: 10 } },
  { name: "Wind Mage", description: "Fast and elusive magic.", stats: { atk: 3, def: 1, hp: 0 } },
  { name: "Dual Wielder", description: "A flurry of blades, attacking twice as fast.", stats: { atk: 4, def: -1, hp: 5 } },
];

export const RARE_CLASSES: ClassTemplate[] = [
  { name: "Dragon Knight", description: "Channels the fury of dragons.", stats: { atk: 5, def: 3, hp: 15 } },
  { name: "Void Walker", description: "Steps between realities.", stats: { atk: 4, def: 2, hp: 10 } },
  { name: "Chronomancer", description: "Manipulates the flow of time.", stats: { atk: 3, def: 4, hp: 5 } },
  { name: "Summoner", description: "Calls forth spirits to aid in battle.", stats: { atk: 1, def: 1, hp: 10 } },
  { name: "Chimerist", description: "Fuses essence of beasts to wield chaotic power.", stats: { atk: 4, def: 3, hp: 12 } },
  { name: "Grafter", description: "Has surgically attached plant and monster parts to their own body.", stats: { atk: 3, def: 5, hp: 15 } },
];
