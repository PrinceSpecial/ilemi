import { z } from "zod";
import { BaseOutputParser } from "@langchain/core/output_parsers";

// Schéma pour les propriétés de chaque composant
const ContactCardPropsSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

const MapViewPropsSchema = z.object({
  location: z.string(),
  // Allow either object form or [lat, lng] array with length(2)
  coordinates: z
    .union([
      z.object({ lat: z.number(), lng: z.number() }),
      z.array(z.number()).length(2),
    ])
    .optional(),
});

const ChecklistDocumentsPropsSchema = z.object({
  title: z.string(),
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["pending", "completed", "in_progress"]),
  })),
});

const RedirectButtonsPropsSchema = z.object({
  title: z.string(),
  buttons: z.array(z.object({
    id: z.string(),
    label: z.string(),
    link: z.string(),
  })),
});

const ProcessContainerPropsSchema = z.object({
  status: z.enum(["idle", "extracting", "comparing", "generating_report", "done"]),
});

const ReportContainerPropsSchema = z.object({
  reportData: z.object({
    // Use fixed-length arrays instead of tuples to avoid 'prefixItems' in JSON schema
    terrainCoordinates: z.array(z.array(z.array(z.number()).length(2))),
    layers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      coordinates: z.array(z.array(z.array(z.number()).length(2))),
      intersects: z.boolean(),
      description: z.string().optional(),
      status: z.string().optional(),
    })),
    summary: z.object({
      totalArea: z.number(),
      intersectingLayers: z.number(),
      status: z.string(),
    }),
  }),
});

// Schéma pour les composants UI avec propriétés typées
export const UIComponentSchema = z.object({
  component: z.enum([
    "ContactCard",
    "MapView",
    "ChecklistDocuments",
    "RedirectButtons",
    "ProcessContainer",
    "ReportContainer"
  ]),
  props: z.union([
    ContactCardPropsSchema,
    MapViewPropsSchema,
    ChecklistDocumentsPropsSchema,
    RedirectButtonsPropsSchema,
    ProcessContainerPropsSchema,
    ReportContainerPropsSchema,
  ]),
});

// Schéma pour la réponse structurée de l'agent
export const AgentResponseSchema = z.object({
  message: z.string().describe("Le contenu textuel de la réponse"),
  metadata: z.object({
    confidence: z.number().min(0).max(1).optional(),
    sources: z.array(z.string()).optional(),
    timestamp: z.string().optional(),
  }).optional(),
  uiComponents: z.array(UIComponentSchema).optional().default([]),
});

// Type TypeScript déduit du schéma
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type UIComponent = z.infer<typeof UIComponentSchema>;

// Type pour les actions UI
export interface UIAction {
  action: string;
  label: string;
  [key: string]: unknown;
}

// OutputParser personnalisé pour forcer l'agent à répondre en JSON structuré
export class StructuredAgentOutputParser extends BaseOutputParser<AgentResponse> {
  lc_namespace = ["langchain", "output_parsers", "structured_agent"];

  lc_serializable = true;

  async parse(text: string): Promise<AgentResponse> {
    try {
      // Nettoyer le texte pour extraire le JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Aucun objet JSON trouvé dans la réponse");
      }

      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      // Valider avec Zod
      const validated = AgentResponseSchema.parse(parsed);

      return validated;
    } catch (error) {
      console.error("Erreur de parsing de la réponse de l'agent:", error);

      // Fallback : retourner le texte brut comme message simple
      return {
        message: text.trim(),
        metadata: {
          confidence: 0.5,
          timestamp: new Date().toISOString(),
        },
        uiComponents: [],
      };
    }
  }

  getFormatInstructions(): string {
    return `Vous devez répondre UNIQUEMENT avec un objet JSON valide respectant cette structure :

{
  "message": "Votre réponse textuelle complète et détaillée",
  "metadata": {
    "confidence": 0.95,
    "sources": ["source1", "source2"],
    "timestamp": "2025-01-01T12:00:00Z"
  },
  "uiComponents": [
    {
      "component": "ContactCard",
      "props": {
        "name": "ANDF",
        "phone": "+229 XX XX XX XX",
        "email": "contact@andf.bj",
        "address": "Adresse complète"
      }
    }
  ]
}

INSTRUCTIONS IMPORTANTES :
- Le champ "message" doit contenir TOUTE votre réponse textuelle
- Utilisez "uiComponents" uniquement quand un composant visuel améliore vraiment l'expérience utilisateur
- Tous les champs sont optionnels sauf "message"
- Le JSON doit être valide et bien formé`;
  }
}