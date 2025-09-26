import { NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "@libsql/client";

const DB_PATH = "./db/embeddings.db";

/**
 * Calculer la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`🔍 Recherche documentaire pour: "${query}"`);

    // Initialiser les embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Initialiser LibSQL client
    const client = createClient({
      url: `file:${DB_PATH}`,
    });

    // Générer l'embedding de la requête
    const queryEmbedding = await embeddings.embedQuery(query);

    // Récupérer tous les documents pour calculer la similarité
    const result = await client.execute("SELECT id, content, metadata, embedding FROM embeddings");
    
    if (!result.rows || result.rows.length === 0) {
      await client.close();
      return NextResponse.json({ 
        results: [],
        message: "Aucun document trouvé dans la base de données"
      });
    }

    const similarities = [];
    
    for (const row of result.rows) {
      try {
        // Convertir le buffer en Float32Array puis en array normal
        const docEmbedding = new Float32Array(row.embedding as ArrayBuffer);
        
        // Calculer la similarité cosinus
        const similarity = cosineSimilarity(queryEmbedding, Array.from(docEmbedding));
        
        similarities.push({
          id: row.id,
          content: row.content as string,
          metadata: JSON.parse(row.metadata as string),
          similarity: similarity
        });
      } catch (error) {
        console.error("Erreur lors du traitement du document:", error);
        continue;
      }
    }

    // Trier par similarité décroissante et prendre les meilleurs résultats
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, limit);

    await client.close();

    console.log(`✅ ${topResults.length} résultats trouvés`);

    return NextResponse.json({ 
      results: topResults.map(result => ({
        content: result.content,
        metadata: result.metadata,
        similarity: result.similarity
      }))
    });

  } catch (error: unknown) {
    console.error("❌ Erreur lors de la recherche:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
