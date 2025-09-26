import { createLLM, langchainConfig } from "./config";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
// Liste des tools disponibles pour l'agent
const createReasoningTools = async () => {
    // Import dynamique pour éviter les problèmes de build
    const { RetrieveDocumentTool } = await import("../tools/retrieve-document");
    const { GetAnalysisDataTool } = await import("../tools/get-analysis-data");
    return [
        new RetrieveDocumentTool(),
        new GetAnalysisDataTool(),
    ];
};
const createUITools = async () => {
    // Import dynamique pour éviter les problèmes de build
    const { RenderUITool } = await import("../tools/render-ui");
    return [
        new RenderUITool(),
    ];
};
const createAllTools = async () => {
    const reasoningTools = await createReasoningTools();
    const uiTools = await createUITools();
    return [...reasoningTools, ...uiTools];
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
// Création de l'agent de raisonnement (sans tools UI)
export const createReasoningAgent = async () => {
    try {
        const llm = createLLM();
        const tools = await createReasoningTools();
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
    }
    catch (error) {
        console.error("Erreur lors de la création de l'agent de raisonnement:", error);
        throw error;
    }
};
// Création de l'agent de réponse finale (avec tools UI)
export const createFinalResponseAgent = async () => {
    try {
        const llm = createLLM();
        const tools = await createAllTools();
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
            maxIterations: 3, // Moins d'itérations pour la réponse finale
            returnIntermediateSteps: true,
        });
    }
    catch (error) {
        console.error("Erreur lors de la création de l'agent de réponse finale:", error);
        throw error;
    }
};
// Système de détection automatique de composants UI
const detectUIComponents = (text) => {
    const components = [];
    // Patterns pour détecter les besoins d'UI
    const uiPatterns = [
        {
            component: 'ContactCard',
            patterns: [
                /coordonnées.*(?:téléphone|email|adresse)/i,
                /contacter.*(?:ANDF|agence)/i,
                /(?:téléphone|email|adresse).*ANDF/i
            ],
            propsBuilder: (text) => ({
                name: "Agence Nationale du Domaine et du Foncier",
                phone: "+229 XX XX XX XX", // À remplacer par les vraies coordonnées
                email: "contact@andf.bj",
                address: "Adresse de l'ANDF"
            })
        },
        {
            component: 'ChecklistDocuments',
            patterns: [
                /documents.*requis/i,
                /liste.*(?:papiers|documents)/i,
                /pièces.*fournir/i
            ],
            propsBuilder: (text) => ({
                title: "Documents requis",
                documents: [
                    { id: "1", name: "Document 1", status: "pending" },
                    { id: "2", name: "Document 2", status: "pending" }
                ]
            })
        },
        {
            component: 'Organigram',
            patterns: [
                /organigramme/i,
                /hiérarchie.*ANDF/i,
                /structure.*organisation/i
            ],
            propsBuilder: (text) => ({
                title: "Organigramme ANDF",
                root: {
                    id: "dg",
                    name: "Directeur Général",
                    role: "Directeur Général",
                    children: []
                }
            })
        }
    ];
    for (const { component, patterns, propsBuilder } of uiPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                components.push({
                    component,
                    props: propsBuilder(text)
                });
                break; // Un seul composant de chaque type
            }
        }
    }
    return components;
};
// Post-traitement de la réponse finale
const processFinalResponse = async (text) => {
    console.log("🔍 Analyse de la réponse pour composants UI automatiques...");
    console.log("📄 Texte analysé:", text.substring(0, 200) + "...");
    const uiComponents = detectUIComponents(text);
    console.log("🎯 Composants UI détectés automatiquement:", uiComponents);
    if (uiComponents.length === 0) {
        console.log("ℹ️ Aucun composant UI détecté automatiquement");
        return text;
    }
    console.log("🔧 Génération des appels render_ui pour", uiComponents.length, "composants...");
    // Générer les appels render_ui pour chaque composant détecté
    const uiCalls = await Promise.all(uiComponents.map(async (component) => {
        console.log("📞 Appel render_ui pour:", component.component);
        const renderUITool = new (await import("../tools/render-ui")).RenderUITool();
        const result = await renderUITool._call(JSON.stringify({
            component: component.component,
            props: component.props
        }));
        console.log("✅ Résultat render_ui:", result.substring(0, 100) + "...");
        return result;
    }));
    // Combiner le texte et les composants UI
    let processedText = text;
    // Ajouter les composants UI à la fin si aucun n'est déjà présent dans le texte
    if (!processedText.includes('{"success":true')) {
        console.log("📎 Ajout des composants UI à la réponse");
        processedText += "\n\n" + uiCalls.join("\n\n");
    }
    else {
        console.log("ℹ️ Composants UI déjà présents dans la réponse");
    }
    return processedText;
};
// Fonction utilitaire pour exécuter l'agent en deux étapes
export const runAgent = async (input, chatHistory = []) => {
    try {
        // Étape 1: Raisonnement avec les tools de recherche uniquement
        const reasoningAgent = await createReasoningAgent();
        // Convertir l'historique en messages LangChain
        const messages = chatHistory.map((msg) => {
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
        console.log("🤖 Étape 1: Raisonnement avec tools de recherche...");
        const reasoningResult = await reasoningAgent.call({
            input,
            chat_history: messages,
        });
        console.log("✅ Raisonnement terminé, préparation de la réponse finale...");
        // Étape 2: Génération de la réponse finale avec possibilité d'utiliser render_ui
        const finalAgent = await createFinalResponseAgent();
        // Préparer le contexte pour la réponse finale
        const finalContext = `
Contexte de la recherche effectuée:
${reasoningResult.output}

Étapes intermédiaires:
${reasoningResult.intermediateSteps?.map((step) => `Action: ${step.action?.tool || 'Unknown'} - Résultat: ${String(step.observation || '').substring(0, 200)}...`).join('\n') || 'Aucune étape intermédiaire'}

Maintenant, formulez une réponse finale claire et utile à l'utilisateur.
Utilisez render_ui UNIQUEMENT si cela améliore significativement l'expérience utilisateur (composants visuels pertinents).
Si vous utilisez render_ui, assurez-vous que c'est justifié et utile.`;
        const finalMessages = [
            ...messages,
            new HumanMessage(input),
            new AIMessage(reasoningResult.output),
            new HumanMessage(finalContext)
        ];
        console.log("🎨 Étape 2: Génération de la réponse finale avec render_ui disponible...");
        const finalResult = await finalAgent.call({
            input: finalContext,
            chat_history: finalMessages,
        });
        console.log("📝 Réponse finale brute:", finalResult.output);
        console.log("🔍 Étapes intermédiaires de la réponse finale:", finalResult.intermediateSteps);
        // Post-traitement automatique pour ajouter des composants UI si nécessaire
        const processedOutput = await processFinalResponse(finalResult.output);
        console.log("✨ Réponse finale traitée:", processedOutput);
        return {
            output: processedOutput,
            intermediateSteps: [
                ...(reasoningResult.intermediateSteps || []),
                ...(finalResult.intermediateSteps || [])
            ],
        };
    }
    catch (error) {
        console.error("Erreur lors de l'exécution de l'agent:", error);
        throw error;
    }
};
