import { createLLM, langchainConfig } from "./config";
import { Tool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentResponse, AgentResponseSchema } from "./output-parser";


// Liste des tools disponibles pour l'agent
const createTools = async (): Promise<Tool[]> => {
  // Import dynamique pour éviter les problèmes de build
  const { RetrieveDocumentTool } = await import("../tools/retrieve-document");
  const { GetAnalysisDataTool } = await import("../tools/get-analysis-data");

  return [
    new RetrieveDocumentTool(),
    new GetAnalysisDataTool(),
  ];
};

// Création du prompt système pour l'agent
const createSystemPrompt = () => {
  return ChatPromptTemplate.fromMessages([
    [
      "system",
      langchainConfig.agent.systemPrompt,
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);
};

// Création de l'agent principal
export const createAgent = async () => {
  try {
    const llm = createLLM();
    const tools = await createTools();
    const prompt = createSystemPrompt();

    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: process.env.NODE_ENV === 'development',
      maxIterations: 5,
      returnIntermediateSteps: true,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'agent:", error);
    throw error;
  }
};

// Fonction principale pour exécuter l'agent avec sortie structurée
export const runAgent = async (input: string, chatHistory: Array<{role: string, content: string}> = []): Promise<AgentResponse> => {
  try {
    // Utiliser le LLM avec sortie structurée forcée
    const llm = createLLM();
    const structuredLLM = llm.withStructuredOutput(AgentResponseSchema, {
      name: "agent_response",
      method: "json_mode", // Mode JSON natif de Gemini
    });

    const tools = await createTools();

    // Convertir l'historique en messages LangChain
    const messages = chatHistory.map((msg: {role: string, content: string}) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "user":
          return new HumanMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });

    // Créer le prompt avec les instructions structurées
    let systemPrompt = `Vous êtes Ilèmi, un assistant spécialisé du domaine foncier au Bénin.

## 🏛️ VOTRE MISSION :
Conseiller et orienter les utilisateurs sur :
- L'ANDF (Agence Nationale du Domaine et du Foncier) : organisation, responsables, services
- Le domaine foncier au Bénin : lois, procédures, droits fonciers
- Les démarches administratives liées au foncier
- L'analyse et l'explication de relevés topographiques

## 🛠️ OUTILS DISPONIBLES :
- **retrieve_document** : Recherche dans votre base documentaire ANDF/foncier
- **get_analysis_data** : Récupère les résultats d'analyse topographique

## 📋 FORMAT DE RÉPONSE :
Vous devez fournir une réponse structurée avec :
- message: Votre réponse textuelle complète en français
- metadata: Informations contextuelles (optionnel)
- uiComponents: Composants UI à afficher (optionnel)

Utilisez les composants UI appropriés selon le contexte :
- ContactCard pour les coordonnées (nom, téléphone, email, adresse)
- ChecklistDocuments pour les listes de documents ou actions (title, documents avec id, name, status)
- MapView pour les cartes géographiques (location, coordinates)
- Organigram pour les structures hiérarchiques (title, root)
- QuickActions pour les actions rapides avec icônes (title, actions avec label, icon, action)

${chatHistory.length > 0 ? 'Historique de la conversation :' : ''}
${messages.map((msg) => `${msg._getType()}: ${msg.content}`).join('\n')}

Question de l'utilisateur : ${input}`;

    console.log("🤖 Exécution de l'agent avec sortie structurée...");

    // Utiliser les tools si nécessaire, sinon réponse directe structurée
    const toolResults: unknown[] = [];

    // Pour les questions simples, on peut répondre directement
    // Pour les questions complexes, on utilise les tools
    if (input.toLowerCase().includes('document') ||
        input.toLowerCase().includes('recherche') ||
        input.toLowerCase().includes('analyse')) {

      console.log("🔧 Utilisation des tools pour traiter la requête...");

      // Créer un agent temporaire pour utiliser les tools
      const tempPrompt = ChatPromptTemplate.fromMessages([
        ["system", "Vous êtes un assistant qui utilise des tools pour répondre aux questions. Soyez concis."],
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      const tempAgent = await createToolCallingAgent({
        llm,
        tools,
        prompt: tempPrompt,
      });

      const tempExecutor = new AgentExecutor({
        agent: tempAgent,
        tools,
        verbose: false,
        maxIterations: 3,
      });

      const toolResult = await tempExecutor.call({
        input,
        chat_history: messages,
      });

      // Ajouter le contexte des tools au prompt système
      systemPrompt += `\n\nContexte des outils utilisés :\n${toolResult.output}`;
      toolResults.push(...(toolResult.intermediateSteps || []));
    }

    // Générer la réponse structurée finale
    const finalResult = await structuredLLM.invoke(systemPrompt);

    console.log("✅ Réponse structurée reçue:", {
      messageLength: finalResult.message?.length || 0,
      uiComponentsCount: finalResult.uiComponents?.length || 0,
      hasMetadata: !!finalResult.metadata
    });

    return finalResult as AgentResponse;
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'agent:", error);

    // Fallback en cas d'erreur
    return {
      message: "Désolé, une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer.",
      metadata: {
        confidence: 0,
        timestamp: new Date().toISOString(),
      },
      uiComponents: [],
    };
  }
};
