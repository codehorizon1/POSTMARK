
import { useEffect, useMemo, useState } from "react";
import "./CampaignTable.css";
import {
  RefreshCw,
  Search,
  Mail,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Inbox,
  Eye,
} from "lucide-react";
import CampaignDetails from "./CampaignDetails";

const API_URL = "http://localhost:5001/api/campaigns";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const value = (status || "pending").toLowerCase();

  return (
    <span className={`campaign-status ${value}`}>
      {value}
    </span>
  );
}

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load campaign history.");
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : [];

      setCampaigns(records);

      if (selectedCampaign) {
        const updated = records.find(
          (item) => item._id === selectedCampaign._id
        );

        if (updated) {
          setSelectedCampaign(updated);
        } else {
          setSelectedCampaign(null);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCampaignUpdated = (updatedCampaign) => {
    setCampaigns((previous) =>
      previous.map((item) =>
        item._id === updatedCampaign._id ? updatedCampaign : item
      )
    );

    setSelectedCampaign(updatedCampaign);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const query = search.toLowerCase();

      const matchesSearch =
        campaign.name?.toLowerCase().includes(query) ||
        campaign.subject?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" || campaign.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [campaigns, search, filter]);

  const totalSent = campaigns.reduce(
    (sum, campaign) => sum + (campaign.sentCount || 0),
    0
  );

  const totalFailed = campaigns.reduce(
    (sum, campaign) => sum + (campaign.failedCount || 0),
    0
  );

  const totalRecipients = campaigns.reduce(
    (sum, campaign) => sum + (campaign.recipients?.length || 0),
    0
  );

  if (selectedCampaign) {
    return (
      <CampaignDetails
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
        onUpdated={handleCampaignUpdated}
      />
    );
  }

  return (
    <section className="campaign-history">
      <div className="campaign-history-heading">
        <div>
          <span className="eyebrow">
            POSTMARK WORKSPACE / HISTORY
          </span>
          <h1>Your campaigns.</h1>
          <p>Review your messages and monitor delivery results.</p>
        </div>

        <button
          className="history-refresh"
          onClick={fetchCampaigns}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="history-stats">
        <div className="history-stat">
          <Mail size={19} />
          <span>Total campaigns</span>
          <strong>{campaigns.length}</strong>
        </div>

        <div className="history-stat">
          <CheckCircle2 size={19} />
          <span>Successfully sent</span>
          <strong>{totalSent.toLocaleString()}</strong>
        </div>

        <div className="history-stat">
          <XCircle size={19} />
          <span>Failed emails</span>
          <strong>{totalFailed.toLocaleString()}</strong>
        </div>

        <div className="history-stat">
          <Inbox size={19} />
          <span>Total recipients</span>
          <strong>{totalRecipients.toLocaleString()}</strong>
        </div>
      </div>

      <div className="history-directory">
        <div className="history-toolbar">
          <div>
            <span className="eyebrow">DELIVERY RECORDS / 001</span>
            <h2>Campaign history</h2>
          </div>

          <div className="history-controls">
            <div className="history-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All campaigns</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="history-error">
            <XCircle size={18} />
            {error}
            <button onClick={fetchCampaigns}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="history-empty">
            <RefreshCw className="spin" size={25} />
            <p>Loading your campaign records...</p>
          </div>
        ) : !error && filteredCampaigns.length === 0 ? (
          <div className="history-empty">
            <Inbox size={36} />
            <h3>No campaigns found.</h3>
            <p>
              Your sent campaigns will appear here after you create
              and send your first campaign.
            </p>
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>CAMPAIGN</th>
                  <th>RECIPIENTS</th>
                  <th>SENT</th>
                  <th>FAILED</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign._id}>
                    <td>
                      <div className="history-campaign-name">
                        <span className="history-mail-icon">
                          <Mail size={17} />
                        </span>
                        <div>
                          <strong>{campaign.name}</strong>
                          <small>{campaign.subject}</small>
                        </div>
                      </div>
                    </td>

                    <td>{campaign.recipients?.length || 0}</td>

                    <td className="success-number">
                      {campaign.sentCount || 0}
                    </td>

                    <td className="failed-number">
                      {campaign.failedCount || 0}
                    </td>

                    <td>
                      <StatusBadge status={campaign.status} />
                    </td>

                    <td className="history-date">
                      {formatDate(campaign.createdAt)}
                    </td>

                    <td>
                      <button
                        className="campaign-view-button"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <Eye size={15} />
                        Details
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="history-footer">
          <span>
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </span>
          <span>
            Live records <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </section>
  );
}
