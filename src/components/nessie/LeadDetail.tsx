import { useState, useEffect, useMemo } from 'react';
import type { SuccessfulScrape, LeadStatus } from '../../types/nessie';
import type { Batch } from '../../hooks/useBatches';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Check,
  Download,
  Mail,
  Tag as TagIcon,
  X,
  Send,               // 👈 added
} from 'lucide-react';
import { EmailComposer } from '../components/EmailComposer'; // 👈 added

interface LeadDetailProps {
  lead: SuccessfulScrape | null;
  batch: Batch | null;
  allLeads: SuccessfulScrape[];
  loading?: boolean;
  onToast: (message: string) => void;
  onLeadUpdate?: (leadId: string) => Promise<void> | ((leadId: string, updates: Partial<SuccessfulScrape>) => Promise<void>);
  onLeadDelete?: (leadId: string) => Promise<void>;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

// ... getEmptyStateGreeting unchanged ...

export const LeadDetail = ({ 
  lead, 
  batch, 
  allLeads,
  loading, 
  onToast,
  onLeadUpdate,
  onLeadDelete,
  onNavigate
}: LeadDetailProps) => {
  const { profile } = useAuth();
  
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false); // 👈 added

  console.log('[LeadDetail] Rendering. Loading:', loading, 'Lead:', lead?.id, 'Batch:', batch?.id);

  // ... rest of hooks & logic unchanged ...

  const statusColors = getStatusColor(leadStatus);

  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '32px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Breadcrumb & Navigation */}
      {/* ... unchanged ... */}

      {/* Lead Summary Section */}
      {/* ... unchanged ... */}

      {/* Status & Tags Section */}
      {/* ... unchanged ... */}

      {/* Icebreaker Section */}
      {/* ... unchanged ... */}

      {/* Message Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#e2e8f0',
            margin: 0,
          }}>
            Message
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copyToClipboard(messageBody, 'Message')}
              style={{
                background: 'var(--accent)',
                color: '#021014',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Copy size={14} />
              Copy Message
            </button>

            {/* 👇 NEW: Send Email button */}
            {Array.isArray(lead.emails) && lead.emails.length > 0 && (
              <button
                onClick={() => setShowEmailComposer(true)}
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#021014',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={14} />
                Send Email
              </button>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '20px',
          borderRadius: '6px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}>
          {batch.channel === 'email' && (
            <div style={{ marginBottom: '16px' }}>
              {/* Subject input unchanged */}
            </div>
          )}

          {/* Body textarea unchanged */}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        paddingTop: '24px',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
      }}>
        {/* ... existing buttons unchanged ... */}
      </div>

      {/* 👇 NEW: EmailComposer modal */}
      {showEmailComposer && (
        <EmailComposer
          lead={{
            id: lead.id,
            company_name: lead.company || lead.domain || lead.website,
            full_name: (lead as any).full_name || '', // adjust if SuccessfulScrape has full_name
            email: Array.isArray(lead.emails) && lead.emails.length > 0 ? lead.emails[0] : '',
            industry: lead.industry,
          }}
          onClose={() => setShowEmailComposer(false)}
          onSent={async () => {
            // Optional: mark as contacted when sent
            await handleStatusChange('contacted');
            onToast('Email sent');
            setShowEmailComposer(false);
          }}
        />
      )}
    </div>
  );
};
