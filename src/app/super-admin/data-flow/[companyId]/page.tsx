'use client';

import { SiloInspectionClient } from '../../components/silo-inspection-client';
import { use } from 'react';

/**
 * @fileOverview Silo Inspection Page
 * Unwraps dynamic route params as a Promise for Next.js 15 compatibility.
 */
export default function SiloInspectionPage({ params }: { params: Promise<{ companyId: string }> }) {
    const { companyId } = use(params);
    return <SiloInspectionClient companyId={companyId} />;
}
