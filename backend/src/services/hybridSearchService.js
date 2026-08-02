import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { BaseRetriever } from "@langchain/core/retrievers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, "../../storage");

// Ensure the storage directory exists for lexical chunk files
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Save document chunks to disk to construct the lexical BM25 index on-demand.
 * 
 * @param {string} docId - Unique document identifier
 * @param {Array} chunks - Document chunks (LangChain Document objects)
 */
export const indexForBM25 = async (docId, chunks) => {
  try {
    const filePath = path.join(STORAGE_DIR, `bm25_${docId}.json`);
    const data = chunks.map((c) => ({
      pageContent: c.pageContent,
      metadata: c.metadata,
    }));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[BM25 Indexer] Successfully indexed ${chunks.length} chunks for ${docId}`);
  } catch (error) {
    console.error(`[BM25 Indexer Error] Failed to index chunks for ${docId}:`, error);
  }
};

/**
 * Perform lexical keyword search using BM25.
 * 
 * @param {string} docId - Unique document identifier
 * @param {string} query - The search query
 * @param {number} k - Number of documents to retrieve
 * @returns {Promise<Array>} Retrieved documents
 */
export const retrieveBM25 = async (docId, query, k = 4) => {
  try {
    const filePath = path.join(STORAGE_DIR, `bm25_${docId}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[BM25 Retriever] Index file not found for ${docId}`);
      return [];
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const docs = data.map((item) => new Document({
      pageContent: item.pageContent,
      metadata: item.metadata,
    }));
    
    // Instantiate BM25Retriever from documents dynamically
    const bm25Retriever = await BM25Retriever.fromDocuments(docs, { k });
    return await bm25Retriever.invoke(query);
  } catch (error) {
    console.error(`[BM25 Retriever Error] Failed to retrieve for ${docId}:`, error);
    return [];
  }
};

/**
 * Helper function to deduplicate retrieved documents based on page content and metadata.
 * 
 * @param {Array} docs - Array of documents
 * @returns {Array} Unique documents
 */
export const deduplicateDocs = (docs) => {
  const seen = new Set();
  return docs.filter((doc) => {
    const key = `${doc.pageContent}_page_${doc.metadata?.page || 0}_chunk_${doc.metadata?.chunkIndex || 0}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Unified Retrieval Layer (Hybrid Search).
 * Executes Vector search and BM25 search independently in parallel, merges and deduplicates results.
 * 
 * DESIGN NOTE: Future re-ranking models (like Cohere Rerank or Cross-Encoder) can be plugged directly
 * into this function without modifying the rest of the RAG pipeline.
 * 
 * @param {string} docId - Unique document identifier
 * @param {string} query - The search query
 * @param {Object} options - Options containing k and the vectorStore instance
 * @returns {Promise<Array>} Deduplicated consolidated documents
 */
export const retrieveHybrid = async (docId, query, { k = 4, vectorStore } = {}) => {
  console.log(`[Hybrid Search] Executing search for query: "${query}" (k = ${k})`);
  
  // 1. Run Semantic (Vector) Search on ChromaDB
  let vectorDocs = [];
  try {
    const retriever = vectorStore.asRetriever({ k });
    vectorDocs = await retriever.invoke(query);
    console.log(`[Hybrid Search] Semantic vector search retrieved ${vectorDocs.length} documents.`);
  } catch (error) {
    console.error("[Hybrid Search Error] Vector search failed:", error);
  }

  // 2. Run Lexical (BM25) Search
  let bm25Docs = [];
  try {
    bm25Docs = await retrieveBM25(docId, query, k);
    console.log(`[Hybrid Search] BM25 keyword search retrieved ${bm25Docs.length} documents.`);
  } catch (error) {
    console.error("[Hybrid Search Error] BM25 search failed:", error);
  }

  // 3. Merge results from both retrieval engines
  const combinedDocs = [...vectorDocs, ...bm25Docs];

  // 4. Deduplicate the combined retrieved documents (Requirement 8)
  const uniqueDocs = deduplicateDocs(combinedDocs);
  console.log(`[Hybrid Search] Unified and deduplicated to ${uniqueDocs.length} unique documents.`);

  // 5. Future Re-ranking Plug-in Point (Requirement 15)
  // Re-ranking models (such as Cross-Encoders or Reciprocal Rank Fusion) can be added here:
  // const reRankedDocs = await reRank(uniqueDocs, query, k);
  // return reRankedDocs;
  
  return uniqueDocs;
};

/**
 * Custom LangChain Retriever wrapper for Hybrid Search.
 * Extends BaseRetriever so that it can be passed as a drop-in replacement
 * into any LangChain chain, including MultiQueryRetriever.
 */
export class HybridRetriever extends BaseRetriever {
  static lc_name() {
    return "HybridRetriever";
  }

  constructor(fields) {
    super(fields);
    this.docId = fields.docId;
    this.vectorStore = fields.vectorStore;
    this.k = fields.k || 4;
  }

  async _getRelevantDocuments(query, runManager) {
    return await retrieveHybrid(this.docId, query, { k: this.k, vectorStore: this.vectorStore });
  }
}
