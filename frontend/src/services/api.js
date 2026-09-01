import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

export const uploadPdfApi = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onUploadProgress) onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const sendQuestionApi = async (docId, question) => {
  const response = await api.post("/chat", {
    docId,
    question,
  });

  return response.data;
};

export const sendQuestionStreamApi = async (docId, question, { onMetadata, onToken, onError }) => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ docId, question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const eventMatch = block.match(/^event:\s*(.+)$/m);
      const dataMatch = block.match(/^data:\s*(.+)$/m);

      const event = eventMatch ? eventMatch[1].trim() : "message";
      const dataStr = dataMatch ? dataMatch[1].trim() : "{}";

      try {
        const parsed = JSON.parse(dataStr);
        if (event === "metadata") {
          if (onMetadata) onMetadata(parsed);
        } else if (event === "token") {
          if (onToken) onToken(parsed.chunk);
        } else if (event === "error") {
          if (onError) onError(parsed.error);
        }
      } catch (err) {
        console.error("Error parsing stream chunk:", err);
      }
    }
  }
};

export const analyzeResumeApi = async (resumeFile, jdFile, jobDescriptionText) => {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  if (jdFile) {
    formData.append("jdFile", jdFile);
  }
  if (jobDescriptionText) {
    formData.append("jobDescription", jobDescriptionText);
  }

  const response = await api.post("/resume/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

