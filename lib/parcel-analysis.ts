import * as turf from '@turf/turf';
import proj4 from 'proj4';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { LayerData, ReportData } from '@/components/ui/chat-components/ReportContainer';

// Données des couches GeoJSON (simulées pour le moment)
const layerDefinitions = [
  { id: 'aif', name: 'AIF - Association d\'Intérêts Fonciers', color: '#ef4444', file: 'aif.geojson' },
  { id: 'air_proteges', name: 'Aires Protégées', color: '#10b981', file: 'air_proteges.geojson' },
  { id: 'dpl', name: 'Domaine Public Lagunaire', color: '#3b82f6', file: 'dpl.geojson' },
  { id: 'dpm', name: 'Domaine Public Maritime', color: '#6366f1', file: 'dpm.geojson' },
  { id: 'tf_demembres', name: 'Titres Fonciers démembrés', color: '#efb7c0', file: 'tf_demembres.geojson' },
  { id: 'titre_reconstitue', name: 'Titres Fonciers reconstitués', color: '#fca5a5', file: 'titre_reconstitue.geojson' },
  { id: 'tf_en_cours', name: 'Titres Fonciers en cours', color: '#fb923c', file: 'tf_en_cours.geojson' },
  { id: 'enregistrement_individuel', name: 'Enregistrements individuels', color: '#60a5fa', file: 'enregistrement individuel.geojson' },
  { id: 'tf_etat', name: 'Titres Fonciers de l\'État', color: '#94a3b8', file: 'tf_etat.geojson' },
  { id: 'litige', name: 'Zones Litigieuses', color: '#f59e0b', file: 'litige.geojson' },
  { id: 'restriction', name: 'Zones de Restriction', color: '#8b5cf6', file: 'restriction.geojson' }
];

type PolygonalFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>;
type GeoJsonCrs = { type?: string; properties?: Record<string, unknown> };
type Wgs84Ring = [number, number][];
type Wgs84Polygon = Wgs84Ring[];

const EPSG_32631 = 'EPSG:32631';
const EPSG_32631_DEF = '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs';

if (!proj4.defs(EPSG_32631)) {
  proj4.defs(EPSG_32631, EPSG_32631_DEF);
}

const convertPositionToWgs84 = (coord: unknown): [number, number] | null => {
  if (!Array.isArray(coord) || coord.length < 2) {
    return null;
  }

  const [xRaw, yRaw] = coord as number[];
  const x = Number(xRaw);
  const y = Number(yRaw);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const result = proj4(EPSG_32631, 'EPSG:4326', [x, y]);
  if (!Array.isArray(result) || result.length < 2) {
    return null;
  }

  const [lon, lat] = result as [number, number];
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return [lon, lat];
};

const closeRing = (ring: Wgs84Ring): Wgs84Ring => {
  if (ring.length === 0) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  const epsilon = 1e-8;

  if (Math.abs(first[0] - last[0]) > epsilon || Math.abs(first[1] - last[1]) > epsilon) {
    return [...ring, [first[0], first[1]]];
  }

  return ring;
};

const convertRingToWgs84 = (ring: unknown): Wgs84Ring => {
  if (!Array.isArray(ring)) {
    return [];
  }

  const converted: Wgs84Ring = [];
  for (const coord of ring) {
    const candidate = convertPositionToWgs84(coord as number[]);
    if (candidate) {
      converted.push(candidate);
    }
  }

  if (converted.length === 0) {
    return converted;
  }

  return closeRing(converted);
};

const convertFeatureGeometryToWgs84 = (feature?: PolygonalFeature): Wgs84Polygon => {
  if (!feature || !feature.geometry) {
    return [];
  }

  if (feature.geometry.type === 'Polygon') {
    return feature.geometry.coordinates
      .map(ring => convertRingToWgs84(ring))
      .filter(ring => ring.length >= 4);
  }

  if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates
      .flatMap(polygon => polygon.map(ring => convertRingToWgs84(ring)))
      .filter(ring => ring.length >= 4);
  }

  return [];
};

const convertAnyCoordinatesToWgs84 = (coords: unknown): Wgs84Polygon => {
  if (!Array.isArray(coords) || coords.length === 0) {
    return [];
  }

  const first = coords[0];

  if (Array.isArray(first) && Array.isArray((first as unknown[])[0]) && Array.isArray(((first as unknown[])[0] as unknown[])[0])) {
    // MultiPolygon structure
    return (coords as unknown[]).flatMap(polygon => convertAnyCoordinatesToWgs84(polygon))
      .filter(ring => ring.length >= 4);
  }

  if (Array.isArray(first) && Array.isArray((first as unknown[])[0])) {
    // Polygon structure
    return (coords as unknown[])
      .map(ring => convertRingToWgs84(ring))
      .filter(ring => ring.length >= 4);
  }

  if (Array.isArray(first) && typeof (first as unknown[])[0] === 'number') {
    const ring = convertRingToWgs84(coords);
    return ring.length >= 4 ? [ring] : [];
  }

  return [];
};

