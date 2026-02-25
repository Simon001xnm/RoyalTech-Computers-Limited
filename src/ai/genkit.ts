import { config } from 'dotenv';
config();

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This file is now only responsible for Genkit AI initialization.
// All Firebase Admin logic has been moved to server-actions.ts to resolve credential conflicts.

export const ai = genkit({
  plugins: [googleAI()],
});
