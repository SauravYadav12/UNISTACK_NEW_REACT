import { LegalPageContent } from './LegalPage';

// Content blobs for each legal page. Kept as plain TS so the copy is easy
// to grep / diff — no JSX here. The LegalPage shell renders the sections as
// paragraphs + optional bullets. Update the `updatedAt` stamp whenever the
// copy changes so readers know when the policy shifted.

const UPDATED_AT = 'April 24, 2026';

export const PRIVACY_CONTENT: LegalPageContent = {
  chip: 'PRIVACY POLICY',
  title: 'Your data, handled with care.',
  intro:
    'Unistack is an operational command center that processes organizational data on behalf of the customer. This policy explains what we collect, why, and how long we keep it.',
  updatedAt: UPDATED_AT,
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: [
        'We collect information needed to operate the product and provide the services you sign in for. This includes identity data (name, email, role), workspace content you create (requirements, projects, invoices, timesheets), and usage metadata (login events, feature interactions, error reports).',
        'We do not collect information from your device beyond what is necessary to render the application — no analytics trackers, no ad pixels, no third-party fingerprinting.',
      ],
    },
    {
      heading: 'How we use your information',
      paragraphs: [
        'Your data is used to deliver the features you invoke — routing a requirement to a marketer, generating an invoice from a timesheet, computing leave balances, and so on. Aggregate usage metadata helps us detect outages, improve performance, and scope future work.',
      ],
      bullets: [
        'To operate, maintain, and improve the Unistack application',
        'To authenticate users and enforce role-based access controls',
        'To send operational notifications (invoice raised, approval requested, holiday synced)',
        'To investigate security incidents and respond to abuse reports',
        'To comply with legal obligations and respond to lawful requests',
      ],
    },
    {
      heading: 'Sharing and third parties',
      paragraphs: [
        'We do not sell personal data. We share data with a small set of sub-processors strictly to operate the service — email delivery, object storage for uploaded documents, and the Nager.Date public holiday API. Each sub-processor is bound by a data-processing agreement that restricts use to the stated purpose.',
        'We share data with law enforcement only in response to a valid legal request, and we notify the customer unless legally prohibited.',
      ],
    },
    {
      heading: 'Data retention',
      paragraphs: [
        'Workspace content is retained for the life of your subscription and for 30 days after cancellation, during which it can be exported on request. After 30 days it is permanently deleted from our production systems; backups roll off within 90 days.',
        'Audit logs, login history, and security events are retained for 12 months to support incident response.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You may request access to, correction of, or deletion of your personal data at any time. Customer admins can self-serve for most of these actions from the in-app settings; for anything else, write to privacy@unicodez.com and we will respond within 14 days.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Questions about this policy or about how your data is handled should go to privacy@unicodez.com. We read every one.',
      ],
    },
  ],
};

export const TERMS_CONTENT: LegalPageContent = {
  chip: 'TERMS OF SERVICE',
  title: 'The ground rules for using Unistack.',
  intro:
    'These terms govern your access to and use of the Unistack application. Using the product means you agree to them. If you disagree, stop using the product — your data will be exported on request.',
  updatedAt: UPDATED_AT,
  sections: [
    {
      heading: 'Accounts and access',
      paragraphs: [
        'Unistack is provisioned per organization. An organization admin provisions seats for their team; each seat has a role that determines which modules and actions are available. You are responsible for keeping your credentials private and for any activity that occurs under your account.',
        'Multi-factor authentication is available for every seat and strongly encouraged.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        'You agree not to use Unistack to:',
      ],
      bullets: [
        'Upload content you do not have the right to store or share',
        'Interfere with service operation (scraping, denial-of-service, exfiltration)',
        'Circumvent role-based access controls or attempt to impersonate other users',
        'Use the product in violation of applicable law',
      ],
    },
    {
      heading: 'Your content',
      paragraphs: [
        'You retain ownership of any content you upload to Unistack — requirements, contracts, invoices, uploaded documents, and so on. By uploading you grant us the limited licence needed to store, process, and display that content within your workspace and to your invited users.',
        'We do not use your content to train machine-learning models without your explicit consent.',
      ],
    },
    {
      heading: 'Service availability',
      paragraphs: [
        'We target 99.9% uptime, measured monthly. Scheduled maintenance is announced in advance and scheduled for low-traffic windows. Unplanned outages are communicated on the Status page and resolved as quickly as safely possible.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        'Either party may terminate with 30 days written notice. On termination, workspace content becomes read-only for 30 days for export, then is permanently deleted. Accrued invoices for service already rendered remain due.',
      ],
    },
    {
      heading: 'Liability',
      paragraphs: [
        'To the extent permitted by law, our aggregate liability is capped at the fees paid by the customer in the twelve months preceding the claim. We are not liable for indirect, consequential, or incidental damages.',
        'Nothing in these terms limits liability for fraud, wilful misconduct, or anything else that cannot be limited by law.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'We may update these terms from time to time. Material changes are announced by email to customer admins at least 14 days before they take effect.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Questions about these terms should go to legal@unicodez.com.',
      ],
    },
  ],
};

