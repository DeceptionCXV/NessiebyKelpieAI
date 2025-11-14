import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SuccessfulScrape } from '../types/nessie';

export const useLeads = (batchUuid: string | null) => {
  const [leads, setLeads] = useState<SuccessfulScrape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchUuid) {
      setLeads([]);
      setLoading(false);
      return;
    }

    fetchLeads();

    const channel = supabase
      .channel(`leads-${batchUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'successful_scrapes',
          filter: `batch_uuid=eq.${batchUuid}`,
        },
        (payload) => {
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
  }, [batchUuid]);

  const fetchLeads = async () => {
    if (!batchUuid) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('successful_scrapes')
        .select('*')
        .eq('batch_uuid', batchUuid)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
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
