import { useState } from 'react';
import { Send, Copy, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { EmailComposer } from '../EmailComposer';
import type { SuccessfulScrape } from '../../types/nessie';
import type { Batch } from '../../hooks/useBatches';

interface LeadDetailProps {
  lead: SuccessfulScrape | null;
  batch: Batch | null;
  allLeads: SuccessfulScrape[];
  loading?: boolean;
  onToast: (message: string) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return '#60a5fa';
    case 'contacted': return '#fbbf24';
    case 'qualified': return '#34d399';
    case 'unqualified': return '#f87171';
    default: return '#9ca3af';
  }
};

export const LeadDetail = ({ lead, batch, allLeads, loading, onToast, onNavigate }: LeadDetailProps) => {
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [messageBody, setMessageBody] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onToast(`${label} copied!`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Select a lead to view details
      </div>
    );
  }

  const currentIndex = allLeads.findIndex(l => l.id === lead.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLeads.length - 1;

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            {lead.company || lead.domain || 'Unknown Company'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {lead.website}
                <ExternalLink size={12} />
              </a>
            )}
            {lead.industry && (
              <span style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}>
                {lead.industry}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onNavigate?.('prev')}
            disabled={!hasPrev}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: hasPrev ? 'var(--text)' : 'var(--text-secondary)',
              cursor: hasPrev ? 'pointer' : 'not-allowed',
              opacity: hasPrev ? 1 : 0.5,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ 
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            {currentIndex + 1} / {allLeads.length}
          </span>
          <button
            onClick={() => onNavigate?.('next')}
            disabled={!hasNext}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: hasNext ? 'var(--text)' : 'var(--text-secondary)',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              opacity: hasNext ? 1 : 0.5,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '32px',
      }}>
        {/* Contact Info */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '16px',
          }}>
            Contact Information
          </h2>
          
          {lead.emails && lead.emails.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                display: 'block',
                marginBottom: '4px',
              }}>
                Email
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text)',
              }}>
                {lead.emails[0]}
              </span>
            </div>
          )}

          {lead.phone_numbers && lead.phone_numbers.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                display: 'block',
                marginBottom: '4px',
              }}>
                Phone
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text)',
              }}>
                {lead.phone_numbers[0]}
              </span>
            </div>
          )}

          {lead.location && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                display: 'block',
                marginBottom: '4px',
              }}>
                Location
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text)',
              }}>
                {lead.location}
              </span>
            </div>
          )}
        </div>

        {/* Message Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}>
              Message
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(messageBody, 'Message')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <Copy size={14} />
                Copy Message
              </button>

              <button
                onClick={() => setShowEmailComposer(true)}
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#021014',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Send size={14} />
                Send Email
              </button>
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            minHeight: '200px',
          }}>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Auto-generated message based on lead details. Edit freely before sending."
              style={{
                width: '100%',
                minHeight: '180px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'Space Grotesk, sans-serif',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Notes • {lead.website || lead.domain}
          </h2>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}>
            Visible only inside Nessie
          </p>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            minHeight: '120px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            Add quick notes here: objections, call outcomes, manual tweaks you made, etc.
          </div>
        </div>
      </div>

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer
          lead={{
            id: lead.id,
            company_name: lead.company || lead.domain || 'Unknown',
            full_name: lead.full_name || '',
            email: (lead.emails && lead.emails.length > 0) ? lead.emails[0] : '',
            industry: lead.industry,
          }}
          onClose={() => setShowEmailComposer(false)}
          onSent={() => {
            onToast('Email sent successfully!');
            setShowEmailComposer(false);
          }}
        />
      )}
    </div>
  );
};