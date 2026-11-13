
import { Mail } from 'lucide-react'

function EmailPreview({ subject, body, recipient }) {
  return (
    <div className="email-preview">
      <div className="email-preview-brand">
        <div className="email-preview-logo"><Mail size={18} /></div>
        <strong>postmark<span>.</span></strong>
      </div>

      <div className="email-preview-content">
        <div className="preview-subject">
          {subject || 'Your email subject appears here'}
        </div>

        <div className="preview-greeting">
          Hi {recipient || 'Alex'},
        </div>

        <div className="preview-message">
          {body
            ? body.replace(/{{firstName}}/gi, recipient || 'Alex')
                .replace(/{{company}}/gi, 'Example Company')
            : 'Your email message will appear here as you write it.'}
        </div>

        <div className="preview-signature">
          Best regards,<br />
          <strong>Your Team</strong>
        </div>
      </div>

      <div className="email-preview-footer">
        <span>Sent with care using POSTMARK.</span>
        <span>Unsubscribe preferences will appear here.</span>
      </div>
    </div>
  )
}

export default EmailPreview
