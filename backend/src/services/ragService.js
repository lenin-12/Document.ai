import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getVectorStore, createVectorStoreFromDocuments } from "../config/vectorstore.js";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { indexForBM25, HybridRetriever } from "./hybridSearchService.js";

// Number of chunks retrieved per query for RAG context. No reranking step —
// this is the final count used directly.
const RETRIEVAL_K = parseInt(process.env.FINAL_CONTEXT_K, 10) || 5;

const docChunksRegistry = new Map();
const docMetadataRegistry = new Map();

const isOpenAiKeyValid = () => {
  const key = process.env.OPENAI_API_KEY;
  return key && key.startsWith("sk-") && !key.includes("your_openai");
};


const deduplicateDocuments = (docs) => {
  if (!docs || docs.length === 0) return [];
  const seen = new Set();
  return docs.filter((doc) => {
   
    const contentKey = `${doc.pageContent}_page_${doc.metadata?.page || 0}_chunk_${doc.metadata?.chunkIndex || 0}`;
    if (seen.has(contentKey)) {
      return false;
    }
    seen.add(contentKey);
    return true;
  });
};


export const processDocumentAndStore = async (docId, chunks, pages, filename) => {
  let summary = "";

  if(isOpenAiKeyValid()){
    
    await createVectorStoreFromDocuments(chunks, docId);

   
    await indexForBM25(docId, chunks);
   
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.3,
    });

    const sampleText = chunks.slice(0, 5).map((c) => c.pageContent).join("\n\n");
    const summaryPrompt = PromptTemplate.fromTemplate(
      `You are an expert AI document analyst. Generate a clear, concise 2-3 sentence executive summary of the following PDF document content.
Do NOT use meta-language like "This document is about". State the key subject, main themes, and core conclusions directly.

Document Content Snippet:
{content}

Executive Summary:`
    );

    const summaryChain = summaryPrompt.pipe(llm).pipe(new StringOutputParser());
    summary = await summaryChain.invoke({ content: sampleText });
  } else {
    docChunksRegistry.set(docId, chunks);
    const firstChunkText = chunks[0]?.pageContent || "PDF Document is Empty";
    summary = `[Demo Summary - Add OPENAI_API_KEY in backend/.env for live OpenAI generation]: 
    This document "${filename}" contains ${pages} pages and ${chunks.length} chunks. Key section snippet:
     ${firstChunkText.slice(0, 200)}...`;
  }

  const metadata = {
    docId,
    filename,
    pages,
    totalChunks: chunks.length,
    summary,
    uploadedAt: new Date().toISOString(),
  };

  docMetadataRegistry.set(docId, metadata);
  return metadata;
};

