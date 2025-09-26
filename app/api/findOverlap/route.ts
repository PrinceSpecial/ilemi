import { NextRequest, NextResponse } from 'next/server';
import { processData } from '../../../lib/geoSpatial';
import path from 'path';

/**
 * POST /api/findOverlap
 * Accepts several payload shapes for backward compatibility with the extractor:
 * - An array of coordinates: [{ X: '...', Y: '...' }, ...]
 * - An object with a `coordinates` field: { coordinates: [...] }
 * - An object with a `raw` field (extractor payload): { raw: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract the most-likely coordinate array from several possible payload shapes
    let candidate: unknown = null;
    if (Array.isArray(body)) {
      candidate = body;
    } else if (body && Array.isArray((body as { coordinates?: unknown }).coordinates)) {
      candidate = (body as { coordinates?: unknown }).coordinates;
    } else if (body && Array.isArray((body as { raw?: unknown }).raw)) {
      candidate = (body as { raw?: unknown }).raw;
    }

    // Normalization helper: produce { X: string, Y: string }[] from different shapes
    const normalize = (arr: unknown): { X: string; Y: string }[] => {
      if (!Array.isArray(arr) || arr.length === 0) return [];
      const items = arr as unknown[];

      return items.map((item) => {
        // Case: array-like pair [x, y]
        if (Array.isArray(item) && item.length >= 2) {
          const pair = item as unknown[];
          return { X: String(pair[0]), Y: String(pair[1]) };
        }

        // Case: object with various possible key names
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const obj = item as Record<string | number, unknown>;
          const X = obj['X'] ?? obj['x'] ?? obj['lon'] ?? obj['lng'] ?? obj['longitude'] ?? obj[0];
          const Y = obj['Y'] ?? obj['y'] ?? obj['lat'] ?? obj['latitude'] ?? obj[1];
          return { X: X == null ? '' : String(X), Y: Y == null ? '' : String(Y) };
        }

        // Fallback: unknown item
        return { X: '', Y: '' };
      }).filter((p) => p.X !== '' || p.Y !== '');
    };

    const coordinates = normalize(candidate ?? []);

    // Debug logging to help diagnose payload mismatches in production
    try {
      console.info('findOverlap received payload shape:', {
        bodyType: Array.isArray(body) ? 'array' : typeof body,
        candidatePreview: Array.isArray(candidate) ? candidate.slice(0, 3) : candidate,
        normalizedPreview: Array.isArray(coordinates) ? coordinates.slice(0, 3) : coordinates,
      });
    } catch (logErr) {
      console.warn('findOverlap logging failed:', logErr);
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return NextResponse.json({ error: 'Invalid or missing coordinates array (could not normalize payload)', bodyReceived: body }, { status: 400 });
    }

    const dataDirectory = path.join(process.cwd(), 'public', 'data_files');

    const result = await processData(coordinates, dataDirectory);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in findOverlaps API:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}