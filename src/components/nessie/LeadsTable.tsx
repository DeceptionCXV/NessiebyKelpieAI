import { useEffect, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Lead {
  id: string;
  website: string;
  domain: string | null;
  company: string | null;
  emails: string[];
  industry: string | null;
  icebreaker: string | null;
  batch_id: string;
  timestamp: string;
  status: string;
  created_at: string;
}

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'resolved'>('all');

  useEffect(() => {
    fetchLeads();
    
    // Real-time subscription for new leads
    const subscription = supabase
      .channel('successful_scrapes_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'successful_scrapes' 
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const fetchLeads = async () => {
    let query = supabase
      .from('successful_scrapes')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    const headers = ['Company', 'Domain', 'Industry', 'Emails', 'Icebreaker', 'Status'];
    const rows = leads.map(lead => [
      lead.company || '',
      lead.domain || '',
      lead.industry || '',
      (lead.emails || []).join('; '),
      lead.icebreaker || '',
      lead.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nessie-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kelpie-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-kelpie-600 to-kelpie-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Lead Results</h1>
              <p className="text-kelpie-100 text-sm">
                {leads.length} {leads.length === 1 ? 'lead' : 'leads'} found
              </p>
            </div>
            
            {leads.length > 0 && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white text-kelpie-700 font-semibold rounded-xl hover:bg-kelpie-50 transition-colors shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download CSV
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-kelpie-700'
                  : 'bg-kelpie-700 text-white hover:bg-kelpie-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'success'
                  ? 'bg-white text-kelpie-700'
                  : 'bg-kelpie-700 text-white hover:bg-kelpie-800'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-white text-kelpie-700'
                  : 'bg-kelpie-700 text-white hover:bg-kelpie-800'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Table */}
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No leads yet. Upload some websites to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Company</th>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Domain</th>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Industry</th>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Emails</th>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Icebreaker</th>
                  <th className="text-left p-4 font-semibold text-gray-300 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="border-t border-gray-700 hover:bg-gray-750 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {lead.company || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-4">
                      {lead.domain ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-kelpie-400 hover:text-kelpie-300 inline-flex items-center gap-1 text-sm"
                        >
                          {lead.domain}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300 text-sm">
                        {lead.industry || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      {lead.emails && lead.emails.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {lead.emails.map((email, i) => (
                            <a
                              key={i}
                              href={`mailto:${email}`}
                              className="text-kelpie-400 hover:text-kelpie-300 text-sm"
                            >
                              {email}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No emails found</span>
                      )}
                    </td>
                    <td className="p-4 max-w-md">
                      {lead.icebreaker ? (
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {lead.icebreaker}
                        </p>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'success'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
