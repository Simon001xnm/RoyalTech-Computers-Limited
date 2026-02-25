
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MapComponent } from "./map-component";
import type { Laptop } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocateFixed, WifiOff, LaptopIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from "firebase/firestore";

export function TrackingClient() {
  const [selectedLaptopId, setSelectedLaptopId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const laptopsCollection = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'laptops'), where('status', 'in', ['Leased', 'Repair']));
  }, [firestore, user]);
  const { data: trackableLaptops, isLoading: trackableLaptopsLoading } = useCollection<Laptop>(laptopsCollection);

  const isLoading = isUserLoading || trackableLaptopsLoading;

  const laptopsWithLocation = useMemo(() => 
    trackableLaptops?.filter(laptop => laptop.location), 
  [trackableLaptops]);

  const selectedLaptopDetails = useMemo(() => 
    trackableLaptops?.find(laptop => laptop.id === selectedLaptopId),
  [trackableLaptops, selectedLaptopId]);
  
  useEffect(() => {
    if (!selectedLaptopId && laptopsWithLocation && laptopsWithLocation.length > 0) {
      setSelectedLaptopId(laptopsWithLocation[0].id);
    }
  }, [laptopsWithLocation, selectedLaptopId]);


  if (isLoading) {
    return (
        <>
            <PageHeader
                title="Laptop Tracking"
                description="View the last known location of leased or in-repair laptops."
            />
            <p>Loading trackable laptops...</p>
        </>
    )
  }

  return (
    <>
      <PageHeader
        title="Laptop Tracking"
        description="View the last known location of leased or in-repair laptops."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <MapComponent laptops={trackableLaptops || []} selectedLaptopId={selectedLaptopId} />
        </div>
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Select Laptop</CardTitle>
                    <CardDescription>Choose a laptop to view its location.</CardDescription>
                </CardHeader>
                <CardContent>
                    {laptopsWithLocation && laptopsWithLocation.length > 0 ? (
                        <Select onValueChange={setSelectedLaptopId} value={selectedLaptopId || undefined}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a trackable laptop" />
                            </SelectTrigger>
                            <SelectContent>
                                {laptopsWithLocation.map((laptop) => (
                                <SelectItem key={laptop.id} value={laptop.id}>
                                    {laptop.model} (S/N: {laptop.serialNumber})
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Alert>
                            <LaptopIcon className="h-4 w-4" />
                            <AlertTitle>No Trackable Laptops</AlertTitle>
                            <AlertDescription>
                                There are no laptops currently marked as 'Leased' or 'Repair' with location data.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {selectedLaptopDetails && selectedLaptopDetails.location && (
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Laptop Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold">{selectedLaptopDetails.model}</h3>
                            <p className="text-sm text-muted-foreground">S/N: {selectedLaptopDetails.serialNumber}</p>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Status: </span> 
                            <Badge variant={selectedLaptopDetails.status === 'Leased' ? 'default' : 'destructive'}>{selectedLaptopDetails.status}</Badge>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Location: </span>
                            <span className="text-muted-foreground">Lat: {selectedLaptopDetails.location.lat.toFixed(4)}, Lng: {selectedLaptopDetails.location.lng.toFixed(4)}</span>
                        </div>
                         <p className="text-xs text-muted-foreground pt-2">
                            Note: Location data is for demonstration and may not be real-time.
                        </p>
                    </CardContent>
                </Card>
            )}
             {selectedLaptopDetails && !selectedLaptopDetails.location && (
                <Alert variant="default">
                    <LocateFixed className="h-4 w-4" />
                    <AlertTitle>Location Not Available</AlertTitle>
                    <AlertDescription>
                        The selected laptop ({selectedLaptopDetails.model}) does not have location data available.
                    </AlertDescription>
                </Alert>
             )}
        </div>
      </div>
    </>
  );
}
