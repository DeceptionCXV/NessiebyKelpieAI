import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SuccessfulScrape } from '../types/nessie';

export const useLeads = (batchId: string | null) => {
  const [leads, setLeads] = useState<SuccessfulScrape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) {
      console.log('[useLeads] No batchId provided, clearing leads');
      setLeads([]);
      setLoading(false);
      return;
    }

    console.log('[useLeads] Loading leads for batch:', batchId);
    fetchLeads();

    const channel = supabase
      .channel(`leads-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'successful_scrapes',
          filter: `batch_uuid=eq.${batchId}`,
        },
        (payload) => {
          console.log('[useLeads] Realtime event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setLeads((prev) => [...prev, payload.new as SuccessfulScrape]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) =>
                l.id === payload.new.id ? (payload.new as SuccessfulScrape) : l
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [batchId]);

  const fetchLeads = async () => {
    if (!batchId) return;

    try {
      setLoading(true);
      console.log('[useLeads] Querying successful_scrapes for batch_uuid:', batchId);

      const { data, error } = await supabase
        .from('successful_scrapes')
        .select('*')
        .eq('batch_uuid', batchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useLeads] Query error:', error);
        throw error;
      }

      console.log('[useLeads] Leads loaded:', data?.length || 0, 'leads');
      setLeads(data || []);
    } catch (error) {
      console.error('[useLeads] Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    leads,
    loading,
    refreshLeads: fetchLeads,
  };
};
