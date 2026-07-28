import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getVectorStore, createVectorStoreFromDocuments } from "../config/vectorstore.js";

const docChunksRegistry = new Map();
const docMetadataRegistry = new Map();

const isOpenAiKeyValid = () => {
  const key = process.env.OPENAI_API_KEY;
  return key && key.startsWith("sk-") && !key.includes("your_openai");
};

/**
 * Rag stage  3 & 4: Creating Embeddings and Storing in Chroma Vector DB and Generating Summary
 */
export const processDocumentAndStore = async (docId, chunks, pages, filename) => {
  let summary = "";

  if(isOpenAiKeyValid()){
    // Converting chunks into embeddings using openai's embedding model and Storing them in ChromaDB collection with name as docId
    await createVectorStoreFromDocuments(chunks, docId);
    // creating a gpt model to send api requests
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
    summary = `[Demo Summary - Add OPENAI_API_KEY in backend/.env for live OpenAI generation]: This document "${filename}" contains ${pages} pages and ${chunks.length} chunks. Key section snippet: ${firstChunkText.slice(0, 200)}...`;
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

/**
 * HYBRID AI RAG FLOW:
 * 1. Retrieve top vector chunks from ChromaDB.
 * 2. Attempt PDF-grounded answer.
 * 3. If PDF lacks relevant context, fallback to General AI Knowledge LLM response.
 */
export const answerQuestion = async (docId, question) => {
  const docMeta = docMetadataRegistry.get(docId);

  if (isOpenAiKeyValid()) {
    const vectorStore = await getVectorStore(docId);

    const retriever = vectorStore.asRetriever({ k: 4 });
    const retrievedDocs = await retriever.invoke(question);

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.1,
    });

    // 1. Try RAG Generation using PDF context
    if (retrievedDocs && retrievedDocs.length > 0) {
      const formattedContext = retrievedDocs
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

      // If PDF had the answer, return RAG response
      if (!ragResponse.includes("__NOT_FOUND_IN_PDF__")) {
        const sources = retrievedDocs.map((doc, idx) => ({
          id: idx + 1,
          page: doc.metadata.page || 1,
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

    // 2. Fallback: Generate General LLM response when PDF context is not relevant
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
    // Demo Mode Hybrid Logic
    const chunks = docChunksRegistry.get(docId) || [];
    const qLower = question.toLowerCase();
    const words = qLower.split(" ").filter((w) => w.length > 3);

    const matchedDocs = chunks.filter((c) =>
      words.some((w) => c.pageContent.toLowerCase().includes(w))
    );

    if (matchedDocs.length > 0) {
      const sources = matchedDocs.slice(0, 4).map((doc, idx) => ({
        id: idx + 1,
        page: doc.metadata.page || 1,
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
      const retriever = vectorStore.asRetriever({ k: 4 });
      const retrievedDocs = await retriever.invoke(question);

      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0.1,
        streaming: true,
      });

      if (retrievedDocs && retrievedDocs.length > 0) {
        const formattedContext = retrievedDocs
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

        // Buffer initial output to detect __NOT_FOUND_IN_PDF__
        for await (const chunk of stream) {
          buffer += chunk;
          if (buffer.includes("__NOT_FOUND_IN_PDF__")) {
            isFallback = true;
            break;
          }
          if (buffer.length >= 25 && !buffer.includes("__NOT_FOUND_IN_PDF__")) {
            break;
          }
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
          const sources = retrievedDocs.map((doc, idx) => ({
            id: idx + 1,
            page: doc.metadata.page || 1,
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

          // Continue streaming rest of stream
          for await (const chunk of stream) {
            onToken(chunk);
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

