import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "pricing_sheet",
        "quotation_template",
        "measurement_guide",
        "product_catalogue",
        "other",
      ],
      default: "other",
    },
    sourceFilename: { type: String },
    rawText: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model("Document", documentSchema);
