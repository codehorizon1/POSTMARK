
import express from "express";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";

const router = express.Router();
const API_URL = `${import.meta.env.VITE_API_URL}/api/campaigns`;

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const updateCampaignStatus = (campaign) => {
  const sent = campaign.recipients.filter(
    (recipient) => recipient.status === "sent"
  ).length;

  const failed = campaign.recipients.filter(
    (recipient) => recipient.status === "failed"
  ).length;

  const pending = campaign.recipients.filter(
    (recipient) => recipient.status === "pending"
  ).length;

  campaign.sentCount = sent;
  campaign.failedCount = failed;

  if (pending > 0) {
    campaign.status = "draft";
  } else if (failed === 0) {
    campaign.status = "sent";
  } else if (sent === 0) {
    campaign.status = "failed";
  } else {
    campaign.status = "partial";
  }
};

// Get campaign history
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a new campaign
router.post("/send", async (req, res) => {
  let transporter;

  try {
    const { name, subject, message, recipients } = req.body;

    if (!name?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Campaign name, subject and message are required",
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        message: "Add at least one recipient",
      });
    }

    const uniqueEmails = [
      ...new Set(
        recipients
          .map((item) =>
            typeof item === "string" ? item : item.email
          )
          .filter(Boolean)
          .map((email) => email.trim().toLowerCase())
      ),
    ];

    const validEmails = uniqueEmails.filter((email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (validEmails.length === 0) {
      return res.status(400).json({
        message: "No valid recipient email addresses found",
      });
    }

    const suppressed = await Contact.find({
      email: { $in: validEmails },
      status: "suppressed",
    }).select("email");

    const suppressedEmails = new Set(
      suppressed.map((contact) => contact.email.toLowerCase())
    );

    const allowedEmails = validEmails.filter(
      (email) => !suppressedEmails.has(email)
    );

    if (allowedEmails.length === 0) {
      return res.status(400).json({
        message: "All recipients are suppressed",
      });
    }

    const campaign = await Campaign.create({
      name,
      subject,
      message,
      recipients: allowedEmails.map((email) => ({
        email,
        status: "pending",
      })),
      status: "draft",
    });

    transporter = createTransporter();
    await transporter.verify();

    for (const recipient of campaign.recipients) {
      try {
        await transporter.sendMail({
          from: `"POSTMARK" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject,
          text: message,
        });

        recipient.status = "sent";
        recipient.error = "";
      } catch (error) {
        recipient.status = "failed";
        recipient.error = error.message;
      }
    }

    updateCampaignStatus(campaign);
    await campaign.save();

    return res.status(200).json({
      message: "Campaign processing completed",
      campaign,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  } finally {
    if (transporter) transporter.close();
  }
});

// Retry ONLY failed recipients from an existing campaign
router.post("/:id/retry", async (req, res) => {
  let transporter;

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid campaign ID",
      });
    }

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    const failedRecipients = campaign.recipients.filter(
      (recipient) => recipient.status === "failed"
    );

    if (failedRecipients.length === 0) {
      return res.status(400).json({
        message: "There are no failed recipients to retry",
      });
    }

    const failedEmails = failedRecipients.map(
      (recipient) => recipient.email.toLowerCase()
    );

    // Check suppression again before retrying
    const suppressed = await Contact.find({
      email: { $in: failedEmails },
      status: "suppressed",
    }).select("email");

    const suppressedEmails = new Set(
      suppressed.map((contact) => contact.email.toLowerCase())
    );

    const retryableRecipients = failedRecipients.filter(
      (recipient) =>
        !suppressedEmails.has(recipient.email.toLowerCase())
    );

    // Keep suppressed recipients failed
    for (const recipient of failedRecipients) {
      if (suppressedEmails.has(recipient.email.toLowerCase())) {
        recipient.error = "Recipient is suppressed and cannot be retried";
      }
    }

    if (retryableRecipients.length === 0) {
      updateCampaignStatus(campaign);
      await campaign.save();

      return res.status(400).json({
        message: "All failed recipients are suppressed",
        campaign,
      });
    }

    transporter = createTransporter();
    await transporter.verify();

    let retried = 0;

    for (const recipient of retryableRecipients) {
      try {
        await transporter.sendMail({
          from: `"POSTMARK" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject: campaign.subject,
          text: campaign.message,
        });

        recipient.status = "sent";
        recipient.error = "";
        retried += 1;
      } catch (error) {
        recipient.status = "failed";
        recipient.error = error.message;
      }
    }

    updateCampaignStatus(campaign);
    await campaign.save();

    return res.status(200).json({
      message: "Failed recipient retry completed",
      retried,
      remainingFailed: campaign.failedCount,
      campaign,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  } finally {
    if (transporter) transporter.close();
  }
});

export default router;
