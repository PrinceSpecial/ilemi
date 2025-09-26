import { Tool } from "@langchain/core/tools";

export class GetAnalysisDataTool extends Tool {
  name = "get_analysis_data";
  description = "Récupère et explique les résultats d'analyse topographique des parcelles foncières depuis le local storage. Utilisez cette fonction quand l'utilisateur pose des questions sur les résultats d'une analyse déjà effectuée (superficie, coordonnées GPS, bornage, conflits potentiels, titre foncier, analyse géographique). Prend une requête décrivant la parcelle ou l'analyse concernée.";

  constructor() {
    super();
  }

  async _call(query: string): Promise<string> {
    try {
      console.log(`📊 Consultation des données d'analyse pour: "${query}"`);

      // TODO: Récupérer les vraies données du localStorage
      // Pour l'instant, on mock des données d'analyse

      const mockAnalysisData = {
        "parcelle_123": {
          superficie: "2500 m²",
          coordonnees: "6.3703°N, 2.3912°E",
          bornage: "Bornage effectué le 15/09/2024",
          conflits: "Aucun conflit détecté",
          titre_foncier: "Titre N° BF-2024-00123",
          analyse_geographique: {
            zone_urbaine: true,
            acces_route: "Bonne accessibilité",
            services_publics: ["Eau", "Électricité", "Voirie"],
            risques: "Aucun risque identifié"
          }
        },
        "parcelle_456": {
          superficie: "1800 m²",
          coordonnees: "6.3721°N, 2.3898°E",
          bornage: "Bornage en cours",
          conflits: "Conflit potentiel avec parcelle adjacente",
          titre_foncier: "En cours d'établissement",
          analyse_geographique: {
            zone_urbaine: false,
            acces_route: "Accessibilité limitée",
            services_publics: ["Eau"],
            risques: "Zone inondable - Risque moyen"
          }
        }
      };

      // Recherche basée sur la requête
      const queryLower = query.toLowerCase();

      if (queryLower.includes("parcelle") || queryLower.includes("123")) {
        const data = mockAnalysisData.parcelle_123;
        return `📊 **Analyse de la Parcelle BF-2024-00123**

**Informations générales :**
- **Superficie** : ${data.superficie}
- **Coordonnées GPS** : ${data.coordonnees}
- **Bornage** : ${data.bornage}
- **Titre foncier** : ${data.titre_foncier}

**Analyse géographique :**
- **Zone** : ${data.analyse_geographique.zone_urbaine ? "Urbaine" : "Péri-urbaine"}
- **Accessibilité** : ${data.analyse_geographique.acces_route}
- **Services publics** : ${data.analyse_geographique.services_publics.join(", ")}
- **Risques identifiés** : ${data.analyse_geographique.risques}

**Statut** : ${data.conflits}`;
      }

      if (queryLower.includes("456") || queryLower.includes("conflit")) {
        const data = mockAnalysisData.parcelle_456;
        return `⚠️ **Analyse de la Parcelle BF-2024-00456**

**Informations générales :**
- **Superficie** : ${data.superficie}
- **Coordonnées GPS** : ${data.coordonnees}
- **Bornage** : ${data.bornage}
- **Titre foncier** : ${data.titre_foncier}

**Analyse géographique :**
- **Zone** : ${data.analyse_geographique.zone_urbaine ? "Urbaine" : "Péri-urbaine"}
- **Accessibilité** : ${data.analyse_geographique.acces_route}
- **Services publics** : ${data.analyse_geographique.services_publics.join(", ")}
- **Risques identifiés** : ${data.analyse_geographique.risques}

**⚠️ Alertes** : ${data.conflits}`;
      }

      // Recherche générale
      if (queryLower.includes("analyse") || queryLower.includes("résultat")) {
        return `📊 **Résultats d'analyse disponibles**

J'ai accès aux analyses topographiques suivantes :

**Parcelle BF-2024-00123** (Cotonou Centre)
- Superficie : 2 500 m²
- Statut : Bornage validé, titre foncier délivré
- Risques : Aucun

**Parcelle BF-2024-00456** (Abomey-Calavi)
- Superficie : 1 800 m²
- Statut : Bornage en cours
- Risques : Zone inondable (risque moyen)

**Parcelle BF-2024-00789** (Porto-Novo)
- Superficie : 3 200 m²
- Statut : Analyse préliminaire terminée
- Risques : Conflit de propriété détecté

Précisez quelle parcelle vous intéresse pour obtenir le détail complet de l'analyse.`;
      }

      // Si aucune correspondance spécifique
      return `📊 **Données d'analyse non trouvées**

Je n'ai pas trouvé d'analyse spécifique correspondant à votre requête : "${query}"

Les analyses disponibles concernent les parcelles suivantes :
- BF-2024-00123 (Cotonou Centre)
- BF-2024-00456 (Abomey-Calavi)
- BF-2024-00789 (Porto-Novo)

Pouvez-vous préciser le numéro de parcelle ou la localisation qui vous intéresse ?`;

    } catch (error) {
      console.error("❌ Erreur lors de la consultation des données d'analyse:", error);
      return `Erreur lors de la consultation des données d'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }
}