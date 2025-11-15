import { useState, useMemo } from 'react';
import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { BatchCard } from './BatchCard';
import { Search } from 'lucide-react';

interface SidebarProps {
  batches: Batch[];
  leadsByBatch: Record<string, SuccessfulScrape[]>;
  activeBatchId: string | null;
  activeLeadId: string | null;
  onBatchClick: (batchId: string) => void;
  onLeadClick: (leadId: string, batchId: string) => void;
  onToast: (message: string) => void;
  onCreateNewBatch: () => void;
}

export const Sidebar = ({
  batches,
  leadsByBatch,
  activeBatchId,
  activeLeadId,
  onBatchClick,
  onLeadClick,
  onToast,
  onCreateNewBatch,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  console.log('Sidebar rendering with batches:', batches);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToast(isCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed');
  };

  const handleBatchToggle = (batchId: string) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const handleLeadClickWithExpand = (leadId: string) => {
    const batchId = batches.find(b =>
      (leadsByBatch[b.id] || []).some(l => l.id === leadId)
    )?.id;

    if (batchId && !expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }

    if (batchId) {
      onLeadClick(leadId, batchId);
    }
  };

  const handleBatchClickWithExpand = (batchId: string) => {
    if (!expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }
    onBatchClick(batchId);
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return batches;
    }

    const query = searchQuery.toLowerCase().trim();

    return batches.filter((batch) => {
      if (batch.label.toLowerCase().includes(query)) {
        return true;
      }

      const leads = leadsByBatch[batch.id] || [];
      return leads.some((lead) => {
        const websiteMatch = lead.website?.toLowerCase().includes(query);
        const domainMatch = lead.domain?.toLowerCase().includes(query);
        const companyMatch = lead.company?.toLowerCase().includes(query);
        const industryMatch = lead.industry?.toLowerCase().includes(query);

        const emailsArray = Array.isArray(lead.emails) ? lead.emails : [];
        const emailMatch = emailsArray.some((email: string) =>
          email.toLowerCase().includes(query)
        );

        return websiteMatch || domainMatch || companyMatch || industryMatch || emailMatch;
      });
    });
  }, [batches, leadsByBatch, searchQuery]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Batches</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="sidebar-toggle"
            onClick={() => {
              onCreateNewBatch();
              onToast('Create a new batch');
            }}
            title="Create new batch"
            style={{ background: 'var(--accent)', color: '#021014', fontWeight: 600 }}
          >
            +
          </button>
          <button
            className="sidebar-toggle"
            onClick={handleToggle}
            title="Collapse sidebar"
          >
            ☰
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search batches, websites, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
        </div>
      </div>

      <div className="batch-list">
        {batches.length === 0 ? (
          <div className="empty-sidebar">
            No batches yet. Create a batch on the right to let Nessie hunt.
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-sidebar">
            No results found for "{searchQuery}"
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              leads={leadsByBatch[batch.id] || []}
              isActive={batch.id === activeBatchId}
              isExpanded={expandedBatches.has(batch.id)}
              activeLeadId={activeLeadId}
              onClick={() => handleBatchClickWithExpand(batch.id)}
              onToggleExpand={() => handleBatchToggle(batch.id)}
              onLeadClick={(leadId) => handleLeadClickWithExpand(leadId)}
            />
          ))
        )}
      </div>
    </aside>
  );
};
