import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { BaseRetriever } from "@langchain/core/retrievers";
import { connectMongo } from "../config/mongo.js";
import { Bm25Chunk } from "../models/Bm25chunk.model.js";


export const indexForBM25 = async (docId, chunks) => {
  try {
    await connectMongo();

    // Clear any previous chunks for this docId first (handles re-uploads of the same doc cleanly)
    await Bm25Chunk.deleteMany({ docId });

    const docs = chunks.map((c) => ({
      docId,
      pageContent: c.pageContent,
      metadata: c.metadata,
    }));

    await Bm25Chunk.insertMany(docs);
    console.log(`[BM25 Indexer] Successfully indexed ${chunks.length} chunks for ${docId} in MongoDB`);
  } catch (error) {
    console.error(`[BM25 Indexer Error] Failed to index chunks for ${docId}:`, error);
  }
};


export const appendBM25Chunk = async (docId, doc) => {
  try {
    await connectMongo();
    await Bm25Chunk.create({
      docId,
      pageContent: doc.pageContent,
      metadata: doc.metadata,
    });
    console.log(`[BM25 Indexer] Appended 1 chunk to MongoDB index for ${docId}`);
  } catch (error) {
    console.error(`[BM25 Indexer Error] Failed to append chunk for ${docId}:`, error);
  }
};

const tokenizeForBM25Debug = (query) => {
  if (!query) return [];
  return query.toLowerCase().match(/[a-z0-9]+/g) || [];
};

export const retrieveBM25 = async (docId, query, k = 4) => {
  try {
    await connectMongo();

    const data = await Bm25Chunk.find({ docId }).lean();
    if (!data || data.length === 0) {
      console.warn(`[BM25 Retriever] No indexed chunks found for ${docId}`);
      return [];
    }

    const docs = data.map(
      (item) =>
        new Document({
          pageContent: item.pageContent,
          metadata: item.metadata,
        })
    );

    
    const bm25Keywords = tokenizeForBM25Debug(query);
    console.log(`[BM25 Retriever] Query: "${query}"`);
    console.log(`[BM25 Retriever] Tokenized keywords used for matching:`, bm25Keywords);

    // Instantiate BM25Retriever from documents dynamically
    const bm25Retriever = await BM25Retriever.fromDocuments(docs, { k });
    const results = await bm25Retriever.invoke(query);

    console.log(
      `[BM25 Retriever] Matched ${results.length} chunk(s) for keywords [${bm25Keywords.join(", ")}]`
    );

    return results;
  } catch (error) {
    console.error(`[BM25 Retriever Error] Failed to retrieve for ${docId}:`, error);
    return [];
  }
};

const buildDocKey = (doc) => {
  return `${doc.pageContent}_page_${doc.metadata?.page || 0}_chunk_${doc.metadata?.chunkIndex || 0}`;
};

export const deduplicateDocs = (docs) => {
  const seen = new Set();
  return docs.filter((doc) => {
    const key = buildDocKey(doc);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};


export const reciprocalRankFusion = (resultLists, { k = 60, weights } = {}) => {
  const scored = new Map(); // key -> { doc, score, hits }

  resultLists.forEach((list, listIdx) => {
    const weight = weights?.[listIdx] ?? 1;
    list.forEach((doc, rank) => {
      const key = buildDocKey(doc);
      const contribution = weight * (1 / (k + rank + 1));

      if (scored.has(key)) {
        const entry = scored.get(key);
        entry.score += contribution;
        entry.hits += 1;
      } else {
        scored.set(key, { doc, score: contribution, hits: 1 });
      }
    });
  });

  const fused = Array.from(scored.values()).sort((a, b) => b.score - a.score);

  console.log(
    `[RRF Fusion] Fused ${resultLists.reduce((sum, l) => sum + l.length, 0)} raw results into ${fused.length} unique documents.`
  );
  fused.slice(0, 5).forEach((entry, i) => {
    const preview = entry.doc.pageContent.slice(0, 60).replace(/\n/g, " ");
    console.log(
      `[RRF Fusion] #${i + 1} score=${entry.score.toFixed(5)} hits=${entry.hits} page=${entry.doc.metadata?.page ?? "?"} "${preview}..."`
    );
  });

  return fused.map((entry) => entry.doc);
};


export const retrieveHybrid = async (docId, query, { k = 4, vectorStore, weights } = {}) => {
  console.log(`[Hybrid Search] Executing search for query: "${query}" (k = ${k})`);

  
  let vectorDocs = [];
  try {
    const retriever = vectorStore.asRetriever({ k });
    vectorDocs = await retriever.invoke(query);
    console.log(`[Hybrid Search] Semantic vector search retrieved ${vectorDocs.length} documents.`);
  } catch (error) {
    console.error("[Hybrid Search Error] Vector search failed:", error);
  }

 
  let bm25Docs = [];
  try {
    bm25Docs = await retrieveBM25(docId, query, k);
    console.log(`[Hybrid Search] BM25 keyword search retrieved ${bm25Docs.length} documents.`);
  } catch (error) {
    console.error("[Hybrid Search Error] BM25 search failed:", error);
  }

  
  const fusedDocs = reciprocalRankFusion([vectorDocs, bm25Docs], { weights });

  console.log(`[Hybrid Search] Returning top ${Math.min(fusedDocs.length, k * 2)} fused documents.`);

  return fusedDocs.slice(0, k * 2);
};


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