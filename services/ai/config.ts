import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
export const PRIMARY_MODEL = 'gemini-3-flash-preview';
export const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
export const LITE_MODEL = 'gemini-2.5-flash-lite';

export const KEY_PLOT_QUESTIONS = "Is this world real or a dream? If it is real, can I return to life before the dream or am I stuck here?";

// Config to prevent infinite loops (300k+ chars)
const MODEL_CONFIG = {
    maxOutputTokens: 4_000,
    thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed and to reserve tokens for output
    candidateCount: 1,
};

export const SYSTEM_INSTRUCTION = `
You are the Game Master for an RPG.
This narrative world strongly emphasizes high magic, fantasy, and isekai.
Touches of mystery, spirituality, science, and technology are welcome as well.
Maintain narrative consistency with the provided history.
If player moves seem illegitimate, you are free to flatly declare the move is not allowed.
Description text values should be concise, between one and three sentences.

Recruitment Logic:
If the player attempts to recruit an NPC and the narrative supports it (e.g. they persuade them, pay them, or help them), set 'recruitTriggered' to true in your response schema and provide the name of the recruit.
`;

// --- SYSADMIN LOGGING ---
export interface SysadminLogEntry {
    timestamp: string;
    type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'ACTION';
    details: any;
}

const LOG_LIMIT = 50;
export const sysadminLogs: SysadminLogEntry[] = [];

export const addSysadminLog = (type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'ACTION', details: any) => {
    try {
        const entry: SysadminLogEntry = {
            timestamp: new Date().toISOString(),
            type,
            details
        };
        sysadminLogs.unshift(entry);
        if (sysadminLogs.length > LOG_LIMIT) sysadminLogs.pop();
    } catch (e) {
        console.error("Failed to add sysadmin log", e);
    }
};
// ------------------------

export const cleanJson = (text: string) => {
    return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};

// Helper for 429 retries AND incomplete responses
export const generateContentWithRetry = async (
    modelName: string, 
    params: any, 
    retryState: { quotaRetried?: boolean, finishReasonRetried?: boolean } = {}
): Promise<any> => {
    // Log Request
    addSysadminLog('REQUEST', { model: modelName, params, retryState });

    try {
        // Merge default config with params.config, allowing params to override
        const finalConfig = {
            ...MODEL_CONFIG,
            // ...(modelName === PRIMARY_MODEL ? {frequencyPenalty: 1.5} : {}),
            ...(params.config || {}),
        };
        
        const result = await ai.models.generateContent({
            model: modelName,
            ...params,
            config: finalConfig
        });

        // Check for finishReason
        const candidate = result.candidates?.[0];
        if (candidate && candidate.finishReason !== "STOP") {
            console.warn(`[${modelName}] Generation interrupted. Reason: ${candidate.finishReason}.`);
            addSysadminLog('ERROR', { model: modelName, error: `FinishReason: ${candidate.finishReason}`, result });
            
            if (!retryState.finishReasonRetried) {
                console.log(`Retrying request due to incomplete response...`);
                return generateContentWithRetry(modelName, params, { ...retryState, finishReasonRetried: true });
            } else {
                console.error("Response incomplete after retry. Returning truncated result.");
                return result; 
            }
        }
        
        // Log Success
        addSysadminLog('RESPONSE', { model: modelName, result });
        return result;
    } catch (error: any) {
        // Log Error
        addSysadminLog('ERROR', { model: modelName, error: error.message || String(error), stack: error.stack });

        // Broad check for 429 or quota related messages
        const errorMsg = error?.message?.toLowerCase() || '';
        const isQuota = error?.status === 429 || error?.code === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exceeded');

        if (isQuota && !retryState.quotaRetried) {
            console.warn(`Quota limit hit on ${modelName}. Pausing 1s then retrying with ${FALLBACK_MODEL}...`);
            // Wait 1 second to let quota bucket refill
            await new Promise(resolve => setTimeout(resolve, 1000));
            return generateContentWithRetry(FALLBACK_MODEL, params, { ...retryState, quotaRetried: true });
        }
        
        console.error("Gemini API Fatal Error:", error);
        throw error;
    }
};

// Safe wrapper that returns a glitch response instead of throwing
export const safeGenerate = async <T>(caller: string, generator: () => Promise<T>, fallback: T): Promise<T> => {
    try {
        return await generator();
    } catch (e: any) {
        // Truncate massive error messages (like 300k char JSONs)
        const msg = e.message || String(e);
        const truncatedMsg = msg.length > 500 ? msg.substring(0, 500) + "...(truncated)" : msg;
        
        console.error(`[${caller}] Recovering from AI error with fallback data. Error:`, truncatedMsg);
        return fallback;
    }
};
