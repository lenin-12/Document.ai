import { AutoModelForSequenceClassification, AutoTokenizer } from '@huggingface/transformers';

let model = null;
let tokenizer = null;

async function initModel() {
  if (!model || !tokenizer) {
    const modelName = process.env.RERANK_MODEL_NAME || 'onnx-community/bge-reranker-base-ONNX';
    const modelFileName = process.env.RERANK_MODEL_FILE_NAME !== undefined ? process.env.RERANK_MODEL_FILE_NAME : 'model_q4';
    
    const options = {
      quantized: true,
    };
    
    if (modelFileName && modelFileName.trim() !== '') {
      options.model_file_name = modelFileName;
    }
    
    console.log(`[Reranker] Initializing Cross-Encoder: model=${modelName}, file=${modelFileName || 'default'}`);
    tokenizer = await AutoTokenizer.from_pretrained(modelName);
    model = await AutoModelForSequenceClassification.from_pretrained(modelName, options);
    console.log(`[Reranker] Cross-Encoder model and tokenizer initialized successfully.`);
  }
  return { model, tokenizer };
}


export async function rerankDocuments(query, documents) {
  if (!documents || documents.length === 0) {
    console.log(`Retrieved 0 chunks`);
    console.log(`Re-ranked to top 0 chunks`);
    return [];
  }
  
  const totalRetrieved = documents.length;
  const finalK = parseInt(process.env.FINAL_CONTEXT_K, 10) || 5;

  try {
    const { model, tokenizer } = await initModel();
    
   
    const queries = Array(documents.length).fill(query);
    const docTexts = documents.map((doc) => doc.pageContent);
    
    
    const inputs = await tokenizer(queries, { 
      text_pair: docTexts, 
      padding: true, 
      truncation: true 
    });
    
    
    const outputs = await model(inputs);
    
   
    const logitsData = outputs.logits.data; 
    
    const docWithScores = documents.map((doc, idx) => {
      const logit = logitsData[idx];

      const score = 1 / (1 + Math.exp(-logit));
      return { doc, score };
    });
    
    
    docWithScores.sort((a, b) => b.score - a.score);
   
    docWithScores.forEach((item, index) => {
      console.log(`[Reranker Debug] Ranked chunk ${index + 1}: Score = ${item.score.toFixed(4)}`);
    });

    
    const rerankedDocs = docWithScores.slice(0, finalK).map((item) => item.doc);
    
    
    console.log(`Retrieved ${totalRetrieved} chunks`);
    console.log(`Re-ranked to top ${rerankedDocs.length} chunks`);
    
    return rerankedDocs;
  } catch (error) {
    console.error(`[Reranker Error] Reranking failed, falling back to original retriever documents. Error:`, error);
    
    console.log(`Retrieved ${totalRetrieved} chunks`);
    console.log(`Re-ranked to top ${totalRetrieved} chunks`);
    return documents;
  }
}