export const SECURITY_CONTENT: LegalPageContent = {
  chip: 'SECURITY',
  title: 'How we keep your ops data safe.',
  intro:
    'Security is a product feature, not a policy footnote. Unistack is built with defense-in-depth from the data model up to the browser. This page covers the controls we apply, how we respond to incidents, and how to report a vulnerability.',
  updatedAt: UPDATED_AT,
  sections: [
    {
      heading: 'Data in transit and at rest',
      paragraphs: [
        'All traffic between your browser and Unistack is encrypted with TLS 1.2 or higher. HSTS is enforced with a one-year max-age. Inside our infrastructure, service-to-service calls use mutual TLS.',
        'Data at rest — including the primary database, backups, and object storage for uploaded documents — is encrypted using AES-256.',
      ],
    },
    {
      heading: 'Authentication and access',
      paragraphs: [
        'Unistack supports password + OTP and SSO. Every authentication path is rate-limited and logged. Passwords are hashed with bcrypt at cost 12 and never stored in plain text.',
        'Inside the product, every endpoint enforces role-based access checks derived from your organization\'s access-control matrix. A support engineer can never read a tenant\'s content without an explicit, time-bound, and logged break-glass grant.',
      ],
    },
    {
      heading: 'Audit logging',
      paragraphs: [
        'Every sensitive action — invoice raised, access control changed, document uploaded, data exported — is recorded in an append-only audit log with the actor, IP, user agent, and timestamp. Admins can query the log from the in-app settings; retention is 12 months.',
      ],
    },
    {
      heading: 'Backups and recovery',
      paragraphs: [
        'The primary database is backed up every 6 hours with point-in-time restore available for any timestamp within the last 30 days. Backups are encrypted, stored in a separate region, and tested for restoration on a monthly cadence.',
      ],
    },
    {
      heading: 'Vulnerability reporting',
      paragraphs: [
        'If you believe you have found a security vulnerability, please email security@unicodez.com with a description and steps to reproduce. We acknowledge every report within two business days and treat responsibly disclosed vulnerabilities in good faith.',
        'We do not pursue legal action against researchers who operate in good faith, avoid privacy violations, and give us reasonable time to remediate before disclosing.',
      ],
    },
    {
      heading: 'Sub-processors',
      paragraphs: [
        'A minimal set of sub-processors powers the service — email delivery, object storage, and holiday-calendar enrichment. Each is bound by a data-processing agreement. The current list is available on request to your account admin.',
      ],
    },
  ],
};

export const STATUS_CONTENT: LegalPageContent = {
  chip: 'SYSTEM STATUS',
  title: 'All systems operational.',
  intro:
    'This page summarises current service status and our operational posture. For the live incident feed, subscribe to status updates from your account admin dashboard.',
  updatedAt: UPDATED_AT,
  sections: [
    {
      heading: 'Current status',
      paragraphs: [
        'At the time this page was rendered, all Unistack services are operating within expected thresholds. Response times are within SLA, background jobs are draining on schedule, and no degradations are currently being investigated.',
      ],
      bullets: [
        'Web application — Operational',
        'API · core CRUD — Operational',
        'Authentication — Operational',
        'Invoice generation + PDF render — Operational',
        'Email delivery — Operational',
        'File uploads — Operational',
        'Holiday sync (Nager.Date) — Operational',
      ],
    },
    {
      heading: 'Our uptime commitment',
      paragraphs: [
        'We target 99.9% monthly uptime across the production environment, measured as the percentage of minutes during which the API returns successful responses to a synthetic health check.',
        'When we miss the target, customers on a paid plan are eligible for SLA credits per the terms of service. Credits are applied automatically to the next invoice.',
      ],
    },
    {
      heading: 'Incident communication',
      paragraphs: [
        'When an incident is detected, we post an initial acknowledgement within 15 minutes, follow with regular updates at least every 30 minutes while the incident is open, and publish a post-incident review within five business days of resolution.',
      ],
    },
    {
      heading: 'Scheduled maintenance',
      paragraphs: [
        'Planned maintenance is announced at least 72 hours in advance and scheduled for low-traffic windows (Saturdays 02:00–04:00 IST by default). Emergency maintenance — required to close a security or data-integrity gap — may be announced with less notice.',
      ],
    },
    {
      heading: 'Historical uptime',
      paragraphs: [
        'Historical uptime for the preceding 90 days is available in the admin dashboard under Settings → Status. If you need a longer window for an audit, write to accounts@unicodez.com.',
      ],
    },
  ],
};
