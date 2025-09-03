import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Invoice, InvoiceListResponse } from '../interfaces/invoice.interface';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api';

  getInvoices(filters?: {
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Observable<InvoiceListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.customer_name) params = params.set('customer_name', filters.customer_name);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
    }

    return this.http.get<InvoiceListResponse>(`${this.baseUrl}/invoices`, { params });
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    // Transform the invoice data to match the API structure
    const updateData = {
      number: invoice.number,
      date: invoice.date,
      reference: invoice.reference,
      customer_name: invoice.customer_name,
      items: invoice.invoice_items.map(item => ({
        product_name: item.product_name,
        unit_price: parseFloat(item.unit_price),
        quantity: item.quantity
      }))
    };

    return this.http.put<any>(`${this.baseUrl}/invoices/${id}`, updateData).pipe(
      // Extract the invoice data from the response
      map((response: any) => response.data)
    );
  }

  checkInvoiceNumberExists(number: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams();
    if (excludeId) {
      params = params.set('exclude_id', excludeId.toString());
    }

    return this.http.get<InvoiceListResponse>(`${this.baseUrl}/invoices`, {
      params: params.set('per_page', '1')
    }).pipe(
      map((response: InvoiceListResponse) => {
        return response.data.some(invoice =>
          invoice.number === number && (!excludeId || invoice.id !== excludeId)
        );
      })
    );
  }

  searchInvoices(searchTerm: string): Observable<Invoice[]> {
    const params = new HttpParams().set('q', searchTerm);
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices/search`, { params });
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/invoices/${id}`);
  }
}
