"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY_PLACEHOLDER } from "@/lib/constants";
import type { Asset } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface MapComponentProps {
  assets: Pick<Asset, "id" | "model" | "location" | "status">[];
  selectedAssetId?: string | null;
}

const defaultCenter = { lat: 51.5074, lng: 0.1278 }; // London

export function MapComponent({ assets, selectedAssetId }: MapComponentProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Check if a key is available in env vars, otherwise fallback to placeholder
    setApiKey(GOOGLE_MAPS_API_KEY_PLACEHOLDER);
  }, []);

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const centerPosition = selectedAsset?.location || defaultCenter;
  const zoomLevel = selectedAsset?.location ? 14 : 8;

  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Google Maps API Key Missing</AlertTitle>
        <AlertDescription>
          Please provide a Google Maps API key in `src/lib/constants.ts` to enable tracking functionality.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (apiKey === GOOGLE_MAPS_API_KEY_PLACEHOLDER) {
     return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Placeholder API Key Detected</AlertTitle>
        <AlertDescription>
          The Google Maps functionality requires a valid API key. Map tracking is currently disabled.
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
            mapId="asset-tracking-map"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
          >
            {assets.map((asset) =>
              asset.location ? (
                <AdvancedMarker
                  key={asset.id}
                  position={asset.location}
                  title={`${asset.model} (${asset.status})`}
                >
                   <MapPin className={`h-8 w-8 ${asset.id === selectedAssetId ? 'text-primary' : 'text-foreground/70'}`} />
                </AdvancedMarker>
              ) : null
            )}
          </Map>
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground animate-pulse">Initializing map...</p>
            </div>
        )}
      </div>
    </APIProvider>
  );
}
