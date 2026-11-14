import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  ShieldCheck,
  Ban,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  X,
  Sparkles,
  Filter,
  Mail,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import './AudienceManager.css'

// API CONFIGURATION
const API_URL = `${import.meta.env.VITE_API_URL}/api/contacts`;

const emptyForm = {
  name: '',
  email: '',
  company: '',
}

// HELPERS
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
    String(email || '').trim()
  )

const getDomain = (email) =>
  String(email || '').split('@')[1]?.toLowerCase() || 'unknown'

const normalizeHeader = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z]/g, '')

const mapContact = (contact) => ({
  id: contact._id,
  name: contact.name || '',
  email: contact.email || '',
  company: contact.company || '',
  valid: isValidEmail(contact.email),
  status:
    contact.status === 'suppressed'
      ? 'Suppressed'
      : 'Active',
  source: 'MongoDB',
  createdAt: contact.createdAt,
})

// CSV PARSER
const parseCSV = (text) => {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++

      row.push(cell.trim())

      if (row.some(value => value !== '')) {
        rows.push(row)
      }

      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell.trim())

  if (row.some(value => value !== '')) {
    rows.push(row)
  }

  return rows
}

const findColumn = (headers, names) =>
  headers.findIndex(header =>
    names.includes(normalizeHeader(header))
  )

// STAT CARD
function AudienceStat({ label, value, note, icon: Icon }) {
  return (
    <motion.div
      className="aud-stat"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="aud-stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>

      <strong>{value}</strong>
      <small>{note}</small>
    </motion.div>
  )
}

