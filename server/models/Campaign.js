
import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    recipients: [
      {
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },

        status: {
          type: String,
          enum: ["pending", "sent", "failed"],
          default: "pending",
        },

        error: {
          type: String,
          default: "",
        },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "sent", "partial", "failed"],
      default: "draft",
    },

    sentCount: {
      type: Number,
      default: 0,
    },

    failedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Campaign", campaignSchema);
