import { Skill, SkillType } from '../types';

export const SKILL_LIBRARY: Skill[] = [
    // MAGIC
    { id: 'fireball_lesser', name: 'Lesser Fireball', type: 'MAGIC', cost: 5, power: 8, effect: 'DAMAGE', description: "Hurls a small bolt of flame." },
    { id: 'fireball_greater', name: 'Greater Fireball', type: 'MAGIC', cost: 15, power: 25, effect: 'DAMAGE', description: "Explosive blast of fire." },
    { id: 'heal_lesser', name: 'Lesser Heal', type: 'MAGIC', cost: 5, power: 15, effect: 'HEAL', description: "Restores a small amount of health." },
    { id: 'heal_greater', name: 'Greater Heal', type: 'MAGIC', cost: 15, power: 40, effect: 'HEAL', description: "Restores a large amount of health." },
    { id: 'poison_cloud', name: 'Poison Cloud', type: 'MAGIC', cost: 8, power: 5, effect: 'DAMAGE', description: "Toxic fumes that ignore some defense." }, // Simplified for now
    { id: 'teleport', name: 'Teleport', type: 'MAGIC', cost: 10, effect: 'ESCAPE', description: "Instantly escape from danger." },
    { id: 'charm', name: 'Charm', type: 'MAGIC', cost: 12, effect: 'STUN', description: "Mesmerize the enemy, causing them to miss a turn." },

    // MELEE
    { id: 'triple_slash', name: 'Triple Slash', type: 'MELEE', cost: 8, power: 12, effect: 'DAMAGE', description: "Three rapid strikes." },
    { id: 'heavy_smash', name: 'Heavy Smash', type: 'MELEE', cost: 5, power: 10, effect: 'DAMAGE', description: "A slow but powerful blow." },
    { id: 'target_eyes', name: 'Target Eyes', type: 'MELEE', cost: 6, effect: 'DEBUFF_ACC', description: "Aim for the eyes to blind the enemy temporarily." },

    // RANGED
    { id: 'triple_shot', name: 'Triple Shot', type: 'RANGED', cost: 8, power: 12, effect: 'DAMAGE', description: "Three arrows fired in succession." },
    { id: 'piercing_shot', name: 'Piercing Shot', type: 'RANGED', cost: 6, power: 10, effect: 'DAMAGE', description: "A shot that aims for gaps in armor." },

    // SUPPORT
    { id: 'focus_aim', name: 'Focus Aim', type: 'SUPPORT', cost: 5, effect: 'BUFF_CRIT', description: "Take a breath to guarantee a Critical Hit on the next turn." },
    { id: 'meditate', name: 'Meditate', type: 'SUPPORT', cost: 0, power: 5, effect: 'HEAL', description: "Focus mind to restore a tiny bit of HP/EP." }, // Simplified to HP for now or generic unused
];

export const getSkillById = (id: string): Skill | undefined => {
    return SKILL_LIBRARY.find(s => s.id === id);
};

export const getRandomClassSkill = (className: string, currentSkills: Skill[]): Skill | null => {
    const cn = className.toLowerCase();
    
    // Filter appropriate skills based on class archetypes
    let candidates = SKILL_LIBRARY.filter(s => {
        // Prevent duplicates
        if (currentSkills.find(existing => existing.id === s.id)) return false;

        // Class Logic
        const isMage = cn.includes('mage') || cn.includes('priest') || cn.includes('scholar') || cn.includes('alchemist') || cn.includes('summoner') || cn.includes('spell');
        const isWarrior = cn.includes('soldier') || cn.includes('berserker') || cn.includes('knight') || cn.includes('spear') || cn.includes('blacksmith');
        const isRogue = cn.includes('rogue') || cn.includes('archer') || cn.includes('hunter') || cn.includes('beast') || cn.includes('sailor');

        if (isMage && s.type === 'MAGIC') return true;
        if (isWarrior && (s.type === 'MELEE' || s.type === 'SUPPORT')) return true;
        if (isRogue && (s.type === 'RANGED' || s.type === 'MELEE' || s.type === 'SUPPORT')) return true;
        
        // Fallback for generic classes (Dreamer, Farmer, Chef) - can learn anything simple
        if (!isMage && !isWarrior && !isRogue) {
            return s.cost < 10; // Low level skills
        }

        return false;
    });

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
};
