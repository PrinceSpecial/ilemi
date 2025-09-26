import { NextRequest, NextResponse } from "next/server";

const DEFAULT_AUDIO_SERVICE_BASE_URL = "https://e42feb93c11e.ngrok-free.app";

const getAudioServiceBaseUrl = () =>
  process.env.AUDIO_SERVICE_BASE_URL ?? DEFAULT_AUDIO_SERVICE_BASE_URL;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();

    const audioEntry = incomingFormData.get("audio") ?? incomingFormData.get("file");
    if (!audioEntry || !(audioEntry instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file in request." },
        { status: 400 }
      );
    }

    const audioServiceUrl = getAudioServiceBaseUrl();
    const forwardFormData = new FormData();
    forwardFormData.append(
      "file",
      audioEntry,
      audioEntry.name || "voice-note.webm"
    );

    const serviceResponse = await fetch(`${audioServiceUrl}/transcribe`, {
      method: "POST",
      body: forwardFormData,
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      return NextResponse.json(
        {
          error: "Transcription service returned an error.",
          status: serviceResponse.status,
          details: errorText,
        },
        { status: serviceResponse.status }
      );
    }

    const result = await serviceResponse.json();
    const transcript =
      result?.text_fr ??
      result?.text ??
      result?.transcription ??
      result?.translation ??
      result?.message ??
      "";

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Transcription service did not return text.", raw: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: transcript, raw: result });
  } catch (error) {
    console.error("[audio/transcribe] Unexpected error", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio." },
      { status: 500 }
    );
  }
}