export const answerQuestion = async (docId, question) => {
  const docMeta = docMetadataRegistry.get(docId);

  if (isOpenAiKeyValid()) {
    const vectorStore = await getVectorStore(docId);

    
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.1,
    });

    const hybridRetriever = new HybridRetriever({
      docId: docId,
      vectorStore: vectorStore,
      k: RETRIEVAL_K,
    });

   
    const multiQueryRetriever = MultiQueryRetriever.fromLLM({
      retriever: hybridRetriever,
      llm: llm,
    });

    
    const originalGenerateQueries = multiQueryRetriever._generateQueries.bind(multiQueryRetriever);
    multiQueryRetriever._generateQueries = async (queryText, runManager) => {
      const queries = await originalGenerateQueries(queryText, runManager);
      console.log(`\n🔍 Multi-Query Generation for: "${queryText}"`);
      queries.forEach((q, i) => console.log(`   ${i + 1}. "${q}"`));
      console.log("");
      return queries;
    };

    
    const rawDocs = await multiQueryRetriever.invoke(question);

   
    const retrievedDocs = deduplicateDocuments(rawDocs);

    
    let finalDocs = retrievedDocs;
    
    if (finalDocs && finalDocs.length > 0) {
      finalDocs.forEach((doc) => {
        console.log(`Retrieved chunk\nPage ${doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : "null"}`);
      });
    }

    
    if (finalDocs && finalDocs.length > 0) {
      const formattedContext = finalDocs
        .map((doc, idx) => `[Source ${idx + 1} - Page ${doc.metadata.page}]:\n${doc.pageContent}`)
        .join("\n\n---\n\n");

      const ragPrompt = PromptTemplate.fromTemplate(
        `You are an expert AI document assistant. Determine if the provided document context contains enough relevant information to answer the user's question.

Rules:
1. If the context contains relevant information to answer the question, provide a clear, accurate, structured answer using Markdown.
2. If the context does NOT contain information to answer the user's question, respond ONLY with the exact string "__NOT_FOUND_IN_PDF__". Do NOT add any extra text or explanation if not found.

Context from Document:
{context}

User Question: {question}

Answer:`
      );

      const ragChain = ragPrompt.pipe(llm).pipe(new StringOutputParser());
      const ragResponse = await ragChain.invoke({
        context: formattedContext,
        question: question,
      });

      
      if (!ragResponse.includes("__NOT_FOUND_IN_PDF__")) {
        const sources = finalDocs.map((doc, idx) => ({
          id: idx + 1,
          page: doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : null,
          chunkIndex: doc.metadata.chunkIndex || idx + 1,
          text: doc.pageContent,
        }));

        return {
          answer: ragResponse.trim(),
          answerType: "rag",
          sources,
          documentInfo: {
            filename: docMeta?.filename || "Uploaded PDF",
            pages: docMeta?.pages || 1,
          },
        };
      }
    }

    
    const generalPrompt = PromptTemplate.fromTemplate(
      `You are a helpful, knowledgeable AI assistant. Answer the user's question clearly, accurately, and thoroughly using Markdown formatting.

User Question: {question}

Answer:`
    );

    const generalChain = generalPrompt.pipe(llm).pipe(new StringOutputParser());
    const generalAnswer = await generalChain.invoke({ question });

    return {
      answer: generalAnswer.trim(),
      answerType: "general",
      sources: [],
      documentInfo: {
        filename: docMeta?.filename || "Uploaded PDF",
        pages: docMeta?.pages || 1,
      },
    };
  } else {
    
    const chunks = docChunksRegistry.get(docId) || [];
    const qLower = question.toLowerCase();
    const words = qLower.split(" ").filter((w) => w.length > 3);

    const matchedDocs = chunks.filter((c) =>
      words.some((w) => c.pageContent.toLowerCase().includes(w))
    );

    if (matchedDocs.length > 0) {
      matchedDocs.slice(0, 4).forEach((doc) => {
        console.log(`Retrieved chunk\nPage ${doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : "null"}`);
      });

      const sources = matchedDocs.slice(0, 4).map((doc, idx) => ({
        id: idx + 1,
        page: doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : null,
        chunkIndex: doc.metadata.chunkIndex || idx + 1,
        text: doc.pageContent,
      }));

      const answer = `Based on matching text snippets in **${docMeta?.filename || "uploaded PDF"}**:

- **Relevant Context Found**: We retrieved ${sources.length} matching text chunk(s) from Page(s) ${sources.map(s => s.page).join(", ")}.
- **Snippet Excerpt**: "${matchedDocs[0]?.pageContent.slice(0, 250)}..."`;

      return {
        answer,
        answerType: "rag",
        sources,
        documentInfo: {
          filename: docMeta?.filename || "Uploaded PDF",
          pages: docMeta?.pages || 1,
        },
      };
    } else {
      const generalAnswer = `This question was not found in the uploaded PDF document **${docMeta?.filename || "PDF"}**. 

Here is general AI knowledge answering your question:

**"${question}"** is a general topic. *(To enable live GPT-4o General Knowledge responses, add a valid \`OPENAI_API_KEY\` in \`backend/.env\`)*.`;

      return {
        answer: generalAnswer,
        answerType: "general",
        sources: [],
        documentInfo: {
          filename: docMeta?.filename || "Uploaded PDF",
          pages: docMeta?.pages || 1,
        },
      };
    }
  }
};

