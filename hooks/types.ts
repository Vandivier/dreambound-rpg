import React from 'react';
import { GameState, AIResponse, EncyclopediaEntry } from '../types';

export interface ActionContext {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  addToLog: (text: string, type: 'story' | 'action' | 'combat') => void;
  activeRequestId: React.MutableRefObject<number>;
}

export interface CoreActions {
  awardXpToParty: (currentParty: any[], amount: number) => any[];
  updateIntuitionQuests: (current: GameState, eventType: string, val?: any) => any[];
  handleAIResponseUpdates: (response: AIResponse & { generatedItems?: EncyclopediaEntry[] }, isCombatTrigger: boolean, originId?: string) => Promise<void>;
  triggerEndingSequence: (currentState: GameState) => Promise<void>;
  finalizeRecruit: () => Promise<void>;
  cancelRecruit: () => void;
}