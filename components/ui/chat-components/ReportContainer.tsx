"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

// Types pour les données du rapport
export interface MatchedFeatureDetails {
  document?: string;
  featureId?: string | number;
  properties?: Record<string, unknown>;
  feature?: Feature<Polygon | MultiPolygon, Record<string, unknown>>;
  coordinates?: [number, number][][];
  crs?: { type?: string; properties?: Record<string, unknown> };
}

export interface LayerData {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][][]; // Format: [[lng, lat], [lng, lat], ...]
  intersects: boolean;
  description?: string;
  status?: string;
  matchedFeatures?: MatchedFeatureDetails[]; // GeoJSON features that matched (optionnel)
  crs?: { type?: string; properties?: Record<string, unknown> };
}

export interface ReportData {
  terrainCoordinates: [number, number][][]; // Format: [[lng, lat], [lng, lat], ...]
  layers: LayerData[];
  summary: {
    totalArea: number;
    intersectingLayers: number;
    status: string;
  };
}

export interface ReportContainerProps {
  reportData: ReportData;
}

// Composant pour afficher un élément de résultat
function ResultItem({ layer }: { layer: LayerData }) {
  const statusColor = layer.intersects ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  const statusIcon = layer.intersects ? '⚠️' : '✅';

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <div
          className="w-4 h-4 rounded border-2 border-gray-300"
          style={{ backgroundColor: layer.color }}
        />
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{layer.name}</h4>
      </div>
      <div className="space-y-1">
        <p className={`text-sm font-medium ${statusColor}`}>
          {statusIcon} {layer.intersects ? 'Intersection détectée' : 'Aucune intersection'}
        </p>
        {layer.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{layer.description}</p>
        )}
        {layer.status && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Statut: {layer.status}
          </p>
        )}
      </div>
    </div>
  );
}

