import "./CampaignComposer.css";
import { useMemo, useRef, useState } from "react";
import {
  X, Plus, Upload, Users, Mail, Eye, Save, ArrowRight,
  CheckCircle2, AlertCircle, Trash2, Sparkles, FileText,
  ChevronDown, Send, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const API_URL = `${import.meta.env.VITE_API_URL}/api/campaigns`;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CampaignComposer({ onClose, onSaveDraft }) {
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [activeTab, setActiveTab] = useState("compose");
  const [showVariables, setShowVariables] = useState(false);
  const [csvName, setCsvName] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const fileInputRef = useRef(null);

  const validRecipients = recipients.filter(item => item.valid);
  const invalidCount = recipients.length - validRecipients.length;
  const validCount = validRecipients.length;

  const previewBody = useMemo(() => {
    return body
      .replaceAll("{{firstName}}", "Alex")
      .replaceAll("{{company}}", "Acme Studio");
  }, [body]);

  const addRecipients = (rawValue) => {
    const entries = rawValue
      .split(/[,;\n\s]+/)
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);

    if (!entries.length) return;

    let added = 0;
    let duplicates = 0;

    setRecipients(current => {
      const existing = new Set(current.map(item => item.email));
      const next = [...current];

      entries.forEach(email => {
        if (existing.has(email)) {
          duplicates++;
          return;
        }

        existing.add(email);
        next.push({
          id: `${Date.now()}-${Math.random()}`,
          email,
          valid: EMAIL_REGEX.test(email)
        });
        added++;
      });

      return next;
    });

    setRecipientInput("");

    if (added) toast.success(`${added} recipient(s) added`);
    if (duplicates) toast.info(`${duplicates} duplicate address(es) skipped`);
  };

  const handleRecipientKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addRecipients(recipientInput);
    }
  };

  const removeRecipient = (id) => {
    setRecipients(current => current.filter(item => item.id !== id));
  };

  const importCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(Boolean);
      const headers = rows[0].split(",").map(value =>
        value.trim().replace(/^"|"$/g, "").toLowerCase()
      );

      const emailIndex = headers.findIndex(header =>
        ["email", "email address", "e-mail"].includes(header)
      );

      if (emailIndex === -1) {
        toast.error("Your CSV needs an Email column");
        event.target.value = "";
        return;
      }

      const imported = rows.slice(1).map(row => {
        const columns = row.split(",");
        return (columns[emailIndex] || "")
          .trim()
          .replace(/^"|"$/g, "");
      }).filter(Boolean);

      addRecipients(imported.join("\n"));
      setCsvName(file.name);
    } catch {
      toast.error("Unable to read this CSV file");
    }

    event.target.value = "";
  };

  const insertVariable = (variable) => {
    setBody(current =>
      `${current}${current.endsWith(" ") || !current ? "" : " "}${variable}`
    );
    setShowVariables(false);
  };

  const validateCampaign = () => {
    if (!campaignName.trim()) return "Add a campaign name";
    if (!subject.trim()) return "Add an email subject";
    if (!body.trim()) return "Write your email message";
    if (validCount === 0) return "Add at least one valid recipient";
    return null;
  };

  const handleSave = () => {
    const draft = {
      id: Date.now(),
      campaignName,
      subject,
      body,
      recipients: recipients.map(item => item.email),
      recipientCount: validCount,
      status: "Draft",
      savedAt: new Date().toISOString()
    };

    onSaveDraft?.(draft);
    toast.success("Your draft has been saved");
  };

  const handleReview = () => {
    const error = validateCampaign();

    if (error) {
      toast.error(error);
      return;
    }

    setActiveTab("review");
  };

  const handleSendCampaign = async () => {
    const error = validateCampaign();

    if (error) {
      toast.error(error);
      return;
    }

    if (sending) return;

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: campaignName.trim(),
          subject: subject.trim(),
          message: body.trim(),
          recipients: validRecipients.map(item => item.email)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send campaign");
      }

      const result = {
        sent: data.campaign?.sentCount ?? 0,
        failed: data.campaign?.failedCount ?? 0,
        status: data.campaign?.status ?? "unknown"
      };

      setSendResult(result);

      if (result.sent > 0) {
        toast.success(`${result.sent} email(s) sent successfully`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} email(s) failed`);
      }

      if (result.sent === 0 && result.failed === 0) {
        toast.info(data.message || "Campaign processed");
      }
    } catch (error) {
      toast.error(error.message || "Could not connect to the email server");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      className="pm-composer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="pm-composer"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28 }}
      >
        <header className="pm-composer-header">
          <div className="pm-composer-brand">
            <span className="pm-composer-mark"><Mail size={19} /></span>
            <div>
              <strong>POSTMARK</strong>
              <span>CAMPAIGN STUDIO</span>
            </div>
          </div>

          <div className="pm-composer-header-right">
            <span className="pm-draft-status">
              <span /> {sending ? "SENDING" : "CAMPAIGN WORKSPACE"}
            </span>
            <button className="pm-icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="pm-composer-titlebar">
          <div>
            <div className="pm-eyebrow">WORKSPACE / CAMPAIGNS / NEW</div>
            <h1>
              {sendResult
                ? "Campaign processed."
                : activeTab === "review"
                  ? "Review your campaign."
                  : "Make it worth opening."}
            </h1>
            <p>
              {sendResult
                ? "Here are the actual results returned by your email server."
                : "Thoughtful communication begins with a thoughtful message."}
            </p>
          </div>

          <div className="pm-composer-steps">
            <span className={activeTab === "compose" ? "active" : "complete"}>
              01 <small>COMPOSE</small>
            </span>
            <i />
            <span className={activeTab === "review" ? "active" : ""}>
              02 <small>REVIEW</small>
            </span>
          </div>
        </div>

        {sendResult ? (
          <div className="pm-review-screen">
            <div className="pm-review-card">
              <div className="pm-review-icon">
                <CheckCircle2 size={25} />
              </div>
              <span className="pm-eyebrow">DELIVERY REPORT</span>
              <h2>Campaign results</h2>
              <p>Campaign: {campaignName}</p>

              <div className="pm-review-row">
                <span>SUCCESSFULLY SENT</span>
                <strong>{sendResult.sent}</strong>
              </div>
              <div className="pm-review-row">
                <span>FAILED</span>
                <strong>{sendResult.failed}</strong>
              </div>
              <div className="pm-review-row">
                <span>CAMPAIGN STATUS</span>
                <strong>{sendResult.status.toUpperCase()}</strong>
              </div>

              <p>
                Check your recipient inboxes, including the spam folder.
                A successful SMTP response does not guarantee inbox delivery.
              </p>
            </div>
          </div>
        ) : activeTab === "compose" ? (
          <div className="pm-composer-grid">
            <main className="pm-compose-main">
              <section className="pm-editor-section">
                <div className="pm-section-heading">
                  <span>01 / CAMPAIGN DETAILS</span>
                  <FileText size={17} />
                </div>

                <label className="pm-field-label">CAMPAIGN NAME</label>
                <input
                  className="pm-text-field"
                  value={campaignName}
                  onChange={event => setCampaignName(event.target.value)}
                  placeholder="e.g. November product announcement"
                />

                <label className="pm-field-label">EMAIL SUBJECT</label>
                <input
                  className="pm-text-field"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  placeholder="A subject worth opening..."
                />
                <div className="pm-field-hint">
                  Keep it clear, relevant and human.
                </div>
              </section>

              <section className="pm-editor-section">
                <div className="pm-section-heading">
                  <span>02 / YOUR AUDIENCE</span>
                  <Users size={17} />
                </div>

                <div className="pm-recipient-input">
                  <input
                    value={recipientInput}
                    onChange={event => setRecipientInput(event.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                    placeholder="Enter an email address..."
                  />
                  <button onClick={() => addRecipients(recipientInput)}>
                    <Plus size={17} /> Add
                  </button>
                </div>

                <div className="pm-audience-actions">
                  <button onClick={() => fileInputRef.current?.click()}>
                    <Upload size={15} /> Import CSV
                  </button>
                  <span>Separate multiple addresses with commas or semicolons</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    hidden
                    onChange={importCSV}
                  />
                </div>

                {csvName && (
                  <div className="pm-import-note">
                    <CheckCircle2 size={13} /> Imported from {csvName}
                  </div>
                )}

                <div className="pm-recipient-summary">
                  <div><strong>{validCount}</strong><span>VALID</span></div>
                  <div><strong>{invalidCount}</strong><span>INVALID</span></div>
                  <div><strong>{recipients.length}</strong><span>TOTAL</span></div>
                </div>

                {recipients.length > 0 && (
                  <div className="pm-recipient-list">
                    {recipients.map(item => (
                      <div className="pm-recipient-chip" key={item.id}>
                        {item.valid
                          ? <CheckCircle2 size={14} />
                          : <AlertCircle size={14} />}
                        <span>{item.email}</span>
                        <button
                          onClick={() => removeRecipient(item.id)}
                          aria-label={`Remove ${item.email}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="pm-editor-section">
                <div className="pm-section-heading">
                  <span>03 / MESSAGE CONTENT</span>
                  <Mail size={17} />
                </div>

                <div className="pm-message-toolbar">
                  <span>PLAIN TEXT EDITOR</span>
                  <div className="pm-variable-wrap">
                    <button onClick={() => setShowVariables(!showVariables)}>
                      <Sparkles size={14} /> Personalize <ChevronDown size={13} />
                    </button>
                    <AnimatePresence>
                      {showVariables && (
                        <motion.div
                          className="pm-variable-menu"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <button onClick={() => insertVariable("{{firstName}}")}>
                            First name <code>{"{{firstName}}"}</code>
                          </button>
                          <button onClick={() => insertVariable("{{company}}")}>
                            Company <code>{"{{company}}"}</code>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <textarea
                  className="pm-message-field"
                  value={body}
                  onChange={event => setBody(event.target.value)}
                  placeholder={"Hello,\n\nWrite your message here...\n\nBest regards,\nYour team"}
                  rows={11}
                />

                <div className="pm-editor-footer">
                  <span>Plain-text email message.</span>
                  <span>{body.length} characters</span>
                </div>
              </section>
            </main>

            <aside className="pm-compose-aside">
              <div className="pm-preview-heading">
                <span>LIVE PREVIEW / 001</span>
                <Eye size={17} />
              </div>

              <div className="pm-email-preview">
                <div className="pm-preview-topline">
                  <span>POSTMARK</span>
                  <span>MESSAGE PREVIEW</span>
                </div>
                <div className="pm-preview-envelope">
                  <div className="pm-envelope-icon"><Mail size={23} /></div>
                  <span>CAMPAIGN CORRESPONDENCE</span>
                </div>
                <div className="pm-preview-content">
                  <div className="pm-preview-meta">
                    <span>FROM</span>
                    <strong>POSTMARK WORKSPACE</strong>
                  </div>
                  <div className="pm-preview-meta">
                    <span>TO</span>
                    <strong>
                      {validRecipients[0]?.email || "recipient@example.com"}
                    </strong>
                  </div>
                  <div className="pm-preview-divider" />
                  <div className="pm-preview-subject">
                    {subject || "Your subject will appear here"}
                  </div>
                  <div className="pm-preview-body">
                    {previewBody || "Your message preview will appear here as you write."}
                  </div>
                </div>
                <div className="pm-preview-bottom">SENT WITH CARE · POSTMARK</div>
              </div>

              <div className="pm-preview-note">
                <Sparkles size={16} />
                <p>Your preview updates as you write.</p>
              </div>

              <div className="pm-aside-audience">
                <div className="pm-section-heading">
                  <span>DELIVERY AUDIENCE</span>
                  <Users size={16} />
                </div>
                <strong>{validCount.toLocaleString("en-IN")}</strong>
                <span>VALID RECIPIENTS</span>
                {invalidCount > 0 && (
                  <p>{invalidCount} invalid address(es) need attention.</p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="pm-review-screen">
            <div className="pm-review-card">
              <div className="pm-review-icon">
                <CheckCircle2 size={25} />
              </div>
              <span className="pm-eyebrow">CAMPAIGN REVIEW</span>
              <h2>Everything in its place.</h2>
              <p>Review your details before sending.</p>

              <div className="pm-review-row">
                <span>CAMPAIGN</span>
                <strong>{campaignName}</strong>
              </div>
              <div className="pm-review-row">
                <span>SUBJECT</span>
                <strong>{subject}</strong>
              </div>
              <div className="pm-review-row">
                <span>VALID RECIPIENTS</span>
                <strong>{validCount}</strong>
              </div>
              <div className="pm-review-row">
                <span>INVALID RECIPIENTS</span>
                <strong>{invalidCount}</strong>
              </div>
              <div className="pm-review-message">
                <span>MESSAGE</span>
                <p>{body}</p>
              </div>

              <div className="pm-review-warning">
                <AlertCircle size={16} />
                Only send to recipients who have agreed to receive your emails.
              </div>
            </div>
          </div>
        )}

        <footer className="pm-composer-footer">
          <div className="pm-footer-left">
            <span className="pm-save-indicator" />
            <span>YOUR WORKSPACE · PRIVATE CAMPAIGN</span>
          </div>

          <div className="pm-footer-actions">
            {sendResult ? (
              <button className="pm-primary-button" onClick={onClose}>
                Done <CheckCircle2 size={16} />
              </button>
            ) : activeTab === "review" ? (
              <>
                <button
                  className="pm-secondary-button"
                  onClick={() => setActiveTab("compose")}
                  disabled={sending}
                >
                  Back to edit
                </button>
                <button
                  className="pm-primary-button"
                  onClick={handleSendCampaign}
                  disabled={sending}
                >
                  {sending
                    ? <><Loader2 size={16} className="pm-spin" /> Sending...</>
                    : <><Send size={16} /> Send campaign</>}
                </button>
              </>
            ) : (
              <>
                <button className="pm-secondary-button" onClick={handleSave}>
                  <Save size={16} /> Save draft
                </button>
                <button className="pm-primary-button" onClick={handleReview}>
                  Review campaign <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </footer>
      </motion.section>
    </motion.div>
  );
}