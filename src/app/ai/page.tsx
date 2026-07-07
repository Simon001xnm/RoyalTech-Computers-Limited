
import type { Metadata } from 'next';
import { AiClient } from './components/ai-client';

export const metadata: Metadata = {
  title: 'Saymoh AI',
  description: 'Autonomous business intelligence and assistant hub.',
};

export default function SaymohAiPage() {
  return <AiClient />;
}
