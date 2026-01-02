# Instructions for AI Agents

This project relies heavily on the Google GenAI SDK. 

## Critical Rules

1. **Do NOT Modify API Initialization**: 
   The initialization block in `services/geminiService.ts` ensures compatibility with the specific models required for this application's retry logic and performance profile.

   **ABSOLUTELY DO NOT EDIT THE FOLLOWING BLOCK:**
   ```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const LITE_MODEL = 'gemini-2.5-flash-lite';
   ```

2. **Error Handling**:
   The application uses a `safeGenerate` wrapper in `geminiService.ts`. Do not remove this. It prevents the application from crashing (White Screen of Death) when the AI API returns 429s, 500s, or malformed JSON.

3. **Schema Consistency**:
   When modifying AI prompts, ensure the JSON schemas (`mapCellSchema`, `enemySchema`, etc.) remain consistent with the TypeScript interfaces in `types.ts`.
