import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface FailedScrape {
  id: string;
  website: string;
  batch_id: string;
  batch_uuid: string;
  owner_user_id: string;
  error_code: string;
  error_message: string;
  attempts: number;
  status: 'failed' | 'wont-fix' | 'retrying';
  timestamp: string;
  last_updated: string;
}

export const useFailedScrapes = (batchId: string) => {
  const [failedScrapes, setFailedScrapes] = useState<FailedScrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (batchId) {
      fetchFailedScrapes();
      setupRealtimeSubscription();
    }
  }, [batchId]);

  const fetchFailedScrapes = async () => {
    try {
      const { data, error } = await supabase
        .from('failed_scrapes')
        .select('*')
        .eq('batch_uuid', batchId)
        .neq('status', 'wont-fix') // Don't show won't-fix by default
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setFailedScrapes(data || []);
    } catch (error) {
      console.error('Error fetching failed scrapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`failed-scrapes-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'failed_scrapes',
          filter: `batch_uuid=eq.${batchId}`,
        },
        (payload) => {
          console.log('Failed scrape realtime event:', payload);
          
          if (payload.eventType === 'INSERT') {
            setFailedScrapes((prev) => [payload.new as FailedScrape, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setFailedScrapes((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as FailedScrape) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setFailedScrapes((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // Retry a single URL
  const retryUrl = async (scrapeId: string) => {
    try {
      const scrape = failedScrapes.find((s) => s.id === scrapeId);
      if (!scrape) return { error: 'Scrape not found' };

      // Update status to retrying
      await supabase
        .from('failed_scrapes')
        .update({ status: 'retrying' })
        .eq('id', scrapeId);

      // Get webhook secret
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Send to Make.com for retry (single URL)
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [scrape.website],
          user_id: user.id,
          batch_id: scrape.batch_uuid,
          webhook_secret: webhookSecret,
          is_retry: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook failed');
      }

      return { error: null };
    } catch (error) {
      console.error('Error retrying URL:', error);
      
      // Reset status back to failed
      await supabase
        .from('failed_scrapes')
        .update({ status: 'failed' })
        .eq('id', scrapeId);
      
      return { error };
    }
  };

  // Retry all failed scrapes - creates new batch
  const retryAll = async (customLabel?: string) => {
    try {
      const urls = failedScrapes
        .filter((s) => s.status === 'failed')
        .map((s) => s.website);

      if (urls.length === 0) {
        return { error: 'No failed scrapes to retry' };
      }

      // Create new batch for retries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const batchLabel = customLabel || `Retry - ${new Date().toLocaleString()}`;

      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          label: batchLabel,
          status: 'pending',
          total_urls: urls.length,
          processed_urls: 0,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Send to Make.com
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          user_id: user.id,
          batch_id: newBatch.id,
          webhook_secret: webhookSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook failed');
      }

      // Mark all as retrying
      await supabase
        .from('failed_scrapes')
        .update({ status: 'retrying' })
        .eq('batch_uuid', batchId)
        .eq('status', 'failed');

      return { data: newBatch, error: null };
    } catch (error) {
      console.error('Error retrying all:', error);
      return { data: null, error };
    }
  };

  // Mark a single scrape as won't fix
  const markWontFix = async (scrapeId: string) => {
    try {
      const { error } = await supabase
        .from('failed_scrapes')
        .update({ status: 'wont-fix' })
        .eq('id', scrapeId);

      if (error) throw error;
      
      // Remove from UI (we filter out wont-fix)
      setFailedScrapes((prev) => prev.filter((s) => s.id !== scrapeId));
      
      return { error: null };
    } catch (error) {
      console.error('Error marking as wont fix:', error);
      return { error };
    }
  };

  // Mark all selected as won't fix
  const markSelectedWontFix = async () => {
    try {
      const { error } = await supabase
        .from('failed_scrapes')
        .update({ status: 'wont-fix' })
        .in('id', selectedIds);

      if (error) throw error;
      
      // Remove from UI
      setFailedScrapes((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      
      return { error: null };
    } catch (error) {
      console.error('Error marking selected as wont fix:', error);
      return { error };
    }
  };

  // Retry all selected
  const retrySelected = async () => {
    try {
      const scrapes = failedScrapes.filter((s) => selectedIds.includes(s.id));
      const urls = scrapes.map((s) => s.website);

      if (urls.length === 0) {
        return { error: 'No scrapes selected' };
      }

      // Mark as retrying
      await supabase
        .from('failed_scrapes')
        .update({ status: 'retrying' })
        .in('id', selectedIds);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Send to Make.com (will go back to same batch)
      const webhookSecret = import.meta.env.VITE_MAKE_WEBHOOK_SECRET || 'h3Q9tZVfA2nL0cW7RmPpB8sKxY4uD1eT';
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          user_id: user.id,
          batch_id: batchId,
          webhook_secret: webhookSecret,
          is_retry: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook failed');
      }

      setSelectedIds([]);
      return { error: null };
    } catch (error) {
      console.error('Error retrying selected:', error);
      
      // Reset status
      await supabase
        .from('failed_scrapes')
        .update({ status: 'failed' })
        .in('id', selectedIds);
      
      return { error };
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(failedScrapes.map((s) => s.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds([]);
  };

  return {
    failedScrapes,
    loading,
    selectedIds,
    retryUrl,
    retryAll,
    retrySelected,
    markWontFix,
    markSelectedWontFix,
    toggleSelect,
    selectAll,
    clearSelection,
    refreshFailedScrapes: fetchFailedScrapes,
  };
};