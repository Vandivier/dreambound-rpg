import { GameState, Enemy, Character, GameStatus, MapCell, SpecialAction, HybridRollResult, Skill, EncyclopediaEntry, ItemEntry } from '../types';
import { WEAPON_LIST, ARMOR_LIST, CONSUMABLE_LIST, SPECIAL_LIST } from './items';

export const D20 = () => Math.floor(Math.random() * 20) + 1;
export const D6 = () => Math.floor(Math.random() * 6) + 1;

export const createHybridAiD20Roll = (): { roll: number, result: HybridRollResult } => {
  const roll = D20();
  let result: HybridRollResult;

  if (roll === 1) result = HybridRollResult.CRITICAL_FAILURE;
  else if (roll === 2) result = HybridRollResult.NEGATIVE_UNIQUE;
  else if (roll >= 3 && roll <= 12) result = HybridRollResult.COMMON;
  else if (roll >= 13 && roll <= 15) result = HybridRollResult.UNCOMMON;
  else if (roll >= 16 && roll <= 18) result = HybridRollResult.RARE;
  else if (roll === 19) result = HybridRollResult.POSITIVE_UNIQUE;
  else result = HybridRollResult.CRITICAL_SUCCESS; // 20

  return { roll, result };
};

export const getPosKey = (x: number, y: number) => `${x},${y}`;

export const getXpForNextLevel = (level: number): number => {
    // Level 1 -> 100
    // Level 2 -> 200
    // Level 3 -> 400
    return 100 * Math.pow(2, level - 1);
};

export const getMaxPartySize = (level: number): number => {
    // Level 1: sqrt(1) = 1 ally (Total 2)
    // Level 4: sqrt(4) = 2 allies (Total 3)
    // Level 9: sqrt(9) = 3 allies (Total 4)
    return Math.floor(Math.sqrt(level)) + 1;
};

export type ItemType = 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'SPECIAL';

export const getItemType = (itemName: string, encyclopedia?: EncyclopediaEntry[]): ItemType => {
    // 1. Check Encyclopedia (Appraised items)
    if (encyclopedia) {
        const entry = encyclopedia.find(e => e.name === itemName && e.type === 'ITEM') as ItemEntry | undefined;
        if (entry && entry.category) {
            if (entry.category === 'WEAPON') return 'WEAPON';
            if (entry.category === 'ARMOR') return 'ARMOR';
            if (entry.category === 'CONSUMABLE') return 'CONSUMABLE';
            return 'SPECIAL'; // Junk, Treasure, Material all behave as special for interactions
        }
    }

    // 2. Check strict lists
    if (WEAPON_LIST.some(i => itemName.includes(i))) return 'WEAPON';
    if (ARMOR_LIST.some(i => itemName.includes(i))) return 'ARMOR';
    if (CONSUMABLE_LIST.some(i => itemName.includes(i))) return 'CONSUMABLE';
    if (SPECIAL_LIST.some(i => itemName.includes(i))) return 'SPECIAL';

    // 3. Heuristics for AI generated items
    const lower = itemName.toLowerCase();
    if (lower.includes('sword') || lower.includes('dagger') || lower.includes('axe') || lower.includes('bow') || lower.includes('blade') || lower.includes('staff') || lower.includes('spear')) return 'WEAPON';
    if (lower.includes('shield') || lower.includes('armor') || lower.includes('vest') || lower.includes('helm') || lower.includes('cloak') || lower.includes('boots') || lower.includes('gauntlet')) return 'ARMOR';
    if (lower.includes('potion') || lower.includes('elixir') || lower.includes('food') || lower.includes('bread') || lower.includes('water') || lower.includes('berry') || lower.includes('ration') || lower.includes('antidote')) return 'CONSUMABLE';

    return 'SPECIAL';
};