// Composant pour la liste des résultats
function ResultsList({ layers }: { layers: LayerData[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Résultats d&apos;analyse
      </h3>
      <div className="space-y-3">
        {layers.map((layer) => (
          <ResultItem key={layer.id} layer={layer} />
        ))}
      </div>
    </div>
  );
}

// Composant pour la légende interactive (dropdown) qui n'affiche que les couches
// ayant un overlap avec la parcelle (intersects === true)
function MapLegend({
  layers,
  layerVisibility,
  onLayerToggle
}: {
  layers: LayerData[];
  layerVisibility: Record<string, boolean>;
  onLayerToggle: (layerId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Only show layers that intersect the parcel
  const overlapLayers = layers.filter(l => l.intersects === true);

  if (overlapLayers.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Couches ({overlapLayers.length})</span>
        </button>

        {open && (
          <div className="mt-2 w-64 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Couches intersectées — activer/désactiver</div>
            <div className="space-y-2">
              {overlapLayers.map(layer => (
                <div key={layer.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`layer-${layer.id}`}
                    checked={layerVisibility[layer.id] ?? true}
                    onChange={() => onLayerToggle(layer.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: layer.color }} />
                  <label htmlFor={`layer-${layer.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    {layer.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour la carte interactive avec MapLibre GL JS
function InteractiveMap({
  terrainCoordinates,
  layers,
  layerVisibility,
  onLayerToggle
}: {
  terrainCoordinates: [number, number][][];
  layers: LayerData[];
  layerVisibility: Record<string, boolean>;
  onLayerToggle: (layerId: string) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  // S'assurer que nous sommes côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculer le centre de la carte basé sur les coordonnées du terrain — on utilise
  // l'ordre des paires tel quel (raw) pour éviter toute transformation automatique.
  const mapCenter = useMemo(() => {
    if (terrainCoordinates.length === 0 || terrainCoordinates[0].length === 0) {
      return [2.3912, 6.3703]; // valeur par défaut en cas d'absence de coordonnées
    }

    const coords = terrainCoordinates[0];
    const xs = coords.map(coord => coord[0]);
    const ys = coords.map(coord => coord[1]);

    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    // On renvoie [x, y] dans le même ordre que les paires fournies par le backend
    return [centerX, centerY];
  }, [terrainCoordinates]);

  // Validate that coordinates are numeric pairs (no transformation here — we accept raw pairs).
  const hasValidCoordinatePairs = useMemo(() => {
    const checkPair = (p: unknown) => {
      if (!Array.isArray(p) || p.length < 2) return false;
      const a = p[0];
      const b = p[1];
      return typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b);
    };

    if (!terrainCoordinates || terrainCoordinates.length === 0) return false;
    for (const ring of terrainCoordinates) {
      for (const coord of ring) {
        if (!checkPair(coord)) return false;
      }
    }

    for (const layer of layers) {
      if (!layer.coordinates) continue;
      for (const ring of layer.coordinates) {
        for (const coord of ring) {
          if (!checkPair(coord)) return false;
        }
      }
    }

    return true;
  }, [terrainCoordinates, layers]);

  // Initialiser la carte
  useEffect(() => {
    if (!isClient || !mapContainer.current || map.current) return;

  // Do not initialize the map unless we have valid numeric coordinate pairs
  if (!hasValidCoordinatePairs) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: mapCenter as [number, number],
      zoom: 15
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Nettoyer lors du démontage
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isClient, mapCenter]);

  // Ajouter/mettre à jour les polygones
  useEffect(() => {
    if (!hasValidCoordinatePairs) return; // nothing to do when coords are invalid

    if (!map.current || !map.current.isStyleLoaded()) return;

    const mapInstance = map.current;

    // Supprimer les sources et couches existantes
    const existingSources = ['terrain-source'];
    layers.forEach(layer => existingSources.push(`layer-${layer.id}-source`));

    existingSources.forEach(sourceId => {
      if (mapInstance.getSource(sourceId)) {
        // Supprimer la couche avant la source
        const layerId = sourceId.replace('-source', '');
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getLayer(`${layerId}-stroke`)) {
          mapInstance.removeLayer(`${layerId}-stroke`);
        }
        mapInstance.removeSource(sourceId);
      }
    });

    // Ajouter le polygone du terrain utilisateur
    if (terrainCoordinates.length > 0 && terrainCoordinates[0].length > 0) {
      const terrainGeoJSON = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          // Use the raw coordinate pairs as provided by the backend — no swapping.
          coordinates: [terrainCoordinates[0].map(coord => [coord[0], coord[1]])]
        },
        properties: {
          name: 'Votre terrain'
        }
      };

      mapInstance.addSource('terrain-source', {
        type: 'geojson',
        data: terrainGeoJSON
      });

      // Couche de remplissage
      mapInstance.addLayer({
        id: 'terrain',
        type: 'fill',
        source: 'terrain-source',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.3
        }
      });

      // Couche de contour
      mapInstance.addLayer({
        id: 'terrain-stroke',
        type: 'line',
        source: 'terrain-source',
        paint: {
          'line-color': '#2563eb',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
    }

    // Ajouter les polygones des couches
    layers.forEach(layer => {
      if (layer.coordinates.length > 0 && layer.coordinates[0].length > 0) {
        const layerGeoJSON = {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            // Use raw coordinate pairs without any conversion
            coordinates: [layer.coordinates[0].map(coord => [coord[0], coord[1]])]
          },
          properties: {
            name: layer.name,
            description: layer.description,
            intersects: layer.intersects
          }
        };

        const sourceId = `layer-${layer.id}-source`;
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: layerGeoJSON
        });

        const isVisible = layerVisibility[layer.id] ?? true;

        // Couche de remplissage
        mapInstance.addLayer({
          id: `layer-${layer.id}`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': layer.color,
            'fill-opacity': isVisible ? 0.4 : 0.1
          }
        });

        // Couche de contour
        mapInstance.addLayer({
          id: `layer-${layer.id}-stroke`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': layer.color,
            'line-width': 2,
            'line-opacity': isVisible ? 0.8 : 0.2
          }
        });
      }
    });

    // Ajouter les popups au clic
    mapInstance.on('click', 'terrain', (e) => {
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<div class="text-sm"><strong>Votre terrain</strong></div>')
        .addTo(mapInstance);
    });

    layers.forEach(layer => {
      mapInstance.on('click', `layer-${layer.id}`, (e) => {
        const props = e.features![0].properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="text-sm">
              <strong>${props.name}</strong>
              ${props.description ? `<p>${props.description}</p>` : ''}
              <p class="text-xs mt-1">
                ${props.intersects ? 'Intersection détectée' : 'Aucune intersection'}
              </p>
            </div>
          `)
          .addTo(mapInstance);
      });

      // Changer le curseur sur hover
      mapInstance.on('mouseenter', `layer-${layer.id}`, () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', `layer-${layer.id}`, () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });

  }, [terrainCoordinates, layers, layerVisibility]);

  // Affichage de loading pendant que les composants se chargent
  if (!isClient) {
    return (
      <div className="relative h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // If coordinates are not geographic, show a helpful fallback instead of the map
  if (!hasValidCoordinatePairs) {
    return (
      <div className="p-6">
        <div className="mb-4 text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Les coordonnées fournies semblent être dans un système projeté (unités en mètres). La carte interactive nécessite des coordonnées géographiques (lat/lng en degrés). La représentation cartographique est désactivée.
        </div>

        <div className="mb-4">
          <h4 className="font-semibold">Aperçu des coordonnées (brutes)</h4>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-48">
            {JSON.stringify(terrainCoordinates, null, 2)}
          </pre>
        </div>

        <MapLegend
          layers={layers}
          layerVisibility={layerVisibility}
          onLayerToggle={onLayerToggle}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainer}
        className="h-full w-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      <MapLegend
        layers={layers}
        layerVisibility={layerVisibility}
        onLayerToggle={onLayerToggle}
      />
    </div>
  );
}

// Composant principal ReportContainer
export function ReportContainer({ reportData }: ReportContainerProps) {
  // État pour la visibilité des couches
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    reportData.layers.forEach(layer => {
      initial[layer.id] = true; // Toutes les couches visibles par défaut
    });
    return initial;
  });

  // Fonction pour basculer la visibilité d'une couche
  const handleLayerToggle = (layerId: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* En-tête avec résumé */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rapport d&apos;analyse foncière
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyse complète de votre parcelle
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {reportData.summary.totalArea.toFixed(2)} ha
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Superficie totale
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {reportData.summary.intersectingLayers}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Couches intersectées
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {reportData.layers.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Couches analysées
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${
              reportData.summary.status === 'Libre' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {reportData.summary.status}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Statut général
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal en deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[600px]">
        {/* Colonne gauche : Résultats (affiche uniquement les couches qui ont matché) */}
        <div className="p-6 border-r border-gray-200 dark:border-gray-700">
          <ResultsList layers={reportData.layers.filter(l => l.intersects === true)} />
        </div>

        {/* Colonne droite : Carte */}
        <div className="relative">
          <InteractiveMap
            terrainCoordinates={reportData.terrainCoordinates}
            layers={reportData.layers}
            layerVisibility={layerVisibility}
            onLayerToggle={handleLayerToggle}
          />
        </div>
      </div>
    </div>
  );
}