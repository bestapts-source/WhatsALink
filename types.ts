export interface HistoryItem {
  id: string;
  number: string;
  rawText?: string;
  timestamp: number;
}

export interface ExtractionResult {
  phoneNumber: string;
  confidence: number;
  countryCodeDetected: boolean;
}