// Encounter Logic
export const checkForEncounter = (
  state: GameState, 
  isNewTile: boolean
): 'NONE' | 'COMBAT' | 'DISCOVERY' => {
  const roll = D20();
  
  // Safe zone at 0,0
  if (state.playerPos.x === 0 && state.playerPos.y === 0) return 'NONE';

  if (isNewTile) {
    if (roll > 16) return 'DISCOVERY'; // 20% Town/Dungeon
    if (roll > 8) return 'COMBAT';     // 40% Combat
    return 'NONE';
  } else {
    // Lower chance on visited tiles
    if (roll > 17) return 'COMBAT';    // 15% Combat
    return 'NONE';
  }
};

// Enemy Spawning Logic
export const shouldGenerateNewEnemy = (encyclopedia: Enemy[]): boolean => {
  if (encyclopedia.length < 4) return true;
  return D20() >= 18;
};

export const getRandomKnownEnemy = (encyclopedia: Enemy[]): Enemy => {
  const index = Math.floor(Math.random() * encyclopedia.length);
  // Return a copy to avoid mutating the reference in the encyclopedia directly immediately
  return { ...encyclopedia[index], id: `enemy_${Date.now()}`, hp: encyclopedia[index].maxHp, ep: encyclopedia[index].maxEp, activeEffects: [] };
};

// Combat Math
export const calculateDamage = (attacker: Character | Enemy, defender: Character | Enemy, skill?: Skill): { damage: number, isCrit: boolean, weaknessHit: boolean } => {
  // Check Buffs
  const hasFocus = attacker.activeEffects?.some(e => e.type === 'CRIT_NEXT');
  const isBlinded = attacker.activeEffects?.some(e => e.type === 'BLINDED');

  // Stats + Equipment
  const atkBonus = attacker.equipment?.weapon?.atkBonus || 0;
  const defBonus = defender.equipment?.armor?.defBonus || 0;

  // Base Attack Power
  let power = attacker.atk + atkBonus;
  if (skill && skill.power) power += skill.power; // Skills add power

  const totalDef = defender.def + defBonus;

  // Deterministic formula: (Atk - Def) + 1d6. Min 1.
  let base = power - totalDef;
  if (skill && skill.effect === 'DAMAGE') {
      // Magic usually ignores armor slightly or scales better
      if (skill.type === 'MAGIC') base += 2; 
  }

  const variance = D6();
  let damage = Math.max(1, base + variance);

  // Weakness Multiplier
  let weaknessHit = false;
  if (skill && (defender as Enemy).weaknesses?.includes(skill.type)) {
      damage = Math.floor(damage * 1.5);
      weaknessHit = true;
  }

  // Criticals
  let isCrit = false;
  if (hasFocus || D20() === 20) {
      damage = Math.floor(damage * 1.5);
      isCrit = true;
  }

  if (isBlinded) {
      damage = Math.floor(damage * 0.5);
  }

  return { damage, isCrit, weaknessHit };
};

