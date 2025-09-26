import React from 'react';
import { UIRenderer } from '@/components/ui/UIRenderer';
import { AgentResponse, UIComponent, UIAction } from '@/lib/langchain/output-parser';

interface MessageContentRendererProps {
  content: string;
  onActionClick?: (action: UIAction) => void;
}

export function MessageContentRenderer({ content, onActionClick }: MessageContentRendererProps) {
  // Essayer de parser le contenu comme réponse structurée JSON
  let parsedResponse: AgentResponse | null = null;

  try {
    const parsed = JSON.parse(content);
    console.log('🔍 Tentative de parsing JSON:', content.substring(0, 100) + '...');
    console.log('🔍 Objet parsé:', parsed);

    // Vérifier si c'est une réponse structurée valide
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      parsedResponse = parsed as AgentResponse;
      console.log('✅ Réponse structurée détectée:', {
        messageLength: parsedResponse.message.length,
        uiComponentsCount: parsedResponse.uiComponents?.length || 0,
        hasMetadata: !!parsedResponse.metadata
      });
    } else {
      console.log('❌ Objet parsé mais pas de champ "message":', Object.keys(parsed));
    }
  } catch (error) {
    console.log('ℹ️ Contenu non-JSON, affichage comme texte brut:', error);
    console.log('Contenu brut:', content.substring(0, 200) + '...');
  }

  // Si c'est une réponse structurée, l'afficher avec les composants UI
  if (parsedResponse) {
    console.log('🎨 Rendu de la réponse structurée');
    return (
      <div className="space-y-4">
        {/* Afficher le message textuel */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {parsedResponse.message}
        </div>

        {/* Afficher les composants UI si présents */}
        {parsedResponse.uiComponents && parsedResponse.uiComponents.length > 0 && (() => {
          // Définir les ratios d'espace pour chaque type de composant
          const getComponentRatio = (componentType: string): number => {
            switch (componentType) {
              case 'MapView':
                return 2; // La carte prend beaucoup d'espace
              case 'ChecklistDocuments':
                return 1.5; // Liste modérée
              case 'ContactCard':
                return 1; // Carte compacte
              case 'RedirectButtons':
                return 3; // Boutons s'étendent largement
              default:
                return 1;
            }
          };

          // Calculer la grille dynamique basée sur les ratios
          const components = parsedResponse.uiComponents;
          const totalRatio = components.reduce((sum, comp) => sum + getComponentRatio(comp.component), 0);
          const gridTemplateColumns = components
            .map(comp => `${getComponentRatio(comp.component)}fr`)
            .join(' ');

          return (
            <div
              className="grid gap-4 mt-6 auto-rows-min"
              style={{ gridTemplateColumns }}
            >
              {components.map((uiComponent: UIComponent, index: number) => (
                <div key={index} className="flex min-w-0">
                  <UIRenderer
                    data={uiComponent}
                    onActionClick={onActionClick}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        {/* Afficher les métadonnées si en mode développement */}
        {process.env.NODE_ENV === 'development' && parsedResponse.metadata && (
          <details className="mt-4 text-xs text-gray-500">
            <summary>Métadonnées de débogage</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
              {JSON.stringify(parsedResponse.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  // Fallback : afficher comme texte brut (rétrocompatibilité)
  console.log('📄 Rendu en fallback texte brut');
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {content}
    </div>
  );
}