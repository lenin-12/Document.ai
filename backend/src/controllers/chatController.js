import { answerQuestionStream } from "../services/ragService.js";

export const chatController = async (req, res, next) => {
  try {
    const { docId, question } = req.body;

    if (!docId) {
      return res.status(400).json({ success: false, error: "Missing required field 'docId'." });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: "Question cannot be empty." });
    }

    console.log(`💬 Processing streaming question for ${docId}: "${question}"`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (res.flushHeaders) res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    await answerQuestionStream(docId, question.trim(), {
      onMetadata: (metadata) => sendEvent("metadata", metadata),
      onToken: (token) => sendEvent("token", { chunk: token }),
      onEnd: () => {
        sendEvent("done", {});
        res.end();
      },
      onError: (err) => {
        sendEvent("error", { error: err.message || "Streaming error occurred." });
        res.end();
      },
    });
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

