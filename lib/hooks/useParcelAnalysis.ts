import { create } from 'zustand';
import { ReportData } from '@/components/ui/chat-components/ReportContainer';

export type ParcelAnalysisStatus = 
  | 'idle' 
  | 'extracting' 
  | 'comparing' 
  | 'generating_report' 
  | 'done' 
  | 'error';

interface ParcelAnalysisState {
  // État du processus
  status: ParcelAnalysisStatus;
  progress: number;
  error: string | null;
  
  // Données du processus
  uploadedFile: File | null;
  extractedCoordinates: number[][] | null;
  reportData: ReportData | null;
  
  // Actions
  setStatus: (status: ParcelAnalysisStatus) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  setExtractedCoordinates: (coordinates: number[][] | null) => void;
  setReportData: (data: ReportData | null) => void;
  
  // Réinitialiser l'état
  reset: () => void;
}

const initialState = {
  status: 'idle' as ParcelAnalysisStatus,
  progress: 0,
  error: null,
  uploadedFile: null,
  extractedCoordinates: null,
  reportData: null,
};

export const useParcelAnalysis = create<ParcelAnalysisState>((set) => ({
  ...initialState,
  
  setStatus: (status: ParcelAnalysisStatus) => set({ status }),
  setProgress: (progress: number) => set({ progress }),
  setError: (error: string | null) => set({ error }),
  setUploadedFile: (file: File | null) => set({ uploadedFile: file }),
  setExtractedCoordinates: (coordinates: number[][] | null) => set({ extractedCoordinates: coordinates }),
  setReportData: (data: ReportData | null) => set({ reportData: data }),
  
  reset: () => set(initialState),
}));