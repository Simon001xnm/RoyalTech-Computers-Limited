
import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization using the modern Google AI plugin.
 * Synchronized with Genkit core v1.39.x.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
