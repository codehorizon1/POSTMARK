import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// GET: Fetch all contacts
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add a new contact
router.post("/", async (req, res) => {
  try {
    const { name, email, company } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Contact.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        message: "Contact already exists",
      });
    }

    const contact = await Contact.create({
      name,
      email: normalizedEmail,
      company,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH: Suppress or reactivate a contact
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suppressed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid contact status",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Delete a contact
router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.status(200).json({
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;