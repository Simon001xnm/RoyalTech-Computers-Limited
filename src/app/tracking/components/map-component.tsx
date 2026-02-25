"use client";

import { APIProvider, Map, Marker, AdvancedMarker } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY_PLACEHOLDER } from "@/lib/constants";
import type { Laptop } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface MapComponentProps {
  laptops: Pick<Laptop, "id" | "model" | "location" | "status">[];
  selectedLaptopId?: string | null;
}

const defaultCenter = { lat: 51.5074, lng: 0.1278 }; // London

export function MapComponent({ laptops, selectedLaptopId }: MapComponentProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // In a real app, fetch this from a secure backend or environment variable
    // For this scaffold, we'll use the placeholder directly
    // If you have a real key, you can set it here or via an env var on the client for demo
    // e.g., setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
    setApiKey(GOOGLE_MAPS_API_KEY_PLACEHOLDER);
  }, []);

  const selectedLaptop = laptops.find(l => l.id === selectedLaptopId);
  const centerPosition = selectedLaptop?.location || defaultCenter;
  const zoomLevel = selectedLaptop?.location ? 14 : 8;

  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Google Maps API Key Missing</AlertTitle>
        <AlertDescription>
          Please provide a Google Maps API key in `src/lib/constants.ts` (or via environment variables) to enable map functionality.
          The map is currently disabled.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Check if API key is still the placeholder
  if (apiKey === GOOGLE_MAPS_API_KEY_PLACEHOLDER) {
     return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Placeholder API Key Detected</AlertTitle>
        <AlertDescription>
          The Google Maps functionality requires a valid API key. 
          Please replace <code className="font-mono bg-muted px-1 py-0.5 rounded">YOUR_GOOGLE_MAPS_API_KEY</code> in your configuration.
          Map functionality is disabled.
        </AlertDescription>
      </Alert>
    );
  }


  return (
    <APIProvider apiKey={apiKey} onLoad={() => setMapReady(true)}>
      <div style={{ height: "600px", width: "100%" }} className="rounded-lg overflow-hidden border shadow-md bg-muted">
        {mapReady ? (
          <Map
            defaultCenter={centerPosition}
            defaultZoom={zoomLevel}
            center={centerPosition}
            zoom={zoomLevel}
            mapId="royaltech-map"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
          >
            {laptops.map((laptop) =>
              laptop.location ? (
                <AdvancedMarker
                  key={laptop.id}
                  position={laptop.location}
                  title={`${laptop.model} (${laptop.status})`}
                >
                   <MapPin className={`h-8 w-8 ${laptop.id === selectedLaptopId ? 'text-primary' : 'text-foreground/70'}`} />
                </AdvancedMarker>
              ) : null
            )}
          </Map>
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        )}
      </div>
    </APIProvider>
  );
}
