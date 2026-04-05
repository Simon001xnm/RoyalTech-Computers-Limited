"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MapComponent } from "./map-component";
import type { Asset } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocateFixed, LaptopIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@/firebase/provider';
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";

export function TrackingClient() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();

  // Fetch trackable assets from local Dexie database
  const trackableAssets = useLiveQuery(async () => {
    if (!user) return [];
    // Only track assets that are leased or in repair
    return await db.assets
      .filter(a => ['Leased', 'Repair'].includes(a.status))
      .toArray();
  }, [user]);

  const isLoading = isUserLoading || trackableAssets === undefined;

  const assetsWithLocation = useMemo(() => 
    trackableAssets?.filter(asset => asset.location), 
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
        <>
            <PageHeader
                title="Asset Tracking"
                description="View the last known location of leased or in-repair assets."
            />
            <p>Loading trackable assets...</p>
        </>
    )
  }

  return (
    <>
      <PageHeader
        title="Asset Tracking (Local)"
        description="View the last known location of leased or in-repair assets."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <MapComponent laptops={trackableAssets || []} selectedLaptopId={selectedAssetId} />
        </div>
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Select Asset</CardTitle>
                    <CardDescription>Choose a device to view its location.</CardDescription>
                </CardHeader>
                <CardContent>
                    {assetsWithLocation && assetsWithLocation.length > 0 ? (
                        <Select onValueChange={setSelectedAssetId} value={selectedAssetId || undefined}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a trackable device" />
                            </SelectTrigger>
                            <SelectContent>
                                {assetsWithLocation.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                    {asset.model} (S/N: {asset.serialNumber})
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Alert>
                            <LaptopIcon className="h-4 w-4" />
                            <AlertTitle>No Trackable Assets</AlertTitle>
                            <AlertDescription>
                                There are no assets currently marked as 'Leased' or 'Repair' with location data in your local records.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {selectedAssetDetails && selectedAssetDetails.location && (
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Asset Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold">{selectedAssetDetails.model}</h3>
                            <p className="text-sm text-muted-foreground">S/N: {selectedAssetDetails.serialNumber}</p>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Status: </span> 
                            <Badge variant={selectedAssetDetails.status === 'Leased' ? 'default' : 'destructive'}>{selectedAssetDetails.status}</Badge>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Location: </span>
                            <span className="text-muted-foreground">Lat: {selectedAssetDetails.location.lat.toFixed(4)}, Lng: {selectedAssetDetails.location.lng.toFixed(4)}</span>
                        </div>
                         <p className="text-xs text-muted-foreground pt-2">
                            Note: Location data is retrieved from your local device database.
                        </p>
                    </CardContent>
                </Card>
            )}
             {selectedAssetDetails && !selectedAssetDetails.location && (
                <Alert variant="default">
                    <LocateFixed className="h-4 w-4" />
                    <AlertTitle>Location Not Available</AlertTitle>
                    <AlertDescription>
                        The selected asset ({selectedAssetDetails.model}) does not have location data available locally.
                    </AlertDescription>
                </Alert>
             )}
        </div>
      </div>
    </>
  );
}
