import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Batch {
  id: string;
  owner_user_id: string | null;
  label: string;
  created_at: string;
  status: 'pending' | 'processing' | 'complete';
  total_urls: number;
  processed_urls: number;
  channel?: string;
  subject_template?: string;
  message_template?: string;
}

export const useBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();

    const channel = supabase
      .channel('batches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches',
        },
        (payload) => {
          console.log('Realtime batch event:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            setBatches((prev) => [payload.new as Batch, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setBatches((prev) =>
              prev.map((b) => (b.id === payload.new.id ? (payload.new as Batch) : b))
            );
          } else if (payload.eventType === 'DELETE') {
            setBatches((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchBatches = async () => {
    try {
      console.log('Fetching batches...');
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batches:', error);
        throw error;
      }

      console.log('Batches fetched:', data);
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches (caught):', error);
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (batchData: {
    label: string;
    total_urls: number;
    channel?: string;
    subject_template?: string;
    message_template?: string;
  }) => {
    try {
      console.log('Creating batch with data:', batchData);

      const { data, error } = await supabase
        .from('batches')
        .insert({
          label: batchData.label,
          status: 'pending' as const,
          total_urls: batchData.total_urls,
          processed_urls: 0,
          channel: batchData.channel || 'dm',
          subject_template: batchData.subject_template,
          message_template: batchData.message_template,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Batch created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating batch (caught):', error);
      if (error && typeof error === 'object') {
        console.error('Error object:', JSON.stringify(error, null, 2));
      }
      return { data: null, error };
    }
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error updating batch:', error);
      return { error };
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      console.log('Deleting batch:', id);
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting batch:', error);
        throw error;
      }

      console.log('Batch deleted successfully');
      
      // Manually remove from state (don't wait for realtime)
      setBatches((prev) => prev.filter((b) => b.id !== id));
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting batch (caught):', error);
      return { error };
    }
  };

  return {
    batches,
    loading,
    createBatch,
    updateBatch,
    deleteBatch,
    refreshBatches: fetchBatches,
  };
};