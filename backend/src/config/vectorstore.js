import { OpenAIEmbeddings } from "@langchain/openai";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { ChromaClient } from "chromadb";

// Single shared Chroma HTTP client for the whole process.
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});


class DirectChromaVectorStore extends VectorStore {
  constructor(embeddings, { collectionName }) {
    super(embeddings, {});
    this.collectionName = collectionName;
    this.collection = null;
  }

  _vectorstoreType() {
    return "chroma-direct";
  }

  async ensureCollection() {
    if (!this.collection) {
      this.collection = await chromaClient.getOrCreateCollection({
        name: this.collectionName,
        // We always supply our own OpenAI-generated vectors on add/query,
        // so Chroma never needs to embed anything itself. Passing a stub
        // embeddingFunction here stops the client from trying to load its
        // own DefaultEmbeddingFunction (which requires the separate
        // @chroma-core/default-embed package and throws if missing).
        embeddingFunction: {
          generate: async (texts) => this.embeddings.embedDocuments(texts),
        },
      });
    }
    return this.collection;
  }

  async addDocuments(documents, options) {
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    return this.addVectors(vectors, documents, options);
  }

  async addVectors(vectors, documents) {
    if (vectors.length === 0) return [];

    const collection = await this.ensureCollection();

    const ids = documents.map(
      (_, i) =>
        `${this.collectionName}_${Date.now()}_${i}_${Math.random()
          .toString(36)
          .slice(2, 10)}`
    );

    await collection.add({
      ids,
      embeddings: vectors,
      documents: documents.map((doc) => doc.pageContent),
      // Chroma metadata values must be string/number/boolean — strip
      // undefined/null/object values that could cause a rejected request.
      metadatas: documents.map((doc) => sanitizeMetadata(doc.metadata)),
    });

    return ids;
  }

  async similaritySearchVectorWithScore(query, k, filter) {
    const collection = await this.ensureCollection();

    const results = await collection.query({
      queryEmbeddings: [query],
      nResults: k,
      where: filter && Object.keys(filter).length ? filter : undefined,
    });

    const documentsArr = results.documents?.[0] || [];
    const metadatasArr = results.metadatas?.[0] || [];
    const distancesArr = results.distances?.[0] || [];

    return documentsArr.map((text, i) => [
      new Document({
        pageContent: text,
        metadata: metadatasArr[i] || {},
      }),
      distancesArr[i] ?? 0,
    ]);
  }

  static async fromDocuments(docs, embeddings, dbConfig) {
    const store = new DirectChromaVectorStore(embeddings, dbConfig);
    await store.addDocuments(docs);
    return store;
  }
}

/**
 * Chroma metadata values must be string, number, or boolean.
 * Drops null/undefined/object/array fields and coerces the rest.
 */
function sanitizeMetadata(metadata = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue; // skip nested objects/arrays
    clean[key] = value;
  }
  return clean;
}

export const getEmbeddingsModel = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  });
};

export const getVectorStore = async (collectionName = "pdf_chat_default") => {
  const embeddings = getEmbeddingsModel();
  const store = new DirectChromaVectorStore(embeddings, { collectionName });
  await store.ensureCollection();
  return store;
};

export const createVectorStoreFromDocuments = async (
  chunks,
  collectionName = "pdf_chat_default"
) => {
  const embeddings = getEmbeddingsModel();
  return await DirectChromaVectorStore.fromDocuments(chunks, embeddings, {
    collectionName,
  });
};