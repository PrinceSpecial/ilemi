"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudioBlob } from "@/lib/services/audioClient";

const DEFAULT_MIME_TYPE = "audio/webm";

export interface VoiceRecorderOptions {
  onTranscription: (payload: {
    text: string;
    audioDataUrl: string;
    blob: Blob;
  }) => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function useVoiceRecorder({
  onTranscription,
  onError,
}: VoiceRecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      chunksRef.current = [];
    };
  }, []);

  const handleRecordingError = useCallback(
    (error: Error) => {
      console.error("[useVoiceRecorder]", error);
      setErrorMessage(error.message);
      onError?.(error);
    },
    [onError]
  );

  const blobToDataUrl = useCallback(async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read audio blob."));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read audio blob."));
      reader.readAsDataURL(blob);
    });
  }, []);

  const processRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const mimeType = recorder.mimeType || DEFAULT_MIME_TYPE;
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (audioBlob.size === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      setIsProcessing(true);
      const audioDataUrl = await blobToDataUrl(audioBlob);
      const transcription = await transcribeAudioBlob(audioBlob);
      await onTranscription({
        text: transcription.text,
        audioDataUrl,
        blob: audioBlob,
      });
      setErrorMessage(null);
    } catch (error) {
      handleRecordingError(
        error instanceof Error
          ? error
          : new Error("Failed to process voice note.")
      );
    } finally {
      setIsProcessing(false);
    }
  }, [blobToDataUrl, handleRecordingError, onTranscription]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      handleRecordingError(new Error("Audio recording is not supported in this browser."));
      return;
    }

    if (isRecording || isProcessing) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        processRecording();
      });

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        handleRecordingError(new Error("Microphone access was denied."));
        return;
      }

      handleRecordingError(
        error instanceof Error
          ? error
          : new Error("Failed to start recording.")
      );
    }
  }, [handleRecordingError, isProcessing, isRecording, isSupported, processRecording]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    setIsRecording(false);
  }, []);

  return {
    isSupported,
    isRecording,
    isProcessing,
    errorMessage,
    startRecording,
    stopRecording,
    setErrorMessage,
  };
}