// MAIN COMPONENT
export default function AudienceManager() {
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [domainFilter, setDomainFilter] = useState('All')

  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [savingContact, setSavingContact] = useState(false)

  const [showImportReport, setShowImportReport] = useState(false)
  const [importReport, setImportReport] = useState(null)
  const [importing, setImporting] = useState(false)

  const fileInputRef = useRef(null)

  // FETCH CONTACTS FROM MONGODB
  const fetchContacts = async () => {
    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to fetch contacts')
      }

      const data = await response.json()

      setContacts(
        Array.isArray(data) ? data.map(mapContact) : []
      )
    } catch (error) {
      console.error('Contact loading error:', error)
      toast.error('Unable to load contacts from MongoDB.')
    } finally {
      setLoadingContacts(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  // AUDIENCE STATISTICS
  const validContacts = contacts.filter(contact =>
    contact.valid !== false && isValidEmail(contact.email)
  )

  const invalidContacts = contacts.filter(contact =>
    contact.valid === false || !isValidEmail(contact.email)
  )

  const activeContacts = contacts.filter(contact =>
    contact.status !== 'Suppressed' &&
    contact.valid !== false &&
    isValidEmail(contact.email)
  )

  const suppressedContacts = contacts.filter(contact =>
    contact.status === 'Suppressed'
  )

  const quality = contacts.length
    ? Math.round((validContacts.length / contacts.length) * 100)
    : 100

  // DOMAIN INTELLIGENCE
  const domainStats = useMemo(() => {
    const counts = {}

    validContacts.forEach(contact => {
      const domain = getDomain(contact.email)
      counts[domain] = (counts[domain] || 0) + 1
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
  }, [contacts])

  const maxDomainCount = Math.max(
    1,
    ...domainStats.map(([, count]) => count)
  )

  // FILTER CONTACTS
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const query = search.toLowerCase()

      const matchesSearch =
        (contact.name || '').toLowerCase().includes(query) ||
        (contact.email || '').toLowerCase().includes(query) ||
        (contact.company || '').toLowerCase().includes(query)

      const isInvalid =
        contact.valid === false || !isValidEmail(contact.email)

      const matchesStatus =
        filter === 'All' ||
        (filter === 'Active' &&
          contact.status !== 'Suppressed' &&
          !isInvalid) ||
        (filter === 'Suppressed' &&
          contact.status === 'Suppressed') ||
        (filter === 'Invalid' && isInvalid)

      const matchesDomain =
        domainFilter === 'All' ||
        getDomain(contact.email) === domainFilter

      return matchesSearch && matchesStatus && matchesDomain
    })
  }, [contacts, search, filter, domainFilter])

  // ADD CONTACT TO MONGODB
  const handleAddContact = async (event) => {
    event.preventDefault()

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const company = form.company.trim()

    if (!email || !isValidEmail(email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    if (contacts.some(contact =>
      contact.email.toLowerCase() === email
    )) {
      toast.error('This email address already exists.')
      return
    }

    setSavingContact(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, company }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add contact')
      }

      setContacts(previous => [...previous, mapContact(data)])
      setForm(emptyForm)
      setShowAddForm(false)

      toast.success('Contact saved to MongoDB.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingContact(false)
    }
  }

  // CSV IMPORT TO MONGODB
  const handleCSVImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file.')
      event.target.value = ''
      return
    }

    setImporting(true)

    try {
      const fileText = await file.text()
      const rows = parseCSV(fileText)

      if (rows.length < 2) {
        toast.error('The CSV file has no contact rows.')
        return
      }

      const headers = rows[0]

      const emailIndex = findColumn(headers, [
        'email',
        'emailaddress',
        'mail',
        'contactemail',
      ])

      const nameIndex = findColumn(headers, [
        'name',
        'fullname',
        'firstname',
        'contactname',
      ])

      const companyIndex = findColumn(headers, [
        'company',
        'organization',
        'organisation',
        'business',
      ])

      if (emailIndex === -1) {
        toast.error('No Email column found in your CSV.')
        return
      }

      const existingEmails = new Set(
        contacts.map(contact =>
          String(contact.email || '').toLowerCase()
        )
      )

      const importedEmails = new Set()
      const newContacts = []

      let duplicates = 0
      let invalid = 0
      let empty = 0
      let failed = 0

      const rowsToImport = []

      rows.slice(1).forEach(row => {
        const email = String(row[emailIndex] || '')
          .trim()
          .toLowerCase()

        if (!email) {
          empty++
          return
        }

        if (
          existingEmails.has(email) ||
          importedEmails.has(email)
        ) {
          duplicates++
          return
        }

        importedEmails.add(email)

        const valid = isValidEmail(email)

        if (!valid) {
          invalid++
          return
        }

        const nameValue =
          nameIndex >= 0 ? row[nameIndex] : ''

        const companyValue =
          companyIndex >= 0 ? row[companyIndex] : ''

        rowsToImport.push({
          name: nameValue?.trim() || email.split('@')[0],
          email,
          company: companyValue?.trim() || '',
        })
      })

      // Send each valid contact to the backend.
      for (const contact of rowsToImport) {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contact),
          })

          const data = await response.json()

          if (response.status === 409) {
            duplicates++
            continue
          }

          if (!response.ok) {
            failed++
            continue
          }

          newContacts.push(mapContact(data))
        } catch (error) {
          console.error('Contact import error:', error)
          failed++
        }
      }

      if (newContacts.length > 0) {
        setContacts(previous => [...previous, ...newContacts])
      }

      const report = {
        filename: file.name,
        total: rows.length - 1,
        imported: newContacts.length,
        duplicates,
        invalid,
        empty,
        failed,
      }

      setImportReport(report)
      setShowImportReport(true)

      if (newContacts.length > 0) {
        toast.success(
          `${newContacts.length} contacts imported successfully.`
        )
      } else {
        toast.info('Import completed. No new contacts were added.')
      }
    } catch (error) {
      console.error('CSV import failed:', error)
      toast.error('Unable to read this CSV file.')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  // EXPORT CONTACTS
  const handleExport = () => {
    if (!contacts.length) {
      toast.error('There are no contacts to export.')
      return
    }

    const escapeCSV = (value) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const headers = [
      'Name',
      'Email',
      'Company',
      'Domain',
      'Status',
      'Valid',
      'Source',
    ]

    const rows = contacts.map(contact => [
      contact.name,
      contact.email,
      contact.company,
      getDomain(contact.email),
      contact.status,
      contact.valid !== false ? 'Yes' : 'No',
      contact.source,
    ])

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'postmark-audience.csv'

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)

    toast.success('Audience exported successfully.')
  }

  // SUPPRESS / REACTIVATE CONTACT
  const toggleSuppression = async (id) => {
    const contact = contacts.find(item => item.id === id)

    if (!contact) return

    const nextStatus =
      contact.status === 'Suppressed'
        ? 'active'
        : 'suppressed'

    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update contact')
      }

      setContacts(previous =>
        previous.map(item =>
          item.id === id ? mapContact(data) : item
        )
      )

      toast.success('Contact status updated.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  // DELETE CONTACT FROM MONGODB
  const deleteContact = async (id) => {
    const confirmed = window.confirm(
      'Delete this contact permanently from your audience?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete contact')
      }

      setContacts(previous =>
        previous.filter(contact => contact.id !== id)
      )

      toast.success('Contact deleted from MongoDB.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearch('')
    setFilter('All')
    setDomainFilter('All')
  }

  // RENDER
  return (
    <div className="audience-page">

      {/* PAGE HEADER */}
      <div className="audience-hero">
        <div>
          <div className="aud-eyebrow">
            POSTMARK WORKSPACE / AUDIENCE
          </div>

          <h1>Know your audience.</h1>

          <p>
            A healthier audience creates more meaningful communication.
          </p>
        </div>

        <div className="aud-hero-actions">
          <button
            className="aud-smart-button"
            onClick={handleExport}
          >
            <Download size={16} />
            Export
          </button>

          <button
            className="aud-smart-button primary"
            onClick={() => setShowAddForm(value => !value)}
          >
            <UserPlus size={16} />
            Add contact
          </button>
        </div>
      </div>

      {/* ADD CONTACT FORM */}
      {showAddForm && (
        <motion.form
          className="aud-smart-form"
          onSubmit={handleAddContact}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            placeholder="Contact name"
            value={form.name}
            onChange={event =>
              setForm({ ...form, name: event.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email address *"
            value={form.email}
            onChange={event =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Company"
            value={form.company}
            onChange={event =>
              setForm({ ...form, company: event.target.value })
            }
          />

          <button
            type="submit"
            className="aud-smart-button primary"
            disabled={savingContact}
          >
            {savingContact ? (
              <RefreshCw size={15} className="spin" />
            ) : (
              <UserPlus size={15} />
            )}

            {savingContact ? 'Saving...' : 'Save contact'}
          </button>
        </motion.form>
      )}

      {/* STATISTICS */}
      <div className="aud-stats-grid">
        <AudienceStat
          label="TOTAL CONTACTS"
          value={contacts.length}
          note="All audience records"
          icon={Users}
        />

        <AudienceStat
          label="ACTIVE CONTACTS"
          value={activeContacts.length}
          note="Available for eligible campaigns"
          icon={CheckCircle2}
        />

        <AudienceStat
          label="SUPPRESSED"
          value={suppressedContacts.length}
          note="Excluded from campaign audiences"
          icon={Ban}
        />

        <AudienceStat
          label="AUDIENCE QUALITY"
          value={`${quality}%`}
          note={`${invalidContacts.length} invalid addresses`}
          icon={ShieldCheck}
        />
      </div>

      {/* IMPORT REPORT */}
      {showImportReport && importReport && (
        <motion.section
          className="aud-smart-report"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="aud-smart-section-heading">
            <div>
              <div className="aud-eyebrow">
                <FileSpreadsheet size={14} />
                CSV IMPORT REPORT
              </div>

              <h3>Import completed.</h3>
              <p>{importReport.filename}</p>
            </div>

            <button
              className="aud-smart-report-close"
              onClick={() => setShowImportReport(false)}
              aria-label="Close import report"
            >
              <X size={19} />
            </button>
          </div>

          <div className="aud-smart-report-grid">
            <div className="aud-smart-report-item">
              <strong>{importReport.imported}</strong>
              <span>Imported</span>
            </div>

            <div className="aud-smart-report-item">
              <strong>{importReport.duplicates}</strong>
              <span>Duplicates skipped</span>
            </div>

            <div className="aud-smart-report-item">
              <strong>{importReport.invalid}</strong>
              <span>Invalid emails</span>
            </div>

            <div className="aud-smart-report-item">
              <strong>{importReport.empty}</strong>
              <span>Empty rows</span>
            </div>

            <div className="aud-smart-report-item">
              <strong>{importReport.failed}</strong>
              <span>Failed imports</span>
            </div>
          </div>

          <p>
            {importReport.total} contact rows were checked.
            Invalid email addresses are excluded from campaign audiences.
          </p>
        </motion.section>
      )}

      {/* MAIN CONTENT */}
      <div className="aud-main-grid">

        {/* DIRECTORY */}
        <section className="aud-directory">
          <div className="aud-directory-heading">
            <div>
              <div className="aud-eyebrow">
                DIRECTORY / 001
              </div>

              <h2>Audience directory.</h2>

              <p>
                Manage, inspect and organize your contacts.
              </p>
            </div>

            <button
              className="aud-smart-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <RefreshCw size={16} className="spin" />
              ) : (
                <Upload size={16} />
              )}

              {importing ? 'Importing...' : 'Import CSV'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleCSVImport}
            />
          </div>

          {/* SEARCH AND FILTER TOOLBAR */}
          <div className="aud-smart-toolbar">
            <div className="aud-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search names, emails or companies..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <select
              className="aud-smart-select"
              value={filter}
              onChange={event => setFilter(event.target.value)}
              aria-label="Filter by contact status"
            >
              <option value="All">All contacts</option>
              <option value="Active">Active</option>
              <option value="Suppressed">Suppressed</option>
              <option value="Invalid">Invalid</option>
            </select>

            <select
              className="aud-smart-select"
              value={domainFilter}
              onChange={event => setDomainFilter(event.target.value)}
              aria-label="Filter by email domain"
            >
              <option value="All">All domains</option>

              {domainStats.map(([domain]) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>

            <button
              className="aud-smart-button"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <Filter size={15} />
              Clear
            </button>
          </div>

          {/* CONTACT TABLE */}
          <div className="aud-table-wrap">
            <table className="aud-table">
              <thead>
                <tr>
                  <th>CONTACT</th>
                  <th>COMPANY</th>
                  <th>DOMAIN</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loadingContacts && (
                  <tr>
                    <td colSpan="5">
                      <div className="aud-smart-empty">
                        <RefreshCw size={25} className="spin" />
                        <p>Loading contacts from MongoDB...</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingContacts && filteredContacts.map(contact => {
                  const isInvalid =
                    contact.valid === false ||
                    !isValidEmail(contact.email)

                  const isSuppressed =
                    contact.status === 'Suppressed'

                  return (
                    <tr key={contact.id}>
                      <td>
                        <div className="aud-contact">
                          <div className="aud-contact-avatar">
                            {(contact.name || contact.email || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {contact.name || 'Unnamed contact'}
                            </strong>

                            <small>{contact.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {contact.company || '—'}
                      </td>

                      <td>
                        {getDomain(contact.email)}
                      </td>

                      <td>
                        <span
                          className={`aud-smart-contact-status ${
                            isSuppressed
                              ? 'suppressed'
                              : isInvalid
                                ? 'invalid'
                                : ''
                          }`}
                        >
                          <i />

                          {isSuppressed
                            ? 'Suppressed'
                            : isInvalid
                              ? 'Invalid'
                              : 'Active'}
                        </span>
                      </td>

                      <td>
                        <div className="aud-smart-contact-actions">
                          <button
                            onClick={() => toggleSuppression(contact.id)}
                            title={
                              isSuppressed
                                ? 'Reactivate contact'
                                : 'Suppress contact'
                            }
                            aria-label={
                              isSuppressed
                                ? 'Reactivate contact'
                                : 'Suppress contact'
                            }
                          >
                            {isSuppressed ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Ban size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => deleteContact(contact.id)}
                            title="Delete contact"
                            aria-label="Delete contact"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!loadingContacts && filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="aud-smart-empty">
                        <Users size={28} />

                        <p>
                          {contacts.length === 0
                            ? 'Your audience is empty. Add your first contact.'
                            : 'No contacts match your search or filters.'}
                        </p>

                        <button
                          className="aud-smart-button"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="aud-directory-footer">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </section>

        {/* INTELLIGENCE SIDEBAR */}
        <aside className="aud-insights">

          {/* LIST HEALTH */}
          <section className="aud-insight-card">
            <div className="aud-eyebrow">
              <ShieldCheck size={15} />
              LIST HEALTH / 002
            </div>

            <div>
              <strong className="aud-quality-number">
                {quality}<span>%</span>
              </strong>

              <span className="aud-quality-label">
                AUDIENCE QUALITY
              </span>
            </div>

            <div className="aud-quality-track">
              <div style={{ width: `${quality}%` }} />
            </div>

            <p>
              {validContacts.length} of {contacts.length} addresses
              pass basic email-format validation.
            </p>

            <div className="aud-health-row">
              <span>
                <CheckCircle2 size={15} />
                Format valid
              </span>

              <strong>{validContacts.length}</strong>
            </div>

            <div className="aud-health-row">
              <span>
                <AlertCircle size={15} />
                Invalid format
              </span>

              <strong>{invalidContacts.length}</strong>
            </div>

            <div className="aud-health-row">
              <span>
                <Ban size={15} />
                Suppressed
              </span>

              <strong>{suppressedContacts.length}</strong>
            </div>
          </section>

          {/* DOMAIN INTELLIGENCE */}
          <section className="aud-insight-card">
            <div className="aud-eyebrow">
              <Globe size={15} />
              DOMAIN INTELLIGENCE / 003
            </div>

            <h3>Where your audience lives.</h3>

            {domainStats.length > 0 ? (
              <div className="aud-smart-domain-list">
                {domainStats.map(([domain, count]) => (
                  <div key={domain}>
                    <div className="aud-smart-domain-row">
                      <button
                        onClick={() => setDomainFilter(domain)}
                        title={`Filter contacts from ${domain}`}
                      >
                        {domain}
                      </button>

                      <strong>{count}</strong>
                    </div>

                    <div className="aud-smart-domain-track">
                      <div
                        className="aud-smart-domain-fill"
                        style={{
                          width: `${(count / maxDomainCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aud-smart-empty">
                <Globe size={24} />

                <p>
                  Domain insights will appear when valid contacts are added.
                </p>
              </div>
            )}
          </section>

          {/* SMART AUDIENCE NOTE */}
          <section className="aud-insight-card aud-smart-tip">
            <div className="aud-eyebrow">
              <Sparkles size={15} />
              SMART AUDIENCE NOTE
            </div>

            <h3>Quality before quantity.</h3>

            <p>
              Keep your audience clean. Remove duplicates,
              review invalid addresses and suppress contacts
              who should no longer receive campaigns.
            </p>
          </section>
        </aside>
      </div>

      {/* FOOTNOTE */}
      <div className="aud-smart-disclaimer">
        <Mail size={14} />

        Email-format validation checks address structure only.
        It does not confirm that a mailbox exists or that a recipient
        has consented to receive marketing emails.
      </div>
    </div>
  )
}