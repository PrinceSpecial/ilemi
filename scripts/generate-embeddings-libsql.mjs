#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { createClient } from "@libsql/client";

// Charger les variables d'environnement depuis .env
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const DATA_PATH = "./public/documents";
const DB_PATH = "./db/embeddings.db";

/**
 * Script pour générer les embeddings des documents txt et les stocker dans LibSQL
 */
async function generateEmbeddings() {
  try {
    console.log("🚀 Génération d'embeddings avec LibSQL...");

    // Vérifier que la clé API est disponible
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY n'est pas défini");
    }

    // 1. Initialiser les embeddings Google
    console.log("📊 Initialisation des embeddings Google...");
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // 2. Initialiser LibSQL client
    console.log("🔗 Initialisation de LibSQL...");
    const client = createClient({
      url: `file:${DB_PATH}`,
    });

    // 3. Créer la table des embeddings si elle n'existe pas
    await client.execute(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        embedding BLOB NOT NULL
      )
    `);

    // Vider la table existante
    await client.execute("DELETE FROM embeddings");
    console.log("🗑️ Table embeddings vidée");

    // 4. Lire tous les fichiers txt
    console.log("📁 Lecture des fichiers documents...");
    const files = fs.readdirSync(DATA_PATH)
      .filter(file => file.endsWith('.txt'))
      .map(file => path.join(DATA_PATH, file));

    console.log(`📄 ${files.length} fichiers txt trouvés`);

    // 5. Traiter chaque fichier
    const allDocuments = [];

    for (const filePath of files) {
      console.log(`📖 Traitement de ${path.basename(filePath)}...`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.txt');

      // Découper le document en chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const chunks = await textSplitter.splitText(content);

      // Créer des documents LangChain
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        allDocuments.push(new Document({
          pageContent: chunk,
          metadata: { 
            source: fileName, 
            chunk: i,
            totalChunks: chunks.length,
            filePath: filePath
          },
        }));
      }

      console.log(`  ✅ ${chunks.length} chunks créés`);
    }

    console.log(`🧮 Génération d'embeddings pour ${allDocuments.length} documents...`);

    // 6. Générer les embeddings et stocker dans LibSQL
    for (let i = 0; i < allDocuments.length; i++) {
      const doc = allDocuments[i];
      
      // Générer l'embedding
      const embedding = await embeddings.embedQuery(doc.pageContent);
      
      // Convertir l'embedding en buffer pour SQLite
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
      
      // Insérer dans la base
      await client.execute({
        sql: "INSERT INTO embeddings (content, metadata, embedding) VALUES (?, ?, ?)",
        args: [
          doc.pageContent,
          JSON.stringify(doc.metadata),
          embeddingBuffer
        ]
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  📊 ${i + 1}/${allDocuments.length} embeddings générés et stockés`);
      }
    }

    console.log("✅ Embeddings générés et stockés avec succès!");
    console.log(`📊 Statistiques:`);
    console.log(`  - ${files.length} fichiers traités`);
    console.log(`  - ${allDocuments.length} documents indexés`);
    console.log(`  - Base de données: ${DB_PATH}`);

    // 7. Tester une recherche
    console.log("🧪 Test de recherche...");
    await testSearch(client, embeddings);

    await client.close();

  } catch (error) {
    console.error("❌ Erreur lors de la génération d'embeddings:", error);
    process.exit(1);
  }
}

/**
 * Fonction pour tester la recherche par similarité
 */
async function testSearch(client, embeddings) {
  const query = "analyse foncière";
  console.log(`🔍 Recherche pour: "${query}"`);

  // Générer l'embedding de la requête
  const queryEmbedding = await embeddings.embedQuery(query);

  // Récupérer tous les documents pour calculer la similarité
  const result = await client.execute("SELECT id, content, metadata, embedding FROM embeddings");
  
  const similarities = [];
  
  for (const row of result.rows) {
    try {
      // Convertir le buffer en Float32Array
      const embeddingBuffer = row.embedding;
      const docEmbedding = new Float32Array(embeddingBuffer);
      
      // Calculer la similarité cosinus
      const similarity = cosineSimilarity(queryEmbedding, Array.from(docEmbedding));
      
      // Vérifier que la similarité est valide
      if (!isNaN(similarity) && isFinite(similarity)) {
        similarities.push({
          id: row.id,
          content: row.content,
          metadata: JSON.parse(row.metadata),
          similarity: similarity
        });
      }
    } catch (error) {
      console.error(`Erreur pour le document ${row.id}:`, error);
      continue;
    }
  }

  if (similarities.length === 0) {
    console.log("❌ Aucune similarité valide calculée");
    return;
  }

  // Trier par similarité décroissante et prendre les 3 meilleurs
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, 3);

  console.log(`📄 ${topResults.length} résultats les plus pertinents:`);
  topResults.forEach((result, index) => {
    console.log(`  ${index + 1}. Score: ${result.similarity.toFixed(4)} - ${result.metadata.source}`);
    console.log(`     ${result.content.substring(0, 100)}...`);
  });
}

/**
 * Calculer la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

// Exécuter le script
generateEmbeddings();