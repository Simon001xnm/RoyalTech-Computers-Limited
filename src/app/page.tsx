
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { useUser } from '@/firebase/provider';
import { APP_NAME } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your information..." />
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.displayName || 'User'}!`} 
      />
      <Card>
        <CardHeader>
            <CardTitle>Welcome to {APP_NAME}</CardTitle>
            <CardDescription>This is your central hub. All modules are available via the sidebar.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>You can manage your profile settings by clicking on your avatar in the bottom-left corner.</p>
        </CardContent>
      </Card>
    </div>
  );
}