export const resolveCombatRound = (
  state: GameState, 
  action: 'ATTACK' | 'DEFEND' | 'FLEE' | 'SKILL',
  usedSkill?: Skill
): { 
  newState: GameState, 
  logs: string[], 
  playerWon: boolean, 
  playerDied: boolean 
} => {
  // Deep copy relevant parts to avoid mutation of current state during async render gaps
  const newState: GameState = { 
    ...state,
    player: { ...state.player, equipment: { ...state.player.equipment }, activeEffects: [...state.player.activeEffects] },
    combat: state.combat ? {
        ...state.combat,
        activeEnemies: state.combat.activeEnemies.map(e => ({ 
            ...e, 
            equipment: { ...e.equipment },
            activeEffects: [...e.activeEffects]
        }))
    } : null,
    party: state.party.map(p => ({...p, equipment: {...p.equipment}, activeEffects: [...p.activeEffects]}))
  };

  if (!newState.combat) throw new Error("No combat active");
  
  const logs: string[] = [];
  const player = newState.player;
  const enemy = newState.combat.activeEnemies[0];

  if (!enemy) {
      newState.status = GameStatus.PLAYING;
      newState.combat = null;
      return { newState, logs, playerWon: true, playerDied: false };
  }

  // Check Stun on Player
  const playerStunned = player.activeEffects.find(e => e.type === 'STUNNED');
  if (playerStunned) {
      logs.push("You are stunned and cannot act!");
      player.activeEffects = player.activeEffects.filter(e => e.type !== 'STUNNED'); // Clear after turn
      // Skip player turn logic below
  } else {
      // 1. Player Turn
      if (action === 'ATTACK') {
        const { damage, isCrit } = calculateDamage(player, enemy);
        enemy.hp = Math.floor(Math.max(0, enemy.hp - damage));
        const weaponName = player.equipment.weapon?.name || "fists";
        logs.push(`You attacked ${enemy.name} with ${weaponName} for ${damage} damage!${isCrit ? ' (CRITICAL)' : ''}`);
        
        // Remove Focus Buff if used
        player.activeEffects = player.activeEffects.filter(e => e.type !== 'CRIT_NEXT');

      } else if (action === 'SKILL' && usedSkill) {
          // Consume EP
          player.ep -= usedSkill.cost;
          logs.push(`You used ${usedSkill.name}!`);

          if (usedSkill.effect === 'DAMAGE') {
              const { damage, isCrit, weaknessHit } = calculateDamage(player, enemy, usedSkill);
              enemy.hp = Math.floor(Math.max(0, enemy.hp - damage));
              logs.push(`${weaknessHit ? 'It hit a weakness! ' : ''}${damage} damage dealt.${isCrit ? ' (CRITICAL)' : ''}`);
              // Remove Focus Buff if used on damage skill
              player.activeEffects = player.activeEffects.filter(e => e.type !== 'CRIT_NEXT');
          } 
          else if (usedSkill.effect === 'HEAL') {
              const heal = usedSkill.power || 10;
              player.hp = Math.min(player.maxHp, player.hp + heal);
              logs.push(`Recovered ${heal} HP.`);
          }
          else if (usedSkill.effect === 'ESCAPE') {
              logs.push("You vanished in a blink!");
              newState.status = GameStatus.PLAYING;
              newState.combat = null;
              return { newState, logs, playerWon: false, playerDied: false };
          }
          else if (usedSkill.effect === 'BUFF_CRIT') {
              player.activeEffects.push({ type: 'CRIT_NEXT', duration: 1 });
              logs.push("You focused your aim for the next strike.");
          }
          else if (usedSkill.effect === 'DEBUFF_ACC') {
              enemy.activeEffects.push({ type: 'BLINDED', duration: 1 });
              logs.push(`${enemy.name} was blinded!`);
          }
          else if (usedSkill.effect === 'STUN') {
              enemy.activeEffects.push({ type: 'STUNNED', duration: 1 });
              logs.push(`${enemy.name} is mesmerized!`);
          }

      } else if (action === 'DEFEND') {
        logs.push(`You brace yourself.`);
      } else if (action === 'FLEE') {
        const fleeRoll = D20();
        if (fleeRoll > 10) {
          logs.push("You managed to escape!");
          newState.status = GameStatus.PLAYING;
          newState.combat = null;
          return { newState, logs, playerWon: false, playerDied: false };
        } else {
          logs.push("Failed to escape!");
        }
      }
  }

  // Check Enemy Death
  if (enemy.hp <= 0) {
    logs.push(`${enemy.name} was defeated!`);
    newState.combat.activeEnemies.shift();
    if (newState.combat.activeEnemies.length === 0) {
      newState.status = GameStatus.PLAYING;
      newState.combat = null;
      return { newState, logs, playerWon: true, playerDied: false };
    }
  }

  // 2. Enemy Turn
  if (newState.combat && newState.combat.activeEnemies.length > 0) {
    const activeEnemy = newState.combat.activeEnemies[0];
    
    // Check Stun
    const enemyStunned = activeEnemy.activeEffects.find(e => e.type === 'STUNNED');
    
    if (enemyStunned) {
        logs.push(`${activeEnemy.name} is stunned!`);
        // Remove stun
        activeEnemy.activeEffects = activeEnemy.activeEffects.filter(e => e.type !== 'STUNNED');
    } else {
        // Attack
        const { damage } = calculateDamage(activeEnemy, player);
        let finalDmg = damage;
        
        if (action === 'DEFEND') finalDmg = Math.max(0, Math.floor(damage / 2));
        
        finalDmg = Math.floor(finalDmg);
        player.hp = Math.floor(Math.max(0, player.hp - finalDmg));
        
        logs.push(`${activeEnemy.name} attacks you for ${finalDmg} damage.`);

        // Clean up Enemy Buffs/Debuffs (Blindness lasts 1 turn)
        activeEnemy.activeEffects = activeEnemy.activeEffects.filter(e => e.type !== 'BLINDED');

        if (player.hp <= 0) {
            logs.push("You have fallen in battle...");
            return { newState, logs, playerWon: false, playerDied: true };
        }
    }
  }

  newState.party = newState.party.map(p => p.id === player.id ? player : p);

  return { newState, logs, playerWon: false, playerDied: false };
};

