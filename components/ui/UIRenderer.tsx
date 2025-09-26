import React from 'react';
import dynamic from 'next/dynamic';
import {
  ContactCard,
  MapView,
  ChecklistDocuments,
  RedirectButtons,
  ProcessContainer
} from '@/components/ui/chat-components';

// Chargement dynamique de ReportContainer pour éviter les erreurs SSR avec Leaflet
const ReportContainer = dynamic(
  () => import('@/components/ui/chat-components/ReportContainer').then(mod => ({ default: mod.ReportContainer })),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }
);

// Type definitions for component props
export interface ContactCardProps {
  name: string;
  phone?: string;
  email?: string;
}

export interface MapViewProps {
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

export interface ChecklistDocumentsProps {
  title: string;
  documents: {
    id: string;
    name: string;
    status: 'pending' | 'completed' | 'in_progress';
    description?: string;
  }[];
}

export interface RedirectButtonsProps {
  title: string;
  buttons: {
    id: string;
    label: string;
    link: string;
  }[];
}

export interface ProcessContainerProps {
  status: 'idle' | 'extracting' | 'comparing' | 'generating_report' | 'done';
}

export interface ReportContainerProps {
  reportData: {
    terrainCoordinates: [number, number][][];
    layers: {
      id: string;
      name: string;
      color: string;
      coordinates: [number, number][][];
      intersects: boolean;
      description?: string;
      status?: string;
    }[];
    summary: {
      totalArea: number;
      intersectingLayers: number;
      status: string;
    };
  };
}

// Component mapping
const componentMap = {
  ContactCard,
  MapView,
  ChecklistDocuments,
  RedirectButtons,
  ProcessContainer,
  ReportContainer,
};

export interface UIRenderData {
  component: keyof typeof componentMap;
  props: Record<string, unknown>;
}

interface UIRendererProps {
  data: UIRenderData;
  onActionClick?: (action: any) => void; // forwarded to components that support actions
}

export function UIRenderer({ data, onActionClick }: UIRendererProps) {
  const Component = componentMap[data.component];

  if (!Component) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p className="text-red-700 dark:text-red-400">
          Composant inconnu: {data.component}
        </p>
      </div>
    );
  }

  const props = { ...(data.props as Record<string, unknown>) } as any;
  if (onActionClick) props.onActionClick = onActionClick;

  return <Component {...props} />; // eslint-disable-line @typescript-eslint/no-explicit-any
}