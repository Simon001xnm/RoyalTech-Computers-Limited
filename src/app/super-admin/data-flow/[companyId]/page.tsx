'use client';

import { SiloInspectionClient } from '../../components/silo-inspection-client';

export default function SiloInspectionPage({ params }: { params: { companyId: string } }) {
    return <SiloInspectionClient companyId={params.companyId} />;
}
