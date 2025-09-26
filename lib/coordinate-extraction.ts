// This module was a legacy/mock extractor implementation.
// It has been neutralized because the project uses `lib/services/coordinateExtraction.ts`
// as the canonical extractor service. Keeping a minimal stub here prevents TypeScript
// from failing during build if other files still reference this path accidentally.

export async function extractCoordinatesFromDocument(_documentUrl: string): Promise<{ coordinates: number[][]; confidence: number; }> {
  throw new Error('Legacy mock extractor is disabled. Use lib/services/coordinateExtraction.ts instead.');
}

export async function callCoordinateExtractionAPI(_documentUrl: string): Promise<{ coordinates: number[][]; confidence: number; }> {
  throw new Error('Legacy mock extractor is disabled. Use lib/services/coordinateExtraction.ts instead.');
}