'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

// Import dynamique pour éviter les erreurs SSR avec MapLibre
const Map = dynamic(
  () => import('react-map-gl/maplibre').then((mod) => mod.Map),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-map-gl/maplibre').then((mod) => mod.Marker),
  { ssr: false }
);

interface MapViewProps {
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

// Fonction pour obtenir des coordonnées par défaut pour les lieux connus
function getDefaultCoordinates(location: string): { lat: number; lng: number } {
  const locationMap: Record<string, { lat: number; lng: number }> = {
    'cotonou': { lat: 6.3703, lng: 2.3912 },
    'porto-novo': { lat: 6.4969, lng: 2.6289 },
    'benin': { lat: 9.3077, lng: 2.3158 },
    'lome': { lat: 6.1725, lng: 1.2314 },
    'accra': { lat: 5.6037, lng: -0.1870 },
    'lagos': { lat: 6.5244, lng: 3.3792 },
    'abidjan': { lat: 5.3600, lng: -4.0083 },
    'ouagadougou': { lat: 12.3714, lng: -1.5197 },
    'bamako': { lat: 12.6392, lng: -8.0029 },
    'dakar': { lat: 14.6928, lng: -17.4467 },
  };

  const normalizedLocation = location.toLowerCase().trim();

  // Recherche exacte
  if (locationMap[normalizedLocation]) {
    return locationMap[normalizedLocation];
  }

  // Recherche partielle
  for (const [key, coords] of Object.entries(locationMap)) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      return coords;
    }
  }

  // Coordonnées par défaut (centre de l'Afrique de l'Ouest)
  return { lat: 8.0, lng: 2.0 };
}

export function MapView({ location, coordinates, zoom = 13 }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Utilise les coordonnées fournies ou obtient des coordonnées par défaut
  const mapCoordinates = coordinates || getDefaultCoordinates(location);

  // Utiliser un style de carte gratuit sans clé API
  const mapStyleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";


  if (!isClient) {
    // Placeholder pendant le rendu côté serveur
    return (
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <MapPin className="h-5 w-5" />
            Carte - {location}
          </h3>
        </div>
        <div className="p-4">
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <MapPin className="h-5 w-5" />
          Carte - {location}
        </h3>
      </div>
      <div className="p-4">
        <div className="aspect-video rounded-md overflow-hidden">
          <Map
            initialViewState={{
              longitude: mapCoordinates.lng,
              latitude: mapCoordinates.lat,
              zoom: zoom
            }}
            // MODIFICATION CLÉ : Utiliser un style de carte plus détaillé
            mapStyle={mapStyleUrl}
            style={{ height: '100%', width: '100%' }}
          >
            <Marker longitude={mapCoordinates.lng} latitude={mapCoordinates.lat}>
              <div className="bg-red-500 text-white px-2 py-1 rounded-md shadow-lg text-xs font-medium">
                📍 {location}
              </div>
            </Marker>
          </Map>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {coordinates ? (
            <>Coordonnées: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</>
          ) : (
            <>Lieu détecté automatiquement</>
          )}
        </div>
      </div>
    </div>
  );
}