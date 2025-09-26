// Note: avoid importing client-only hooks at module top-level so this file
// can be imported from server-side code (API routes). The hook is imported
// lazily inside `useParcelAnalysisWorkflow`.
import { extractCoordinatesFromDocument } from '@/lib/services/coordinateExtraction';
import { generateParcelReport } from '@/lib/parcel-analysis';
import { ReportData } from '@/components/ui/chat-components/ReportContainer';

/**
 * Interface pour les coordonnées extraites
 */
interface IncomingCoordinate {
  Bornes?: string;
  X: string;
  Y: string;
}

/**
 * Convertit les coordonnées de format [lng, lat] vers le format attendu par geoSpatial
 */
function convertCoordinatesToGeoSpatialFormat(coordinates: number[][]): IncomingCoordinate[] {
  return coordinates.map((coord, index) => ({
    Bornes: `P${index + 1}`,
    X: coord[0].toString(), // longitude
    Y: coord[1].toString(), // latitude
  }));
}

/**
 * Orchestrateur principal du workflow d'analyse de parcelle
 */
export async function runParcelAnalysisWorkflow(
  file: File,
  onProgressUpdate?: (status: string, progress: number) => void
): Promise<ReportData> {
  const updateProgress = (status: string, progress: number) => {
    console.log(`📊 ${status} (${progress}%)`);
    onProgressUpdate?.(status, progress);
  };

  try {
    // 1. EXTRACTION DES COORDONNÉES
    updateProgress('Extraction des coordonnées en cours...', 10);
    
    const rawExtraction = await extractCoordinatesFromDocument(file);

    // Log extractor result for observability
    try {
      if (Array.isArray(rawExtraction)) {
        console.log('🔎 Coordinate extractor returned an array with length:', rawExtraction.length);
      } else {
        console.log('🔎 Coordinate extractor returned an object with keys:', Object.keys(rawExtraction || {}));
      }
    } catch (logErr) {
      console.log('🔎 Coordinate extractor returned (unable to introspect):', rawExtraction);
    }

    // The extractor may now return either an object with a `coordinates` field
    // (legacy) or an array of {X,Y} points (new behavior). Normalize into an
    // extractionResult object that contains `raw` and `coordinates` so the
    // rest of the workflow can operate unchanged.
    let extractionResult: any;

    if (Array.isArray(rawExtraction)) {
      // rawExtraction is IncomingCoordinate[] -> convert to coordinates array of [X, Y] strings
      extractionResult = {
        raw: rawExtraction,
        coordinates: rawExtraction.map((p: any) => [p.X, p.Y]),
      };
    } else {
      extractionResult = rawExtraction;
    }

    if (!extractionResult.coordinates || extractionResult.coordinates.length < 3) {
      throw new Error('Coordonnées insuffisantes extraites du document');
    }

    // Normalize coordinates: ensure numbers, remove NaNs, remove near-duplicate consecutive points,
    // and make sure the polygon ring is closed (first == last).
    const rawCoords = extractionResult.coordinates;
    const normalized: number[][] = rawCoords
      .map((pair: any) => [Number(pair[0]), Number(pair[1])])
      .filter((pair: any) => !Number.isNaN(pair[0]) && !Number.isNaN(pair[1]));

    // Remove consecutive duplicates (within a small epsilon)
    const uniqueCoords: number[][] = [];
    const eps = 1e-9;
    for (const coord of normalized) {
      const prev = uniqueCoords[uniqueCoords.length - 1];
      if (!prev || Math.abs(prev[0] - coord[0]) > eps || Math.abs(prev[1] - coord[1]) > eps) {
        uniqueCoords.push(coord);
      }
    }

    // Ensure ring closed: first point equals last point
    if (uniqueCoords.length > 0) {
      const first = uniqueCoords[0];
      const last = uniqueCoords[uniqueCoords.length - 1];
      if (Math.abs(first[0] - last[0]) > eps || Math.abs(first[1] - last[1]) > eps) {
        uniqueCoords.push([first[0], first[1]]);
      }
    }

    if (uniqueCoords.length < 4) {
      // Need at least 4 coordinates for a closed polygon (3 distinct points + closing point)
      throw new Error('Coordonnées insuffisantes après normalisation');
    }

    extractionResult.coordinates = uniqueCoords;

    updateProgress('Coordonnées extraites avec succès', 30);
    console.log('📍 Coordonnées extraites (normalisées):', extractionResult.coordinates);

    // 2. ENVOI DES RÉSULTATS BRUTS À L'ENDPOINT findOverlap
    updateProgress('Comparaison avec les données géospatiales...', 50);

    // Build a base URL to call the internal API. Prefer NEXT_PUBLIC_APP_URL if present.
    // NOTE: this is a heuristic for local/server environments. Adjust in production.
    const rawBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let baseUrl = rawBase;
    if (!/^https?:\/\//.test(baseUrl)) {
      baseUrl = `http://${baseUrl}`;
    }
    // If no port present and hostname is localhost, default to 3000
    try {
      const urlObj = new URL(baseUrl);
      if (!urlObj.port && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
        urlObj.port = '3000';
        baseUrl = urlObj.toString().replace(/\/$/, '');
      }
    } catch (e) {
      // ignore URL parse errors and fallback to http://localhost:3000
      baseUrl = 'http://localhost:3000';
    }

    const findOverlapUrl = `${baseUrl}/api/findOverlap`;

  // Forward the raw extractor payload to the findOverlap endpoint.
  // The coordinateExtraction service now returns `raw` containing the original API response.
  let overlaps: any[] = [];
  let yesNoData: Record<string, string> = {};
  let overlapResponse: any = null; // full JSON response from findOverlap

    try {
      // Forward the extractor's original payload unchanged to the findOverlap endpoint.
      const res = await fetch(findOverlapUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawExtraction),
        // Do not use a very short timeout here; rely on platform defaults or outer abort.
      });

      if (!res.ok) {
        console.warn('findOverlap endpoint returned non-OK status', res.status);
      } else {
        const json = await res.json();
        // Keep the full response for downstream processing and pass it to the report generator.
        overlapResponse = json;
        // Also keep convenience vars for logging/backwards compatibility
        overlaps = json.overlaps || json;
        yesNoData = json.yesNoData || {};

        // Log findOverlap response summary for observability
        try {
          const overlapsCount = Array.isArray(overlaps) ? overlaps.length : undefined;
          console.log('🔁 findOverlap returned:', { overlapsCount, yesNoDataKeys: Object.keys(yesNoData || {}) });
        } catch (logErr) {
          console.log('🔁 findOverlap returned (unable to introspect):', overlapResponse);
        }
      }
    } catch (err) {
      console.warn('Failed to call findOverlap endpoint:', err);
    }

    updateProgress('Analyse géospatiale terminée', 70);
    console.log('🗺️ Overlaps trouvés:', Array.isArray(overlaps) ? overlaps.length : 'unknown');
    console.log('📋 Yes/No Data:', yesNoData);

    // If findOverlap did not return a usable analysis payload, fail fast.
    if (!overlapResponse && (!overlaps || overlaps.length === 0)) {
      throw new Error('findOverlap did not return analysis results. Aborting report generation.');
    }

    // 3. GÉNÉRATION DU RAPPORT FINAL
    updateProgress('Génération du rapport d\'analyse...', 85);

    // About to generate the final report

  // Utiliser la fonction de génération de rapport en passant la réponse complète
  // renvoyée par l'endpoint findOverlap afin que le générateur de rapport ait
  // accès à tous les champs (overlaps, yesNoData, etc.).
  const reportData = await generateParcelReport(extractionResult.coordinates, overlapResponse ?? overlaps);

    // Log final report payload for observability
    try {
      console.log('📝 generateParcelReport returned report with summary:', reportData.summary);
    } catch (logErr) {
      console.log('📝 generateParcelReport returned (unable to introspect):', reportData);
    }

    updateProgress('Rapport généré avec succès', 100);
    console.log('✅ Rapport final généré:', reportData.summary);

    return reportData;

  } catch (error) {
    console.error('❌ Erreur dans le workflow d\'analyse:', error);
    throw error;
  }
}

