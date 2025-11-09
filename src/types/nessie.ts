export type FailedScrapeStatus = 'failed' | 'retrying' | 'resolved';
export type SuccessfulScrapeStatus = 'success' | 'resolved';

export interface FailedScrape {
  id: string;
  website: string;
  batch_id: string;
  timestamp: string;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  status: FailedScrapeStatus;
  last_updated: string;
  created_at: string;
}

export interface ScrapeFailedPayload {
  event: 'scrape_failed';
  source: string;
  timestamp: string;
  website: string;
  error_code: string | number;
  error_message: string;
  batch_id: string;
  attempt?: number;
}

export interface ScrapeResolvedPayload {
  website: string;
  batch_id: string;
}

export interface RetryPayload {
  website: string;
  batch_id: string;
}

export interface MakeRetryPayload {
  trigger: 'retry_single';
  website: string;
  batch_id: string;
  source: 'nessie_ui';
}

export interface SuccessfulScrape {
  id: string;
  website: string;
  batch_id: string;
  timestamp: string;
  status: SuccessfulScrapeStatus;
  created_at: string;
}

export interface ScrapeSuccessPayload {
  website: string;
  batch_id: string;
  timestamp?: string;
}
