export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  number: string;
  date: string;
  reference: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
  invoice_items: InvoiceItem[];
}

export interface InvoiceListResponse {
  current_page: number;
  data: Invoice[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
