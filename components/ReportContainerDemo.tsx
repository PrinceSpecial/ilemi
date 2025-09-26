import React from 'react';
import { ReportContainer } from '@/components/ui/chat-components';

// Exemple de données pour tester le ReportContainer
const mockReportData = {
  terrainCoordinates: [
    [
      [6.3703, 2.3912] as [number, number],
      [6.3710, 2.3912] as [number, number],
      [6.3710, 2.3920] as [number, number],
      [6.3703, 2.3920] as [number, number],
      [6.3703, 2.3912] as [number, number]
    ]
  ],
  layers: [
    {
      id: 'aif',
      name: 'AIF - Association d\'Intérêts Fonciers',
      color: '#ef4444',
      coordinates: [
        [
          [6.3690, 2.3900] as [number, number],
          [6.3720, 2.3900] as [number, number],
          [6.3720, 2.3930] as [number, number],
          [6.3690, 2.3930] as [number, number],
          [6.3690, 2.3900] as [number, number]
        ]
      ],
      intersects: true,
      description: 'Association Foncière Alpha - Secteur commercial',
      status: 'Association d\'intérêts fonciers'
    },
    {
      id: 'air_proteges',
      name: 'Aires Protégées',
      color: '#10b981',
      coordinates: [],
      intersects: false,
      status: 'Aucune contrainte'
    },
    {
      id: 'dpl',
      name: 'Domaine Public Lagunaire',
      color: '#3b82f6',
      coordinates: [],
      intersects: false,
      status: 'Aucune contrainte'
    },
    {
      id: 'litige',
      name: 'Zones Litigieuses',
      color: '#f59e0b',
      coordinates: [
        [
          [6.3700, 2.3910] as [number, number],
          [6.3715, 2.3910] as [number, number],
          [6.3715, 2.3925] as [number, number],
          [6.3700, 2.3925] as [number, number],
          [6.3700, 2.3910] as [number, number]
        ]
      ],
      intersects: true,
      description: 'Litige en cours - Réclamation foncière #2024-045',
      status: 'Zone litigieuse'
    },
    {
      id: 'restriction',
      name: 'Zones de Restriction',
      color: '#8b5cf6',
      coordinates: [
        [
          [6.3695, 2.3905] as [number, number],
          [6.3725, 2.3905] as [number, number],
          [6.3725, 2.3935] as [number, number],
          [6.3695, 2.3935] as [number, number],
          [6.3695, 2.3905] as [number, number]
        ]
      ],
      intersects: true,
      description: 'Type: ZDUP - Désignation: Zone d\'utilité publique',
      status: 'Zone restreinte'
    }
  ],
  summary: {
    totalArea: 2.45,
    intersectingLayers: 3,
    status: 'Litigieux'
  }
};

export function ReportContainerDemo() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Démonstration ReportContainer</h1>
      <ReportContainer reportData={mockReportData} />
    </div>
  );
}