
'use server';
/**
 * @fileOverview Saymoh AI Chat Flow
 *
 * This flow handles interactions with Saymoh, the autonomous business agent.
 * It uses tools to query the business's data (inventory, sales, customers) 
 * to provide accurate, real-time intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

const ChatInputSchema = z.object({
  message: z.string().describe('The user\'s question or instruction.'),
  tenantId: z.string().describe('The current business node ID.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional().describe('Previous chat history.')
});

const ChatOutputSchema = z.object({
  response: z.string().describe('Saymoh\'s textual response.'),
  suggestedActions: z.array(z.string()).optional().describe('Recommended next steps.')
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * TOOL: getInventoryStatus
 */
const getInventoryStatus = ai.defineTool(
  {
    name: 'getInventoryStatus',
    description: 'Returns a summary of the current stock and item counts for this shop.',
    inputSchema: z.object({ tenantId: z.string() }),
    outputSchema: z.object({ totalItems: z.number(), items: z.array(z.string()) }),
  },
  async ({ tenantId }) => {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'assets'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => `${d.data().model} (${d.data().status})`);
    return { totalItems: snap.size, items: items.slice(0, 10) };
  }
);

/**
 * TOOL: getRecentSalesSummary
 */
const getRecentSalesSummary = ai.defineTool(
  {
    name: 'getRecentSalesSummary',
    description: 'Returns the latest sales figures for accounting reconciliation.',
    inputSchema: z.object({ tenantId: z.string() }),
    outputSchema: z.object({ totalRevenue: z.number(), recentCount: z.number() }),
  },
  async ({ tenantId }) => {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'sales_transactions'), where('tenantId', '==', tenantId), limit(20));
    const snap = await getDocs(q);
    let totalRevenue = 0;
    snap.docs.forEach(d => totalRevenue += (d.data().amount || 0));
    return { totalRevenue, recentCount: snap.size };
  }
);

/**
 * TOOL: getClientCount
 */
const getClientCount = ai.defineTool(
  {
    name: 'getClientCount',
    description: 'Returns the total number of registered customers in the CRM.',
    inputSchema: z.object({ tenantId: z.string() }),
    outputSchema: z.number(),
  },
  async ({ tenantId }) => {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'customers'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    return snap.size;
  }
);

/**
 * SAYMOH AI PROMPT
 */
const saymohPrompt = ai.definePrompt({
  name: 'saymohPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  tools: [getInventoryStatus, getRecentSalesSummary, getClientCount],
  system: `You are Saymoh, the autonomous AI agent for the ShopManager business suite.
  
Your goal is to provide professional, data-driven intelligence to the shop owner.
You have access to the business's real-time cloud data via tools.

Key Instructions:
1. Always maintain a professional, helpful, and concise tone.
2. Use the provided tools when the user asks about stock, sales, or customers.
3. If an action isn't clear, ask for clarification.
4. Keep fonts small and manageable in your descriptions (conceptualize your output for a high-density UI).
5. Address the business as "this node" or "your shop".

Today is {{{currentDate}}}.
The current business node is {{{tenantId}}}.`,
  prompt: `User says: {{{message}}}
  
Context:
{{#if history}}
Previous conversation:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}`
});

/**
 * EXPORTED FLOW WRAPPER
 */
export async function askSaymoh(input: ChatInput): Promise<ChatOutput> {
  const flow = ai.defineFlow(
    {
      name: 'saymohChatFlow',
      inputSchema: ChatInputSchema,
      outputSchema: ChatOutputSchema,
    },
    async (input) => {
      const { output } = await saymohPrompt({
        ...input,
        currentDate: new Date().toLocaleDateString()
      });
      return output!;
    }
  );
  return flow(input);
}
