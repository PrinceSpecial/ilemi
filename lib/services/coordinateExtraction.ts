import { chatbotConfig } from '@/lib/config';

export interface IncomingCoordinate {
  Bornes?: string;
  X: string;
  Y: string;
}

/**
 * Posts the given file to the configured coordinate extraction API and returns
 * the raw array of IncomingCoordinate objects returned by the API, without
 * modifying or normalizing them.
 */
export async function extractCoordinatesFromDocument(file: File): Promise<IncomingCoordinate[]> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(chatbotConfig.api.coordinateExtraction.url, {
    method: 'POST',
    // Let the browser set Content-Type and boundary for multipart/form-data
    body: formData,
    signal: AbortSignal.timeout(chatbotConfig.api.coordinateExtraction.timeout),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '<no-body>');
    throw new Error(`Coordinate extraction API error: ${response.status} ${response.statusText} - ${bodyText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Coordinate extraction API returned unexpected payload: expected an array of coordinates');
  }

  return data as IncomingCoordinate[];
}
