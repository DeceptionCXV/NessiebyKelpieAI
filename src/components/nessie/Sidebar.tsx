import { useState, useMemo } from 'react';
import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { BatchCard } from './BatchCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

interface SidebarProps {
  batches: Batch[];
  leadsByBatch: Record<string, SuccessfulScrape[]>;
  activeBatchId: string | null;
  activeLeadId: string | null;
  onBatchClick: (batchId: string) => void;
  onLeadClick: (leadId: string, batchId: string) => void;
  onToast: (message: string) => void;
  onCreateNewBatch: () => void;
  onRefreshBatches: () => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
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
  onRefreshBatches,
  onDeleteBatch,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [lastSelectedBatchId, setLastSelectedBatchId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  console.log('Sidebar rendering with batches:', batches);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToast(isCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshBatches();
      onToast('Batches refreshed');
    } catch (error) {
      onToast('Failed to refresh batches');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteClick = () => {
    if (!activeBatchId) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeBatchId) return;
    setShowDeleteDialog(false);
    try {
      await onDeleteBatch(activeBatchId);
      onToast('Batch deleted');
    } catch (error) {
      onToast('Failed to delete batch');
    }
  };

  const activeBatch = batches.find((b) => b.id === activeBatchId);
  const leadCount = activeBatch ? (leadsByBatch[activeBatch.id] || []).length : 0;

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

  // NEW: Multi-select handlers
  const handleBatchSelect = (batchId: string, event: React.MouseEvent) => {
  event.stopPropagation();
  event.preventDefault(); // Prevent text selection on shift+click
  
  if (event.shiftKey && lastSelectedBatchId) {
    // Range selection
    const currentIndex = filteredBatches.findIndex(b => b.id === batchId);
    const lastIndex = filteredBatches.findIndex(b => b.id === lastSelectedBatchId);
    const start = Math.min(currentIndex, lastIndex);
    const end = Math.max(currentIndex, lastIndex);
    
    const newSelected = new Set(selectedBatchIds);
    for (let i = start; i <= end; i++) {
      newSelected.add(filteredBatches[i].id);
    }
    setSelectedBatchIds(newSelected);
  } else if (event.metaKey || event.ctrlKey) {
    // Toggle individual
    const newSelected = new Set(selectedBatchIds);
    if (newSelected.has(batchId)) {
      newSelected.delete(batchId);
    } else {
      newSelected.add(batchId);
    }
    setSelectedBatchIds(newSelected);
    setLastSelectedBatchId(batchId);
  } else {
    // Single click on checkbox - toggle this one
    const newSelected = new Set(selectedBatchIds);
    if (newSelected.has(batchId)) {
      newSelected.delete(batchId);
    } else {
      newSelected.add(batchId);
    }
    setSelectedBatchIds(newSelected);
    setLastSelectedBatchId(batchId);
  }
};
    
    setLastSelectedBatchId(batchId);
  };

  const handleDeselectAll = () => {
    setSelectedBatchIds(new Set());
    setSelectedLeadIds(new Set());
    setLastSelectedBatchId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedBatchIds.size === 0) return;
    
    const confirmMessage = `Delete ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      // Delete all selected batches
      for (const batchId of selectedBatchIds) {
        await onDeleteBatch(batchId);
      }
      onToast(`${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''} deleted`);
      handleDeselectAll();
    } catch (error) {
      onToast('Failed to delete batches');
    }
  };

  const handleBulkExport = () => {
    if (selectedBatchIds.size === 0) return;
    
    // Collect all leads from selected batches
    const allLeads: SuccessfulScrape[] = [];
    selectedBatchIds.forEach(batchId => {
      const leads = leadsByBatch[batchId] || [];
      allLeads.push(...leads);
    });
    
    // Create CSV
    const headers = ['Company', 'Website', 'Industry', 'Emails', 'Batch'];
    const rows = allLeads.map(lead => [
      lead.company || '',
      lead.website || '',
      lead.industry || '',
      (lead.emails || []).join('; '),
      batches.find(b => b.id === lead.batch_id)?.label || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nessie-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    onToast(`Exported ${allLeads.length} leads from ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}`);
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
            onClick={handleRefresh}
            title="Refresh batches"
            disabled={isRefreshing}
            style={{
              opacity: isRefreshing ? 0.5 : 1,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            className="sidebar-toggle"
            onClick={handleDeleteClick}
            title="Delete batch (Del)"
            disabled={!activeBatchId}
            style={{
              opacity: !activeBatchId ? 0.3 : 1,
              cursor: !activeBatchId ? 'not-allowed' : 'pointer',
            }}
          >
            <Trash2 size={14} />
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

      {/* NEW: Bulk Actions Bar */}
      {selectedBatchIds.size > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(20, 184, 166, 0.1)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '8px',
          margin: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--accent)',
          }}>
            {selectedBatchIds.size} batch{selectedBatchIds.size > 1 ? 'es' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkExport}
              style={{
                padding: '6px 12px',
                background: 'var(--accent)',
                color: '#021014',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'rgb(239, 68, 68)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              Delete
            </button>
            <button
              onClick={handleDeselectAll}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              isSelected={selectedBatchIds.has(batch.id)}
              activeLeadId={activeLeadId}
              onClick={() => handleBatchClickWithExpand(batch.id)}
              onToggleExpand={() => handleBatchToggle(batch.id)}
              onLeadClick={(leadId) => handleLeadClickWithExpand(leadId)}
              onSelect={(e) => handleBatchSelect(batch.id, e)}
            />
          ))
        )}
      </div>

      {showDeleteDialog && activeBatch && (
        <ConfirmDialog
          title="Delete Batch"
          message={`Are you sure you want to delete this batch? This will also delete all ${leadCount} leads associated with it. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
};