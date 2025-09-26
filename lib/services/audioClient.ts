export interface TranscriptionResult {
  text: string;
  raw?: unknown;
}

export interface SynthesisResult {
  audioUrl: string;
  contentType: string;
}

export async function transcribeAudioBlob(blob: Blob): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("audio", blob, "voice-note.webm");

  const response = await fetch("/api/audio/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    throw new Error(resolveErrorMessage(errorBody, "Transcription request failed."));
  }

  const data = await response.json();
  if (!data?.text || typeof data.text !== "string") {
    throw new Error("Transcription response missing text field.");
  }

  return { text: data.text, raw: data.raw };
}

export async function synthesizeSpeechFromText(text: string): Promise<SynthesisResult> {
  const response = await fetch("/api/audio/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    throw new Error(resolveErrorMessage(errorBody, "Audio synthesis failed."));
  }

  const data = await response.json();
  if (!data?.audioBase64 || typeof data.audioBase64 !== "string") {
    throw new Error("Invalid audio synthesis response.");
  }

  const contentType =
    typeof data.contentType === "string" && data.contentType.length > 0
      ? data.contentType
      : "audio/wav";

  return {
    audioUrl: `data:${contentType};base64,${data.audioBase64}`,
    contentType,
  };
}

async function safeParseJSON(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const errorValue = record.error;
    if (typeof errorValue === "string" && errorValue.trim().length > 0) {
      return errorValue;
    }

    const messageValue = record.message;
    if (typeof messageValue === "string" && messageValue.trim().length > 0) {
      return messageValue;
    }
  }

  return fallback;
}
