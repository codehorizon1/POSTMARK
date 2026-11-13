
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock3,
  FileText,
  AlertTriangle,
} from "lucide-react";
import "./CampaignDetails.css";

const API_URL = "http://localhost:5001/api/campaigns";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }) {
  return (
    <span className={`campaign-status ${status || "pending"}`}>
      {status || "pending"}
    </span>
  );
}

export default function CampaignDetails({ campaign, onBack, onUpdated }) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  if (!campaign) return null;

  const recipients = campaign.recipients || [];
  const failedCount = recipients.filter(
    (recipient) => recipient.status === "failed"
  ).length;

  const handleRetry = async () => {
    if (!failedCount || retrying) return;

    const confirmed = window.confirm(
      `Retry sending this campaign to ${failedCount} failed recipient(s) only?`
    );

    if (!confirmed) return;

    try {
      setRetrying(true);
      setRetryError("");

      const response = await fetch(
        `${API_URL}/${campaign._id}/retry`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Retry failed.");
      }

      if (data.campaign) {
        onUpdated(data.campaign);
      }

      alert(
        `Retry completed. Successfully retried: ${data.retried}. Remaining failed: ${data.remainingFailed}.`
      );
    } catch (error) {
      setRetryError(error.message);
    } finally {
      setRetrying(false);
    }
  };

  const sentCount = recipients.filter(
    (recipient) => recipient.status === "sent"
  ).length;

  return (
    <section className="campaign-details-page">
      <button className="details-back-button" onClick={onBack}>
        <ArrowLeft size={17} /> Back to campaigns
      </button>

      <div className="details-heading">
        <div>
          <span className="eyebrow">POSTMARK / CAMPAIGN REPORT</span>
          <h1>{campaign.name}</h1>
          <p>Campaign delivery and recipient report.</p>
        </div>

        <StatusBadge status={campaign.status} />
      </div>

      <div className="details-stats">
        <div>
          <Mail size={19} />
          <span>TOTAL RECIPIENTS</span>
          <strong>{recipients.length}</strong>
        </div>

        <div>
          <CheckCircle2 size={19} />
          <span>SUCCESSFULLY SENT</span>
          <strong>{sentCount}</strong>
        </div>

        <div>
          <XCircle size={19} />
          <span>FAILED</span>
          <strong>{failedCount}</strong>
        </div>
      </div>

      <section className="details-section">
        <div className="details-section-title">
          <FileText size={18} />
          <h2>Campaign information</h2>
        </div>

        <div className="details-info-row">
          <span>Campaign name</span>
          <strong>{campaign.name}</strong>
        </div>

        <div className="details-info-row">
          <span>Email subject</span>
          <strong>{campaign.subject}</strong>
        </div>

        <div className="details-info-row">
          <span>Created date</span>
          <strong>{formatDate(campaign.createdAt)}</strong>
        </div>

        <div className="details-message">
          <span>MESSAGE CONTENT</span>
          <p>{campaign.message}</p>
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-title">
          <Users size={18} />
          <h2>Recipient delivery records</h2>
        </div>

        {failedCount > 0 && (
          <div className="retry-banner">
            <div>
              <AlertTriangle size={19} />
              <div>
                <strong>{failedCount} email(s) failed</strong>
                <p>Only failed recipients will be retried.</p>
              </div>
            </div>

            <button
              className="retry-button"
              onClick={handleRetry}
              disabled={retrying}
            >
              <RefreshCw
                size={16}
                className={retrying ? "retry-spin" : ""}
              />
              {retrying ? "Retrying..." : "Retry failed emails"}
            </button>
          </div>
        )}

        {retryError && (
          <div className="retry-error">
            {retryError}
          </div>
        )}

        {recipients.length === 0 ? (
          <p>No recipient records found.</p>
        ) : (
          <div className="details-recipient-list">
            {recipients.map((recipient, index) => (
              <div
                className="details-recipient-row"
                key={`${recipient.email}-${index}`}
              >
                <div className="details-recipient-icon">
                  <Mail size={17} />
                </div>

                <div className="details-recipient-info">
                  <strong>{recipient.email}</strong>
                  <small>
                    {recipient.error ||
                      (recipient.status === "sent"
                        ? "Accepted by the email server"
                        : "Delivery attempt recorded")}
                  </small>
                </div>

                <StatusBadge status={recipient.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="details-disclaimer">
        <Clock3 size={16} />
        A sent status means the SMTP server accepted the message. It does
        not guarantee inbox delivery.
      </div>
    </section>
  );
}
