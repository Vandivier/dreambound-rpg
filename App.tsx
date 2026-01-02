import React, { useState, useEffect } from 'react';
import { GameState, GameStatus, Gender, Quest } from './types';
import { INITIAL_GAME_STATE, INTUITION_QUESTS } from './constants';
import MainMenu from './components/MainMenu';
import GameInterface from './components/GameInterface';
import { startNewGame, generateCharacterClass } from './services/geminiService';
import Button from './components/Button';

const SAVE_KEY = 'dreambound_save_v1';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [hasSave, setHasSave] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Check for save on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) setHasSave(true);
  }, []);

  // Auto-save whenever gameState changes (except in Menu/Loading), with safety check
  useEffect(() => {
    if (gameState.status !== GameStatus.MENU && gameState.status !== GameStatus.CREATION && gameState.status !== GameStatus.LOADING) {
        
        // Safety Check: Read current save to ensure we don't overwrite with stale state
        const savedRaw = localStorage.getItem(SAVE_KEY);
        let shouldSave = true;

        if (savedRaw) {
            try {
                const savedState = JSON.parse(savedRaw);
                // If the current state is older than the saved state, do NOT save.
                // This prevents issues where a race condition or bug resets state.
                if (savedState.turnCount > gameState.turnCount) {
                    console.warn("Prevented save overwrite: Current state is older than saved state.");
                    shouldSave = false;
                }
            } catch (e) {
                // If save is corrupt, we overwrite it.
                console.error("Corrupt save file found, overwriting.");
            }
        }

        if (shouldSave) {
            const stateToSave = { ...gameState };
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
            setHasSave(true);
        }
    }
  }, [gameState]);

  const handleNewGame = async (name: string, gender: Gender) => {
    setIsInitializing(true);
    setInitError(null);
    try {
      // 1. Generate Class (D20 roll for Stock or AI)
      const charClass = await generateCharacterClass();

      // 2. Setup Player Object with Class Stats
      const player = {
        ...INITIAL_GAME_STATE.player,
        name,
        class: charClass.name,
        // Apply class stat modifiers to base stats
        hp: INITIAL_GAME_STATE.player.maxHp + charClass.stats.hp,
        maxHp: INITIAL_GAME_STATE.player.maxHp + charClass.stats.hp,
        atk: INITIAL_GAME_STATE.player.atk + charClass.stats.atk,
        def: INITIAL_GAME_STATE.player.def + charClass.stats.def,
        id: `player_${Date.now()}`,
        xp: 0
      };

      // 3. Pick random intuition quest
      const startingQuest = INTUITION_QUESTS[Math.floor(Math.random() * INTUITION_QUESTS.length)];

      // 4. Start Game Narrative (AI)
      const initialRes = await startNewGame(name, gender, charClass);
      
      const initialHistory = [initialRes.narrative];
      initialHistory.push(`New Quest Received: ${startingQuest.title}`);
      
      // Sanitize AI quests with 1d6 Major Logic
      const aiQuests = (initialRes.updates?.newQuests || []).map((q: any) => {
          const typeRoll = Math.floor(Math.random() * 6) + 1;
          const questType = typeRoll === 6 ? 'MAJOR' : 'MINOR';
          return {
              ...q,
              id: q.id || `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status: 'ACTIVE',
              type: questType
          };
      });

      aiQuests.forEach((q: Quest) => {
          initialHistory.push(`New Quest Received: ${q.title}`);
      });

      const newState: GameState = {
        ...INITIAL_GAME_STATE,
        player,
        party: [player],
        status: GameStatus.PLAYING,
        history: initialHistory,
        lastEventSummary: initialRes.narrative,
        inventory: [...INITIAL_GAME_STATE.inventory, ...(initialRes.updates?.newItems || [])],
        quests: [startingQuest, ...aiQuests]
      };

      setGameState(newState);
      // Auto-save effect will handle storage
    } catch (error) {
      console.error(error);
      setInitError("The dream refused to take shape. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLoadGame = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
          const parsed = JSON.parse(saved);
          
          // MIGRATION Logic: Check if currentSuggestion is a string (old format)
          if (typeof parsed.currentSuggestion === 'string') {
              parsed.currentSuggestion = { text: parsed.currentSuggestion };
          }
          
          setGameState(parsed);
      } catch (e) {
          console.error("Failed to load save", e);
          setHasSave(false);
      }
    }
  };

  const handleMainMenu = () => {
    setGameState(prev => ({ ...prev, status: GameStatus.MENU }));
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-amber-500">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="animate-pulse tracking-widest uppercase text-sm">Entering the Dream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {initError && gameState.status === GameStatus.MENU && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-lg border border-red-500 flex items-center gap-4">
            <span>{initError}</span>
            <Button onClick={() => setInitError(null)} className="text-xs py-1 h-auto bg-red-800 border-red-600">Dismiss</Button>
        </div>
      )}
      
      {gameState.status === GameStatus.MENU ? (
        <MainMenu 
          onNewGame={handleNewGame} 
          onLoadGame={handleLoadGame} 
          hasSave={hasSave} 
        />
      ) : (
        <GameInterface 
          state={gameState} 
          setState={setGameState} 
          onSave={() => { /* Auto-save handles this via useEffect, but we force an update to trigger it if needed */ setGameState({...gameState}) }}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
};

export default App;
