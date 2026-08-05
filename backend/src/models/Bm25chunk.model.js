import mongoose from "mongoose";


const Bm25ChunkSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true, index: true },
    pageContent: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Bm25Chunk =
  mongoose.models.Bm25Chunk || mongoose.model("Bm25Chunk", Bm25ChunkSchema);