const isPolygonalFeature = (feature: unknown): feature is PolygonalFeature => {
  if (!feature || typeof feature !== 'object') {
    return false;
  }

  const geometry = (feature as Feature).geometry;
  if (!geometry) {
    return false;
  }

  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
};

/**
 * Charge les données GeoJSON d'une couche
 */
// Note: We intentionally do NOT load GeoJSON files from disk or via fetch here.
// generateParcelReport must operate purely from pre-computed overlapResults
// produced by the dedicated geospatial analyzer (findOverlap). This keeps
// server-side code deterministic and avoids relative fetch() calls that
// are invalid in some server environments.

// NOTE: Incoming coordinates from the geospatial engine are provided in
// EPSG:32631 (UTM zone 31N). We convert them to EPSG:4326 (lon/lat)
// before returning the report so the frontend map can render them
// directly with MapLibre GL.

/**
 * Analyse une parcelle contre toutes les couches disponibles
 */
export async function generateParcelReport(terrainCoordinates: number[][], overlapResults?: unknown): Promise<ReportData> {
  console.log('🚀 Starting parcel analysis...');

  // Require analysis data from findOverlap. Do not attempt to recompute
  // intersections locally — caller must provide the analysis results.
  // Define an Overlap type for safer handling
  type Overlap = {
    document?: string;
    coordinates?: unknown;
    properties?: Record<string, unknown>;
    featureId?: string | number;
    feature?: PolygonalFeature;
    crs?: GeoJsonCrs;
  };

  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';

  let overlapsArray: Overlap[] | undefined;
  if (Array.isArray(overlapResults)) {
    overlapsArray = overlapResults as Overlap[];
  } else if (isObject(overlapResults)) {
    const candidate = (overlapResults as Record<string, unknown>)['overlaps'];
    if (Array.isArray(candidate)) {
      overlapsArray = candidate as Overlap[];
    }
  }

  // Allow empty overlaps array - this is a valid case where no intersections are found
  if (!overlapsArray) {
    console.error('Missing analysis data: overlapsArray is null/undefined');
    throw new Error('Missing analysis data: generateParcelReport requires overlap results from findOverlap');
  }

  console.log('� Proceeding with report generation for', overlapsArray.length, 'overlaps');

  const toNumericRing = (ring: number[][]): Wgs84Ring => {
    const numericRing = ring
      .map(([x, y]) => [Number(x), Number(y)] as [number, number])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    return closeRing(numericRing);
  };

  const terrainRingWgs84 = convertRingToWgs84(terrainCoordinates);
  let effectiveTerrainRing = terrainRingWgs84;

  if (effectiveTerrainRing.length < 4) {
    console.warn('⚠️ Unable to convert terrain coordinates to EPSG:4326, falling back to raw numeric values.');
    effectiveTerrainRing = toNumericRing(terrainCoordinates);
  }

  const areaReferenceRing = terrainRingWgs84.length >= 4 ? terrainRingWgs84 : effectiveTerrainRing;
  const terrainPolygon = turf.polygon([areaReferenceRing as unknown as number[][]]);
  const terrainArea = turf.area(terrainPolygon) / 10000; // Convertir en hectares

  console.log('📐 Terrain area:', terrainArea.toFixed(2), 'ha');

  const layers: LayerData[] = [];
  let intersectingLayersCount = 0;

  // overlapsArray already validated above

  // Analyser chaque couche
  for (const layerDef of layerDefinitions) {
    console.log(`🔍 Analyzing layer: ${layerDef.name}`);

    try {
      // Use only the overlaps provided by the findOverlap analyzer. Do not
      // attempt to load GeoJSON files here or recompute intersections locally.
      const docMatchesFromOverlaps: Overlap[] = overlapsArray.filter((match) => {
        if (!match.document || typeof match.document !== 'string') {
          return false;
        }
        return match.document.toLowerCase().includes(layerDef.id.toLowerCase());
      });

      if (docMatchesFromOverlaps.length > 0) {
        // Use the overlaps to populate the layer payload
        const firstMatch = docMatchesFromOverlaps[0];

        const primaryFeature = isPolygonalFeature(firstMatch.feature) ? firstMatch.feature : undefined;
        const wgsFromFeature = primaryFeature ? convertFeatureGeometryToWgs84(primaryFeature) : [];
        const wgsFromCoordinates = convertAnyCoordinatesToWgs84(firstMatch.coordinates);
        const finalCoordinates = wgsFromFeature.length > 0 ? wgsFromFeature : wgsFromCoordinates;

        const matchedFeatures = docMatchesFromOverlaps.map((match) => {
          const feature = isPolygonalFeature(match.feature) ? match.feature : undefined;
          const coordinates = feature ? convertFeatureGeometryToWgs84(feature) : convertAnyCoordinatesToWgs84(match.coordinates);
          return {
            document: match.document,
            featureId: match.featureId,
            properties: match.properties as Record<string, unknown> | undefined,
            feature,
            coordinates,
            crs: match.crs,
          };
        });

        const layerCoordinates = finalCoordinates.length > 0
          ? finalCoordinates
          : (matchedFeatures.find(m => Array.isArray(m.coordinates) && m.coordinates.length > 0)?.coordinates ?? []);

        // Determine a verbose description/status from the properties
        let description = '';
        const props = firstMatch.properties ?? {};
        if (props) {
          if (layerDef.id === 'restriction' && (props as any).type) {
            description = `Type: ${(props as any).type}` + ((props as any).désignation ? ` - ${(props as any).désignation}` : '');
          } else if ((props as any).nom) {
            description = (props as any).nom;
          } else if ((props as any).name) {
            description = (props as any).name;
          }
          if ((layerDef.id === 'tf_demembres' || layerDef.id === 'titre_reconstitue' || layerDef.id === 'tf_etat' || layerDef.id === 'tf_en_cours') && (props as any).num_tf) {
            description = `N° TF: ${(props as any).num_tf}` + (description ? ` - ${description}` : '');
          }
        }

        let status = '';
        switch (layerDef.id) {
          case 'aif':
            status = 'Association d\'intérêts fonciers';
            description = description || "Couverture AIF: périmètre souvent vaste, peut contenir plusieurs villages. Si votre parcelle est incluse dans un Titre Foncier, elle doit faire l'objet de morcellement pour obtenir un TF distinct.";
            break;
          case 'air_proteges':
            status = 'Zone protégée';
            description = description || "Aire protégée *: données à considérer avec prudence — certaines limites peuvent être imprécises dans nos sources.";
            break;
          case 'dpl':
            status = 'Domaine public lagunaire';
            description = description || "DPL: périmètre autour des plans d'eau, généralement non constructible.";
            break;
          case 'dpm':
            status = 'Domaine public maritime';
            description = description || "DPM: périmètre maritime/zone côtière, généralement non constructible.";
            break;
          case 'tf_demembres':
            status = 'Titre foncier démembré';
            description = description || "Titre foncier démembré: souvent en zone lotie ; champ 'num_tf' contient le numéro du TF.";
            break;
          case 'titre_reconstitue':
            status = 'Titre foncier reconstitué';
            description = description || "Titre reconstitué: similaire aux TF démembrés mais souvent sur de grandes superficies.";
            break;
          case 'tf_en_cours':
            status = 'TF en cours';
            description = description || "TF en cours: parcelles en cours de morcellement ou confirmation de droits.";
            break;
          case 'enregistrement_individuel':
            status = 'Enregistrement individuel';
            description = description || "Parcelles enregistrées au cadastre (enregistrement individuel).";
            break;
          case 'tf_etat':
            status = 'Titre foncier de l\'État';
            description = description || "Titres fonciers de l'État: échantillon de TF appartenant à l'État.";
            break;
          case 'litige':
            status = 'Zone litigieuse';
            description = description || "Zone en litige devant les juridictions.";
            break;
          case 'restriction':
            status = 'Zone restreinte';
            description = description || "Restriction: certaines entités correspondent à des ZDUP ou PAG; consultez le champ 'type' et 'désignation' pour plus de détails.";
            break;
          default:
            status = 'Intersection détectée';
        }

        layers.push({
          id: layerDef.id,
          name: layerDef.name,
          color: layerDef.color,
          coordinates: layerCoordinates,
          intersects: true,
          description,
          status,
          matchedFeatures: matchedFeatures.length > 0 ? matchedFeatures : undefined,
          crs: firstMatch.crs,
        });

        intersectingLayersCount += 1;
        continue; // next layer
      }

      // No overlaps for this layer in the provided analysis results
      layers.push({
        id: layerDef.id,
        name: layerDef.name,
        color: layerDef.color,
        coordinates: [],
        intersects: false,
        description: 'Aucune contrainte détectée pour cette couche selon l\'analyse fournie',
        status: 'Aucune contrainte'
      });

    } catch (error) {
      console.error(`❌ Error analyzing layer ${layerDef.name}:`, error);
      layers.push({
        id: layerDef.id,
        name: layerDef.name,
        color: layerDef.color,
        coordinates: [],
        intersects: false,
        description: 'Erreur lors de l\'analyse',
        status: 'Erreur'
      });
    }
  }

  // Déterminer le statut général
  let overallStatus = 'Libre';
  if (intersectingLayersCount > 0) {
    if (layers.some(l => l.id === 'litige' && l.intersects)) {
      overallStatus = 'Litigieux';
    } else if (layers.some(l => l.id === 'restriction' && l.intersects)) {
      overallStatus = 'Restreint';
    } else if (layers.some(l => ['dpl', 'dpm'].includes(l.id) && l.intersects)) {
      overallStatus = 'Domaine Public';
    } else {
      overallStatus = 'Contraintes';
    }
  }

  const reportData: ReportData = {
    // Forward converted WGS84 terrain coordinates (single ring)
    terrainCoordinates: [effectiveTerrainRing as [number, number][]],
    layers,
    summary: {
      totalArea: terrainArea,
      intersectingLayers: intersectingLayersCount,
      status: overallStatus
    }
  };

  console.log('✅ Report generation completed');
  console.log('📊 Summary:', reportData.summary);

  return reportData;
}