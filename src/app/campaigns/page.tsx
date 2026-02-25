
import type { Metadata } from 'next';
import { CampaignsClient } from './components/campaigns-client';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Marketing campaign management for RoyalTech.',
};

export default function CampaignsPage() {
  return <CampaignsClient />;
}

