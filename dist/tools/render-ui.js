import { Tool } from "@langchain/core/tools";
export class RenderUITool extends Tool {
    name = "render_ui";
    description = "Affiche des composants UI interactifs dans le chat pour améliorer l'expérience utilisateur. Utilisez cette fonction pour présenter des informations de manière visuelle et attractive. Composants disponibles: ChecklistDocuments (liste de documents requis), ContactCard (coordonnées ANDF), MapView (carte géographique), Organigram (organigramme ANDF), QuickActions (boutons d'actions rapides). Format: {component: 'nom_composant', props: {clé: valeur}}.";
    constructor() {
        super();
    }
    async _call(input) {
        try {
            const parsed = JSON.parse(input);
            if (!parsed.component || !parsed.props) {
                throw new Error("Format invalide: attendu { component, props }");
            }
            console.log(`🎨 Rendu UI demandé: ${parsed.component}`, parsed.props);
            // Ici on ne renvoie pas du HTML directement,
            // mais un JSON structuré que le frontend sait interpréter
            return JSON.stringify({
                success: true,
                component: parsed.component,
                props: parsed.props,
            });
        }
        catch (error) {
            console.error("❌ Erreur lors du rendu UI:", error);
            return JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
}
