
import type { Metadata } from 'next';
import { SolutionsClient } from './components/solutions-client';
import { MarketingWrapper } from '@/components/marketing/marketing-wrapper';

export const metadata: Metadata = {
  title: 'Digital Solutions & Software Services | Business Hub Kenya',
  description: 'Explore the complete range of digital solutions from Business Hub. School management systems, POS, inventory, and professional technology services for Kenyan organizations.',
  keywords: [
    "School Management System Kenya",
    "Hospital Management Software Nairobi",
    "Digital Billing Solutions Kenya",
    "Software Development Services Nairobi",
    "Business Hub Solutions"
  ]
};

export default function SolutionsPage() {
  return (
    <MarketingWrapper>
        <SolutionsClient />
    </MarketingWrapper>
  );
}
