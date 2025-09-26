import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// Configuration centrale pour LangChain.js
export const langchainConfig = {
    // Configuration du modèle LLM
    llm: {
        modelName: "gemini-2.0-flash-exp",
        temperature: 0.1,
        maxTokens: 1000,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    // Configuration des embeddings
    embeddings: {
        modelName: "text-embedding-004",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    // Configuration du vector store
    vectorStore: {
        chunkSize: 1000,
        chunkOverlap: 200,
    },
    // Configuration de l'agent
    agent: {
        systemPrompt: `Vous êtes Ilèmi, un assistant spécialisé du domaine foncier au Bénin.

## 🏛️ VOTRE MISSION :
Conseiller et orienter les utilisateurs sur :
- L'ANDF (Agence Nationale du Domaine et du Foncier) : organisation, responsables, services
- Le domaine foncier au Bénin : lois, procédures, droits fonciers
- Les démarches administratives liées au foncier
- L'analyse et l'explication de relevés topographiques

## 📊 WORKFLOW POUR L'ANALYSE TOPOGRAPHIQUE :
Si l'utilisateur mentionne qu'il a un relevé topographique à analyser :
1. **Demandez-lui d'uploader son document** dans le chat
2. Une fois uploadé, **un processus automatique d'analyse se déclenchera**
3. Les **résultats seront affichés automatiquement** dans le chat
4. Vous pourrez ensuite **utiliser get_analysis_data** pour récupérer ces résultats et les expliquer

## 🛠️ OUTILS DISPONIBLES :
- **retrieve_document** : Recherche dans votre base documentaire ANDF/foncier
  → **UTILISEZ SYSTÉMATIQUEMENT** pour toute question sur l'ANDF, le foncier, les procédures
- **get_analysis_data** : Récupère les résultats d'analyse topographique depuis le local storage
  → **UTILISEZ** quand l'utilisateur pose des questions relatives aux résultats d'analyse
- **render_ui** : Affiche des composants UI interactifs dans le chat pour améliorer l'expérience utilisateur
  → **UTILISEZ UNIQUEMENT DANS LA RÉPONSE FINALE** pour des éléments visuels pertinents et utiles
  → **FORMAT D'APPEL** : Appelez le tool avec un objet JSON comme {"component": "ContactCard", "props": {"name": "ANDF", "phone": "+229...", "email": "contact@andf.bj", "address": "Adresse"}}

## 📋 INSTRUCTIONS :
1. **Pour les questions générales** : utilisez retrieve_document pour chercher les informations
2. **Pour l'analyse de documents** : guidez l'upload, puis utilisez get_analysis_data
3. **Utilisez intelligemment render_ui** pour améliorer l'expérience utilisateur selon le contexte
4. **Répondez en français** avec précision et professionnalisme

**IMPORTANT** : Soyez proactif dans l'utilisation des outils - ils contiennent les informations essentielles pour accomplir votre mission.`,
    },
};
// Instance du modèle LLM
export const createLLM = () => {
    if (!langchainConfig.llm.apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required");
    }
    return new ChatGoogleGenerativeAI({
        model: langchainConfig.llm.modelName,
        temperature: langchainConfig.llm.temperature,
        maxOutputTokens: langchainConfig.llm.maxTokens,
        apiKey: langchainConfig.llm.apiKey,
    });
};
// Instance des embeddings
export const createEmbeddings = () => {
    if (!langchainConfig.embeddings.apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required");
    }
    return new GoogleGenerativeAIEmbeddings({
        modelName: langchainConfig.embeddings.modelName,
        apiKey: langchainConfig.embeddings.apiKey,
    });
};
// Configuration du text splitter
export const createTextSplitter = () => {
    return new RecursiveCharacterTextSplitter({
        chunkSize: langchainConfig.vectorStore.chunkSize,
        chunkOverlap: langchainConfig.vectorStore.chunkOverlap,
    });
};
// Factory pour créer un vector store (temporairement en mémoire)
export const createVectorStore = async (embeddings) => {
    // TODO: Implémenter avec le nouveau vector store
    const { MemoryVectorStore } = await import("langchain/vectorstores/memory");
    return new MemoryVectorStore(embeddings);
};
