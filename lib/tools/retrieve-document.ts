import { Tool } from "@langchain/core/tools";

interface SearchResult {
  metadata: {
    source: string;
  };
  similarity: number;
  content: string;
}

export class RetrieveDocumentTool extends Tool {
  name = "retrieve_document";
  description = "Recherche sémantique dans la base documentaire ANDF et domaine foncier au Bénin. Utilisez cette fonction pour répondre aux questions sur l'organisation de l'ANDF, ses responsables, ses services, les procédures foncières, les lois et réglementations. Prend une requête en français et retourne les informations pertinentes extraites des documents officiels.";

  constructor() {
    super();
  }

  async _call(query: string): Promise<string> {
    try {
      console.log(`🔍 Recherche documentaire pour: "${query}"`);

      // Appeler l'API de recherche interne
      // En mode serveur, utiliser l'URL locale directe
      const baseUrl = 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 5 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return `Aucun document pertinent trouvé pour la requête: "${query}"`;
      }

      // Formater les résultats
      const formattedResults = data.results.map((result: SearchResult, index: number) => {
        return `
📄 **Résultat ${index + 1}** (Source: ${result.metadata.source}, Score: ${result.similarity.toFixed(4)})
${result.content}
---
        `.trim();
      }).join('\n\n');

      console.log(`✅ ${data.results.length} résultats trouvés`);
      return `Voici les informations pertinentes trouvées dans les documents pour "${query}":

${formattedResults}

🔍 Recherche effectuée sur ${data.results.length} documents similaires.`;

    } catch (error) {
      console.error("❌ Erreur lors de la recherche documentaire:", error);
      return `Erreur lors de la recherche documentaire: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }
}