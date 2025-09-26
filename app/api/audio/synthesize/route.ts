import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_AUDIO_SERVICE_BASE_URL = "https://e42feb93c11e.ngrok-free.app";

const getAudioServiceBaseUrl = () =>
  process.env.AUDIO_SERVICE_BASE_URL ?? DEFAULT_AUDIO_SERVICE_BASE_URL;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing 'text' field in request body." },
        { status: 400 }
      );
    }

    const audioServiceUrl = getAudioServiceBaseUrl();
    const params = new URLSearchParams({ text_fr: text });

    const serviceResponse = await fetch(
      `${audioServiceUrl}/synthesize?${params.toString()}`,
      {
        method: "POST",
      }
    );

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      return NextResponse.json(
        {
          error: "Synthesis service returned an error.",
          status: serviceResponse.status,
          details: errorText,
        },
        { status: serviceResponse.status }
      );
    }

    const arrayBuffer = await serviceResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    const contentType =
      serviceResponse.headers.get("content-type") || "audio/wav";

    return NextResponse.json({
      audioBase64,
      contentType,
    });
  } catch (error) {
    console.error("[audio/synthesize] Unexpected error", error);
    return NextResponse.json(
      { error: "Failed to synthesize audio." },
      { status: 500 }
    );
  }
}
