// ---- Auth Types ----

export interface User {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

// ---- Receipt Types ----

export interface LineItem {
  name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface ReceiptResult {
  id: string;
  receipt_file_id: string;
  vendor_name: string | null;
  vendor_address: string | null;
  receipt_number: string | null;
  transaction_date: string | null;
  transaction_time: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  payment_method: string | null;
  line_items: LineItem[];
  raw_text: string | null;
  confidence: number | null;
  parsing_notes: string | null;
  created_at: string;
}

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReceiptFile {
  id: string;
  batch_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: FileStatus;
  error_message: string | null;
  result: ReceiptResult | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptBatch {
  id: string;
  user_id: string;
  name: string | null;
  file_count: number;
  completed_count: number;
  failed_count: number;
  status: FileStatus;
  files: ReceiptFile[];
  created_at: string;
  updated_at: string;
}

// ---- API Key Types ----

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string; // Full key shown only once
  key_prefix: string;
  created_at: string;
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  total_receipts: number;
  processed: number;
  pending: number;
  failed: number;
}
