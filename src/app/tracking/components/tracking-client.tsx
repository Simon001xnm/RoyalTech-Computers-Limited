"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MapComponent } from "./map-component";
import type { Asset } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocateFixed, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useSaaS } from "@/components/saas/saas-provider";
import { SubscriptionGuard } from "@/components/saas/subscription-guard";

export function TrackingClient() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();

  // CLOUD QUERY: Leased assets for tracking
  const trackableQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(
        collection(firestore, 'assets'),
        where('tenantId', '==', tenant.id),
        where('status', 'in', ['Leased', 'Repair'])
    );
  }, [firestore, tenant?.id]);

  const { data: trackableAssets, isLoading } = useCollection(trackableQuery);

  const assetsWithLocation = useMemo(() => 
    (trackableAssets || []).filter(asset => asset.location), 
  [trackableAssets]);

  const selectedAssetDetails = useMemo(() => 
    trackableAssets?.find(asset => asset.id === selectedAssetId),
  [trackableAssets, selectedAssetId]);
  
  useEffect(() => {
    if (!selectedAssetId && assetsWithLocation && assetsWithLocation.length > 0) {
      setSelectedAssetId(assetsWithLocation[0].id);
    }
  }, [assetsWithLocation, selectedAssetId]);


  if (isLoading) {
    return (
        <div className="space-y-6">
            <PageHeader title="Asset Tracking" description="Acquiring GPS data from the cloud..." />
            <p className="text-center py-12 text-muted-foreground animate-pulse">Syncing location coordinates...</p>
        </div>
    )
  }

  return (
    <SubscriptionGuard requiredTier="pro" feature="Live GPS Tracking">
      <PageHeader title="Cloud Asset Tracking" description="Visualizing the current location of leased and in-repair units." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <MapComponent assets={trackableAssets || []} selectedAssetId={selectedAssetId} />
        </div>
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader><CardTitle>Select Unit</CardTitle><CardDescription>Monitor a specific device.</CardDescription></CardHeader>
                <CardContent>
                    {assetsWithLocation.length > 0 ? (
                        <Select onValueChange={setSelectedAssetId} value={selectedAssetId || undefined}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Search trackable units..." /></SelectTrigger>
                            <SelectContent>{assetsWithLocation.map((asset) => (<SelectItem key={asset.id} value={asset.id}>{asset.model} ({asset.serialNumber})</SelectItem>))}</SelectContent>
                        </Select>
                    ) : (
                        <Alert><Package className="h-4 w-4" /><AlertTitle>No Data</AlertTitle><AlertDescription>No units in this node have active GPS data.</AlertDescription></Alert>
                    )}
                </CardContent>
            </Card>

            {selectedAssetDetails && selectedAssetDetails.location && (
                 <Card className="shadow-lg">
                    <CardHeader><CardTitle>Unit Metadata</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div><h3 className="text-lg font-bold">{selectedAssetDetails.model}</h3><p className="text-xs font-mono opacity-60">S/N: {selectedAssetDetails.serialNumber}</p></div>
                        <div className="text-sm"><span className="font-medium">Status: </span><Badge variant={selectedAssetDetails.status === 'Leased' ? 'default' : 'destructive'}>{selectedAssetDetails.status}</Badge></div>
                        <div className="text-[10px] font-mono p-2 bg-muted rounded">LOC: {selectedAssetDetails.location.lat.toFixed(6)}, {selectedAssetDetails.location.lng.toFixed(6)}</div>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}