/**
 * Convertit les coordonnées GeoJSON vers le format Leaflet
 */
function convertCoordinatesToLeafletFormat(coordinates: any): [number, number][][] {
  if (!coordinates || !Array.isArray(coordinates)) {
    return [];
  }

  // Gérer différents formats de coordonnées
  if (coordinates[0] && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    // Format: [[[lng, lat], [lng, lat], ...]]
    return coordinates.map((ring: any[]) =>
      ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
    );
  } else if (coordinates[0] && Array.isArray(coordinates[0])) {
    // Format: [[lng, lat], [lng, lat], ...]
    return [coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number])];
  }

  return [];
}

/**
 * Hook personnalisé pour utiliser le workflow d'analyse
 */
export function useParcelAnalysisWorkflow() {
  // Import the Zustand hook lazily to keep this module server-friendly.
  // This function is intended to be used client-side only.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useParcelAnalysis } = require('@/lib/hooks/useParcelAnalysis');
  const {
    status,
    progress,
    error,
    reportData,
    setStatus,
    setProgress,
    setError,
    setReportData,
    reset
  } = useParcelAnalysis();

  const startAnalysis = async (file: File) => {
    try {
      reset();
      setStatus('extracting');

      const onProgressUpdate = (statusText: string, progressValue: number) => {
        setProgress(progressValue);
        
        // Mettre à jour le statut selon le progrès
        if (progressValue <= 30) {
          setStatus('extracting');
        } else if (progressValue <= 70) {
          setStatus('comparing');
        } else if (progressValue < 100) {
          setStatus('generating_report');
        } else {
          setStatus('done');
        }
      };

      const result = await runParcelAnalysisWorkflow(file, onProgressUpdate);
      
      setReportData(result);
      setStatus('done');
      setProgress(100);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      setStatus('error');
      throw error;
    }
  };

  return {
    status,
    progress,
    error,
    reportData,
    startAnalysis,
    reset
  };
}