import { NextRequest, NextResponse } from 'next/server';
import { runParcelAnalysisWorkflow } from '@/lib/services/parcelAnalysisWorkflow';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

  // Accept both 'file' and 'document' fields for compatibility
  const fileCandidate = formData.get('file') || formData.get('document');
  const file = (fileCandidate instanceof File) ? fileCandidate : null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!(file.type === 'application/pdf' || (file.type && file.type.startsWith('image/')))) {
      return NextResponse.json({ error: 'Only PDF or image files are allowed' }, { status: 400 });
    }

    // Run the server-side workflow directly using the uploaded File object.
    // The implementation of runParcelAnalysisWorkflow will send the binary
    // to the configured extractor and perform geospatial analysis. We do
    // not persist the uploaded file on disk (per requirement).
    try {
      console.info('Starting parcel analysis workflow for uploaded file');
      const report = await runParcelAnalysisWorkflow(file);
      console.info('Parcel analysis workflow completed successfully');
      return NextResponse.json({ report });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Parcel analysis failed during extraction or processing:', message);
      return NextResponse.json({ error: message || 'File processing failed' }, { status: 500 });
    }
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Parcel analysis API error:', message);
    return NextResponse.json({ error: message || 'Internal error' }, { status: 500 });
  }
}
