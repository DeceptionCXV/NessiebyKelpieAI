import { useState, useEffect } from 'react';
import { TopBar } from '../components/nessie/TopBar';
import { Sidebar } from '../components/nessie/Sidebar';
import { TabBar } from '../components/nessie/TabBar';
import { CreateBatchForm } from '../components/nessie/CreateBatchForm';
import { LeadDetail } from '../components/nessie/LeadDetail';
import { NotesPanel } from '../components/nessie/NotesPanel';
import { Toast } from '../components/nessie/Toast';
import { AnalyticsPage } from './AnalyticsPage';
import { useBatches } from '../hooks/useBatches';
import { useLeads } from '../hooks/useLeads';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { SuccessfulScrape } from '../types/nessie';
import '../styles/nessie.css';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

export const NessieQueue = () => {
  const [activeView, setActiveView] = useState('Queue');
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<LeadTab[]>([]);
  const [leadsByBatch, setLeadsByBatch] = useState<Record<string, SuccessfulScrape[]>>({});
  const [loadingLead, setLoadingLead] = useState(false);

  const { batches, createBatch, updateBatch, deleteBatch, refreshBatches } = useBatches();
  const { leads } = useLeads(activeBatchId);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    if (activeBatchId && leads) {
      console.log('[NessieQueue] Updating leadsByBatch cache. Batch:', activeBatchId, 'Leads count:', leads.length);
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: leads,
      }));
    }
  }, [activeBatchId, leads]);

  useEffect(() => {
    if (batches.length > 0 && !activeBatchId) {
      setShowCreateForm(false);
    }
  }, [batches, activeBatchId]);

  const handleCreateNewBatch = () => {
    setShowCreateForm(true);
    setActiveBatchId(null);
    setActiveLeadId(null);
  };

  const handleDeleteBatch = async () => {
    if (!activeBatchId) return;

    const { error } = await deleteBatch(activeBatchId);
    if (error) {
      showToast('Failed to delete batch');
      return;
    }

    setActiveBatchId(null);
    setActiveLeadId(null);
    setShowCreateForm(batches.length <= 1);

    await refreshBatches();
    showToast('Batch deleted');
  };

  useKeyboardShortcuts({
    onCreateBatch: () => {
      handleCreateNewBatch();
      showToast('Create a new batch');
    },
    onSaveNotes: () => {
      if (activeLeadId) {
        showToast('Note saved');
      }
    },
    onNavigateUp: () => {
      if (activeBatchId) {
        const currentLeads = leadsByBatch[activeBatchId] || [];
        const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);
        if (currentIndex > 0) {
          openLead(currentLeads[currentIndex - 1], activeBatchId);
        }
      }
    },
    onNavigateDown: () => {
      if (activeBatchId) {
        const currentLeads = leadsByBatch[activeBatchId] || [];
        const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);
        if (currentIndex < currentLeads.length - 1 && currentIndex !== -1) {
          openLead(currentLeads[currentIndex + 1], activeBatchId);
        }
      }
    },
    onDeleteBatch: handleDeleteBatch,
  });

  const handleBatchSubmit = async (data: {
    batchName: string;
    urls: string[];
  }) => {
    console.log('handleBatchSubmit called with:', data);

    const { data: batch, error } = await createBatch({
      label: data.batchName,
      total_urls: data.urls.length,
    });

    if (error || !batch) {
      console.error('Failed to create batch. Error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Unknown error';
      showToast(`Error creating batch: ${errorMessage}`);
      return;
    }

    console.log('Batch created successfully:', batch);

    await refreshBatches();
    console.log('[NessieQueue] Batches list refreshed after creation');

    showToast(`Batch created! Nessie is processing ${data.urls.length} leads...`);

    const makeWebhookUrl = import.meta.env.VITE_MAKE_BATCH_WEBHOOK_URL;
    console.log('Webhook URL from env:', makeWebhookUrl);

    if (makeWebhookUrl) {
      try {
        const normalizedUrls = data.urls.map(url => {
          const trimmedUrl = url.trim();
          if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://')) {
            return trimmedUrl;
          }
          return `https://${trimmedUrl}`;
        });

        console.log('Sending webhook to Make.com:', {
          batch_id: batch.id,
          urls: normalizedUrls,
          label: data.batchName,
        });

        const webhookResponse = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: batch.id,
            batch_uuid: batch.id,
            urls: normalizedUrls,
            label: data.batchName,
          }),
        });

        console.log('Webhook response status:', webhookResponse.status);
        const responseText = await webhookResponse.text();
        console.log('Webhook response body:', responseText);

        if (webhookResponse.ok) {
          console.log('Webhook sent successfully, updating batch status to processing');
          await updateBatch(batch.id, { status: 'processing' });
        } else {
          console.error('Webhook failed with status:', webhookResponse.status);
          showToast(`Webhook error: ${webhookResponse.status}`);
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
        showToast('Failed to send webhook to Make.com');
      }
    } else {
      console.warn('VITE_MAKE_BATCH_WEBHOOK_URL not configured in .env');
      showToast('Webhook URL not configured');
    }

    setShowCreateForm(false);
    setActiveBatchId(batch.id);
  };

  const handleBatchClick = (batchId: string) => {
    console.log('[NessieQueue] Batch clicked:', batchId);
    setActiveBatchId(batchId);
    setShowCreateForm(false);
    console.log('[NessieQueue] Switched to batch view, hiding create form');

    const batchLeads = leadsByBatch[batchId] || [];
    console.log('[NessieQueue] Leads in cache for batch:', batchLeads.length);

    if (batchLeads.length > 0) {
      if (!batchLeads.find((l) => l.id === activeLeadId)) {
        console.log('[NessieQueue] Opening first lead from batch');
        openLead(batchLeads[0], batchId);
      }
    } else {
      console.log('[NessieQueue] No leads in cache, clearing active lead');
      setActiveLeadId(null);
    }
  };

  const handleLeadClick = (leadId: string, batchId: string) => {
    const lead = leadsByBatch[batchId]?.find((l) => l.id === leadId);
    if (lead) {
      openLead(lead, batchId);
    }
  };

  const openLead = (lead: SuccessfulScrape, batchId: string) => {
    setLoadingLead(true);
    setActiveLeadId(lead.id);
    setActiveBatchId(batchId);

    const existingTab = openTabs.find((t) => t.leadId === lead.id);
    if (!existingTab) {
      setOpenTabs((prev) => [...prev, { leadId: lead.id, lead }]);
    }

    setTimeout(() => {
      setLoadingLead(false);
    }, 200);
  };

  const handleTabClose = (leadId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.leadId !== leadId));

    if (activeLeadId === leadId) {
      const remainingTabs = openTabs.filter((t) => t.leadId !== leadId);
      if (remainingTabs.length > 0) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        setActiveLeadId(lastTab.leadId);
      } else {
        setActiveLeadId(null);
      }
    }
  };

  const currentLead = activeLeadId
    ? Object.values(leadsByBatch)
        .flat()
        .find((l) => l.id === activeLeadId)
    : null;

  const currentBatch = batches.find((b) => b.id === activeBatchId);

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        onCreateNewBatch={handleCreateNewBatch}
      />

      {activeView === 'Analytics' ? (
        <AnalyticsPage
          onNavigateToBatch={(batchId) => {
            setActiveView('Queue');
            handleBatchClick(batchId);
          }}
        />
      ) : activeView === 'Settings' ? (
        <div style={{ padding: '40px', color: 'var(--text)' }}>
          <div style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', marginBottom: '32px', fontWeight: 600 }}>
            Settings
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Settings page coming soon...</div>
        </div>
      ) : (
        <div className="layout">
          <Sidebar
            batches={batches}
            leadsByBatch={leadsByBatch}
            activeBatchId={activeBatchId}
            activeLeadId={activeLeadId}
            onBatchClick={handleBatchClick}
            onLeadClick={handleLeadClick}
            onToast={showToast}
            onCreateNewBatch={handleCreateNewBatch}
            onRefreshBatches={refreshBatches}
            onDeleteBatch={handleDeleteBatch}
          />

          <main className="main">
            <TabBar
              tabs={openTabs}
              activeLeadId={activeLeadId}
              onTabClick={(leadId) => {
                setActiveLeadId(leadId);
                setLoadingLead(true);
                setTimeout(() => setLoadingLead(false), 150);
              }}
              onTabClose={handleTabClose}
            />

            <div className="content">
              <section className="content-main">
                {showCreateForm ? (
                  <CreateBatchForm
                    onSubmit={handleBatchSubmit}
                    onToast={showToast}
                  />
                ) : (
                  <LeadDetail
                    lead={currentLead}
                    batch={currentBatch || null}
                    loading={loadingLead}
                    onToast={showToast}
                  />
                )}
              </section>

              {!showCreateForm && currentLead && (
                <NotesPanel
                  lead={currentLead}
                  onSave={() => {}}
                  onToast={showToast}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
