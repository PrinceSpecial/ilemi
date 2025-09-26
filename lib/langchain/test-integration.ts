// Test d'intégration LangChain avec Vercel AI SDK
// Ce fichier permet de vérifier que LangChain fonctionne avec notre configuration existante

import { createLLM } from "./config";

export async function testLangChainIntegration() {
  try {
    console.log("🧪 Test d'intégration LangChain.js...");

    // Test de création du LLM
    const llm = createLLM();
    console.log("✅ LLM créé avec succès");

    // Test d'appel simple
    const response = await llm.invoke("Bonjour, pouvez-vous me dire qui vous êtes ?");
    console.log("✅ Réponse du LLM:", response.content);

    // Test avec un prompt plus complexe
    const complexPrompt = `Vous êtes un assistant spécialisé dans l'analyse de documents topographiques au Bénin.
    Un utilisateur vous demande: "Pouvez-vous analyser ma parcelle foncière ?"
    Répondez en français de manière professionnelle.`;

    const complexResponse = await llm.invoke(complexPrompt);
    console.log("✅ Réponse complexe:", complexResponse.content);

    return {
      success: true,
      message: "Intégration LangChain réussie"
    };

  } catch (error) {
    console.error("❌ Erreur lors du test d'intégration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}

// Test des tools (placeholders)
export async function testToolsIntegration() {
  try {
    console.log("🛠️ Test des tools...");

    const { RetrieveDocumentTool } = await import("../tools/retrieve-document");
    const { GetAnalysisDataTool } = await import("../tools/get-analysis-data");

    const retrieveTool = new RetrieveDocumentTool();
    const analysisTool = new GetAnalysisDataTool();

    console.log("✅ Tools créés avec succès");

    // Test d'appel des tools
    const retrieveResult = await retrieveTool._call("test query");
    const analysisResult = await analysisTool._call("test analysis");

    console.log("✅ Tools fonctionnels:");
    console.log("- Retrieve:", retrieveResult);
    console.log("- Analysis:", analysisResult);

    return {
      success: true,
      message: "Tools opérationnels"
    };

  } catch (error) {
    console.error("❌ Erreur lors du test des tools:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}

// Test complet de l'agent
export async function testAgentIntegration() {
  try {
    console.log("🤖 Test de l'agent complet...");

    const { runAgent } = await import("./agent");

    const testInput = "Bonjour, je voudrais vérifier ma parcelle foncière";
    const result = await runAgent(testInput);

    console.log("✅ Agent exécuté avec succès");
    console.log("📝 Réponse:", result.message);
    console.log("🎨 Composants UI:", result.uiComponents);

    return {
      success: true,
      message: "Agent opérationnel",
      response: result.message,
      uiComponents: result.uiComponents
    };

  } catch (error) {
    console.error("❌ Erreur lors du test de l'agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}