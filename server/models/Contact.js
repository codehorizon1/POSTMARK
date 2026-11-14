import mongoose from "mongoose";

const API_URL = `${import.meta.env.VITE_API_URL}/api/contacts`;
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Contact",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "suppressed"],
      default: "active",
    },
  },
  { timestamps: true }
);

contactSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Contact", contactSchema);