export const answerQuestionStream = async (docId, question, { onMetadata, onToken, onEnd, onError }) => {
  try {
    const docMeta = docMetadataRegistry.get(docId);

    if (isOpenAiKeyValid()) {
      const vectorStore = await getVectorStore(docId);

      const llmForMultiQuery = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0.1,
      });

      const hybridRetriever = new HybridRetriever({
        docId: docId,
        vectorStore: vectorStore,
        k: RETRIEVAL_K,
      });

      
      const multiQueryRetriever = MultiQueryRetriever.fromLLM({
        retriever: hybridRetriever,
        llm: llmForMultiQuery,
      });

      
      const originalGenerateQueries = multiQueryRetriever._generateQueries.bind(multiQueryRetriever);
      multiQueryRetriever._generateQueries = async (queryText, runManager) => {
        const queries = await originalGenerateQueries(queryText, runManager);
        console.log(`\n🔍 Multi-Query Generation for: "${queryText}"`);
        queries.forEach((q, i) => console.log(`   ${i + 1}. "${q}"`));
        console.log("");
        return queries;
      };

      
      const rawDocs = await multiQueryRetriever.invoke(question);

      
      const retrievedDocs = deduplicateDocuments(rawDocs);

     
      let finalDocs = retrievedDocs;
      
      if (finalDocs && finalDocs.length > 0) {
        finalDocs.forEach((doc) => {
          console.log(`Retrieved chunk\nPage ${doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : "null"}`);
        });
      }

      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0.1,
        streaming: true,
      });

      if (finalDocs && finalDocs.length > 0) {
        const formattedContext = finalDocs
          .map((doc, idx) => `[Source ${idx + 1} - Page ${doc.metadata.page}]:\n${doc.pageContent}`)
          .join("\n\n---\n\n");

        const ragPrompt = PromptTemplate.fromTemplate(
          `You are an expert AI document assistant. Determine if the provided document context contains enough relevant information to answer the user's question.

Rules:
1. If the context contains relevant information to answer the question, provide a clear, accurate, structured answer using Markdown.
2. If the context does NOT contain information to answer the user's question, respond ONLY with the exact string "__NOT_FOUND_IN_PDF__". Do NOT add any extra text or explanation if not found.

Context from Document:
{context}

User Question: {question}

Answer:`
        );

        const ragChain = ragPrompt.pipe(llm).pipe(new StringOutputParser());
        const stream = await ragChain.stream({
          context: formattedContext,
          question,
        });

        let buffer = "";
        let isFallback = false;

        // Buffer initial output to detect __NOT_FOUND_IN_PDF__.
        // IMPORTANT: use the iterator's .next() directly rather than
        // "for await...of" — breaking out of a for-await loop early calls
        // the iterator's .return(), which closes the underlying stream
        // reader. That made the stream unusable for the second read below
        // ("Invalid state: The reader is not attached to a stream").
        // Manual .next() calls don't trigger that auto-close, so the same
        // stream can be safely resumed afterward.
        const iterator = stream[Symbol.asyncIterator]();
        let next = await iterator.next();
        while (!next.done) {
          buffer += next.value;
          if (buffer.includes("__NOT_FOUND_IN_PDF__")) {
            isFallback = true;
            break;
          }
          if (buffer.length >= 25) {
            break;
          }
          next = await iterator.next();
        }

        if (isFallback) {
          const generalPrompt = PromptTemplate.fromTemplate(
            `You are a helpful, knowledgeable AI assistant. Answer the user's question clearly, accurately, and thoroughly using Markdown formatting.

User Question: {question}

Answer:`
          );
          const generalChain = generalPrompt.pipe(llm).pipe(new StringOutputParser());
          onMetadata({
            answerType: "general",
            sources: [],
            documentInfo: {
              filename: docMeta?.filename || "Uploaded PDF",
              pages: docMeta?.pages || 1,
            },
          });

          const genStream = await generalChain.stream({ question });
          for await (const chunk of genStream) {
            onToken(chunk);
          }
          onEnd();
          return;
        } else {
          const sources = finalDocs.map((doc, idx) => ({
            id: idx + 1,
            page: doc.metadata.page !== undefined && doc.metadata.page !== null ? doc.metadata.page : null,
            chunkIndex: doc.metadata.chunkIndex || idx + 1,
            text: doc.pageContent,
          }));

          onMetadata({
            answerType: "rag",
            sources,
            documentInfo: {
              filename: docMeta?.filename || "Uploaded PDF",
              pages: docMeta?.pages || 1,
            },
          });

          // Emit buffered portion
          if (buffer) {
            onToken(buffer);
          }

          // Continue draining the SAME iterator (not a new for-await loop)
          // so we resume exactly where the buffering step left off.
          next = await iterator.next();
          while (!next.done) {
            onToken(next.value);
            next = await iterator.next();
          }
          onEnd();
          return;
        }
      }

      // No docs returned from retriever -> fallback to general
      const generalPrompt = PromptTemplate.fromTemplate(
        `You are a helpful, knowledgeable AI assistant. Answer the user's question clearly, accurately, and thoroughly using Markdown formatting.

User Question: {question}

Answer:`
      );
      const generalChain = generalPrompt.pipe(llm).pipe(new StringOutputParser());
      onMetadata({
        answerType: "general",
        sources: [],
        documentInfo: {
          filename: docMeta?.filename || "Uploaded PDF",
          pages: docMeta?.pages || 1,
        },
      });

      const genStream = await generalChain.stream({ question });
      for await (const chunk of genStream) {
        onToken(chunk);
      }
      onEnd();
    } else {
      // Demo Mode Hybrid Streaming Simulation
      const result = await answerQuestion(docId, question);
      onMetadata({
        answerType: result.answerType,
        sources: result.sources,
        documentInfo: result.documentInfo,
      });

      const fullText = result.answer;
      const chunkSize = 8;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        onToken(fullText.slice(i, i + chunkSize));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      onEnd();
    }
  } catch (err) {
    onError(err);
  }
};

export const getDocumentMetadata = (docId) => {
  return docMetadataRegistry.get(docId) || null;
};