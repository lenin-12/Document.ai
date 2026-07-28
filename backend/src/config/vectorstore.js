import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

/**
 * Initializes OpenAI Embeddings model
 */
export const getEmbeddingsModel = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  });
};

/**
 * Connects to an existing ChromaDB vector store instance for a document collection
 * @param {string} collectionName - Unique identifier for the PDF document vector store
 */
export const getVectorStore = async (collectionName = "pdf_chat_default") => {
  const embeddings = getEmbeddingsModel();
  
  const chromaOptions = {
    collectionName: collectionName,
    url: process.env.CHROMA_URL || "http://localhost:8000",
  };

  return new Chroma(embeddings, chromaOptions);
};

/**
 * Creates and populates a new ChromaDB vector store collection from document chunks
 * @param {Array} chunks - Document chunks to embed and store
 * @param {string} collectionName - Unique identifier for the PDF document vector store
 */
export const createVectorStoreFromDocuments = async (chunks, collectionName = "pdf_chat_default") => {
  const embeddings = getEmbeddingsModel();
  
  const chromaOptions = {
    collectionName: collectionName,
    url: process.env.CHROMA_URL || "http://localhost:8000",
  };

  return await Chroma.fromDocuments(chunks, embeddings, chromaOptions);
};

