
import type { Metadata } from 'next';
import { ChatClient } from './components/chat-client';

export const metadata: Metadata = {
  title: 'SalesIQ',
  description: 'Live chat and visitor tracking for RoyalTech.',
};

export default function SalesiqPage() {
  return <ChatClient />;
}