export const getAvatarUrl = (entity?: Character | Enemy): string => {
  if (!entity) return "https://picsum.photos/seed/void/200";
  // Fallback to name hash since visualCue is removed
  const seed = entity.name.replace(/\s/g, '') + (entity.isPlayer ? 'player' : 'enemy');
  return `https://picsum.photos/seed/${seed}/200`;
};

export const getDeterministicActions = (cell: MapCell): SpecialAction[] => {
  const actions: SpecialAction[] = [];

  if (cell.type === 'DUNGEON') {
      actions.push({
          label: 'Enter Dungeon',
          action: 'ENTER_DUNGEON',
          description: 'Descend into the depths of this location.',
          iconType: 'INTERACT',
          objectId: 'dungeon_entrance'
      });
  }

  if (!cell.objects || cell.objects.length === 0) return actions;

  const objectActions = cell.objects
    .filter(obj => {
        if ((obj.type === 'LOOT' || obj.type === 'RESOURCE') && obj.hasInteracted) return false;
        if (!obj.id) return false;
        return true;
    })
    .flatMap((obj): SpecialAction[] => {
      // Lazy load logic: if description is empty, show prompt to interact
      const desc = obj.isDetailed ? obj.description : "Interact to examine and reveal details.";
      const baseAction = {
          objectId: obj.id,
          description: desc
      };
      
      switch (obj.type) {
        case 'MERCHANT':
          return [{
            ...baseAction,
            label: 'Shop',
            action: `I want to trade with ${obj.name}.`,
            iconType: 'SHOP'
          }];
        case 'HEALER':
          return [{
            ...baseAction,
            label: 'Heal',
            action: `I ask ${obj.name} for healing.`,
            iconType: 'REST'
          }];
        case 'APPRAISER':
          return [{
            ...baseAction,
            label: 'Appraise',
            action: `I visit the appraiser ${obj.name}.`,
            iconType: 'APPRAISE'
          }];
        case 'NPC':
          return [
              {
                ...baseAction,
                label: 'Chat',
                action: `I talk to ${obj.name}.`,
                iconType: 'TALK'
              },
              {
                ...baseAction,
                label: 'Recruit',
                action: `I attempt to recruit ${obj.name} to my party.`,
                iconType: 'RECRUIT'
              }
          ];
        case 'RESOURCE':
          return [{
            ...baseAction,
            label: 'Harvest',
            action: `I harvest ${obj.name}.`,
            iconType: 'GATHER'
          }];
        case 'LOOT':
          return [{
            ...baseAction,
            label: 'Open',
            action: `I open the ${obj.name}.`,
            iconType: 'INTERACT'
          }];
        case 'OBSTACLE':
        default:
          return [{
            ...baseAction,
            label: 'Inspect',
            action: `I examine the ${obj.name}.`,
            iconType: 'INTERACT'
          }];
      }
    });
    
  return [...actions, ...objectActions] as SpecialAction[];
};