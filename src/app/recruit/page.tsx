
import type { Metadata } from 'next';
import { RecruitClient } from './components/recruit-client';

export const metadata: Metadata = {
  title: 'Recruitment',
  description: 'Recruitment and applicant tracking for RoyalTech.',
};

export default function RecruitPage() {
  return <RecruitClient />;
}

