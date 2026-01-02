
export const WEAPON_LIST = [
  "Iron Sword", "Rusty Dagger", "Steel Dagger", "Masterwork Sword", "Hunter's Bow", "Walking Stick"
];

export const ARMOR_LIST = [
  "Wooden Shield", "Leather Armor", "Chainmail Vest", "Reinforced Shield", "Mithril Vest", "Elven Cloak", "Ring of Protection"
];

export const CONSUMABLE_LIST = [
  "Dried Rations", "Water Skin", "Bandage", "Healing Potion", "Antidote", "Potion of Invisibility", "Flint and Steel"
];

export const SPECIAL_LIST = [
  "Torch", "Rope", "Old Pocket Watch", "Spyglass", "Compass", "Climbing Gear", "Lantern", "Ancient Tome", "Thunderstone", "Spiritbinder"
];

// Aggregates for generation logic
export const COMMON_ITEMS = [
  "Iron Sword", "Wooden Shield", "Leather Armor", "Torch", "Rope", 
  "Dried Rations", "Water Skin", "Flint and Steel", "Bandage", "Walking Stick"
];

export const UNCOMMON_ITEMS = [
  "Steel Dagger", "Chainmail Vest", "Healing Potion", "Antidote", 
  "Spyglass", "Compass", "Climbing Gear", "Lantern", "Reinforced Shield", "Hunter's Bow",
  "Spiritbinder"
];

export const RARE_ITEMS = [
  "Mithril Vest", "Elven Cloak", "Potion of Invisibility", "Thunderstone", 
  "Masterwork Sword", "Ancient Tome", "Ring of Protection"
];

export const CURSED_PREFIXES = [
  "Rusting", "Heavy", "Haunted", "Unlucky", "Betraying", "Bloodthirsty"
];

// --- Heuristic Helpers ---

export const getItemValue = (itemName: string): number => {
  const lower = itemName.toLowerCase();
  
  // Base values by rarity keywords
  let value = 10; 
  if (lower.includes('rusty') || lower.includes('old') || lower.includes('wooden')) value = 5;
  if (lower.includes('iron') || lower.includes('leather')) value = 15;
  if (lower.includes('steel') || lower.includes('chainmail') || lower.includes('reinforced')) value = 35;
  if (lower.includes('mithril') || lower.includes('masterwork') || lower.includes('elven') || lower.includes('magic')) value = 100;
  if (lower.includes('dragon') || lower.includes('void') || lower.includes('ancient')) value = 250;
  
  // Type modifiers
  if (lower.includes('potion')) value = Math.max(value, 20);
  if (lower.includes('gem') || lower.includes('gold')) value *= 2;
  
  return value;
};

export const getDeterministicStats = (itemName: string, type: 'WEAPON' | 'ARMOR'): number => {
  const lower = itemName.toLowerCase();
  let bonus = 1;

  if (type === 'WEAPON') {
      if (lower.includes('rusty') || lower.includes('stick')) bonus = 1;
      else if (lower.includes('iron') || lower.includes('dagger')) bonus = 2;
      else if (lower.includes('steel') || lower.includes('hunter')) bonus = 3;
      else if (lower.includes('masterwork') || lower.includes('magic')) bonus = 5;
      else if (lower.includes('void') || lower.includes('dragon')) bonus = 7;
      else bonus = 2; // Default
  } else {
      // Armor
      if (lower.includes('wooden') || lower.includes('robe')) bonus = 1;
      else if (lower.includes('leather')) bonus = 2;
      else if (lower.includes('chain') || lower.includes('reinforced')) bonus = 3;
      else if (lower.includes('plate') || lower.includes('mithril')) bonus = 5;
      else if (lower.includes('dragon')) bonus = 8;
      else bonus = 1;
  }

  return bonus;
};
