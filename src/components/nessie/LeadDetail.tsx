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
  Send,
} from "lucide-react";
import { EmailComposer } from "../EmailComposer";


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

const getStatusColor = (status: LeadStatus) => {
  switch (status) {
    case 'new':
      return '#60a5fa';
    case 'contacted':
      return '#fbbf24';
    case 'qualified':
      return '#34d399';
    case 'unqualified':
      return '#f87171';
    default:
      return '#9ca3af';
  }
};

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
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  console.log('[LeadDetail] Rendering. Loading:', loading, 'Lead:', lead?.id, 'Batch:', batch?.id);

  const statusColors = getStatusColor(leadStatus);

  useEffect(() => {
    if (lead) {
      setLeadStatus((lead as any).status || 'new');
      setTags((lead as any).tags || []);
      setMessageBody(lead.icebreaker || '');
    }
  }, [lead]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onToast(`${label} copied to clipboard!`);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setLeadStatus(newStatus);
    if (onLeadUpdate && lead) {
      await onLeadUpdate(lead.id, { status: newStatus } as any);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      setIsAddingTag(false);
      if (onLeadUpdate && lead) {
        onLeadUpdate(lead.id, { tags: updatedTags } as any);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    if (onLeadUpdate && lead) {
      onLeadUpdate(lead.id, { tags: updatedTags } as any);
    }
  };

  const handleDeleteLead = async () => {
    if (lead && onLeadDelete) {
      await onLeadDelete(lead.id);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!lead || !batch) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#94a3b8',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        Select a lead to view details
      </div>
    );
  }

  const currentIndex = allLeads.findIndex(l => l.id === lead.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLeads.length - 1;

  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '32px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Breadcrumb & Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
          <span>{batch.label}</span>
          <span>›</span>
          <span style={{ color: '#e2e8f0' }}>{lead.company || lead.domain}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate?.('prev')}
            disabled={!hasPrev}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: hasPrev ? '#e2e8f0' : '#64748b',
              cursor: hasPrev ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          <span style={{ color: '#94a3b8', fontSize: '13px', padding: '0 8px' }}>
            {currentIndex + 1} of {allLeads.length}
          </span>

          <button
            onClick={() => onNavigate?.('next')}
            disabled={!hasNext}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: hasNext ? '#e2e8f0' : '#64748b',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Lead Summary Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#e2e8f0',
              margin: '0 0 8px 0',
            }}>
              {lead.company || lead.domain}
            </h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontSize: '14px',
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {lead.industry}
                </span>
              )}
              {lead.emails && lead.emails.length > 0 && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}>
                  <Mail size={12} />
                  {lead.emails[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status & Tags Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
            Status
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['new', 'contacted', 'qualified', 'unqualified'] as LeadStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: leadStatus === status ? `2px solid ${getStatusColor(status)}` : '1px solid rgba(148, 163, 184, 0.1)',
                  background: leadStatus === status ? `${getStatusColor(status)}15` : 'rgba(255, 255, 255, 0.02)',
                  color: leadStatus === status ? getStatusColor(status) : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
            Tags
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
              >
                <TagIcon size={12} />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Tag name"
                  autoFocus
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddTag}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#021014',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTag('');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(148, 163, 184, 0.3)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TagIcon size={12} />
                Add Tag
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Icebreaker Section */}
      {lead.icebreaker && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#e2e8f0',
              margin: 0,
            }}>
              Icebreaker
            </h2>
            <button
              onClick={() => copyToClipboard(lead.icebreaker || '', 'Icebreaker')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: '1.6',
          }}>
            {lead.icebreaker}
          </div>
        </div>
      )}

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
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Send size={14} />
              Send Email
            </button>
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
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                Subject
              </label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Email subject"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 500,
          }}>
            Body
          </label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Message body"
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
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
        <button
          style={{
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={14} />
          Export (Coming Soon)
        </button>

        <button
          style={{
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Mail size={14} />
          Add to Sequence (Coming Soon)
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto',
          }}
        >
          <Trash2 size={14} />
          Delete Lead
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '18px' }}>
              Delete Lead?
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EmailComposer Modal */}
      {showEmailComposer && (
        <EmailComposer
          lead={{
            id: lead.id,
            company_name: lead.company || lead.domain || lead.website || 'Unknown',
            full_name: (lead as any).full_name || '',
            email: Array.isArray(lead.emails) && lead.emails.length > 0 ? lead.emails[0] : '',
            industry: lead.industry,
          }}
          onClose={() => setShowEmailComposer(false)}
          onSent={async () => {
            await handleStatusChange('contacted');
            onToast('Email sent successfully!');
            setShowEmailComposer(false);
          }}
        />
      )}
    </div>
  );
};