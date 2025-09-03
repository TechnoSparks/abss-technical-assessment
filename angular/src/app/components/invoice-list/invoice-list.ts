import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice';
import { Invoice, InvoiceListResponse } from '../../interfaces/invoice.interface';
import { InvoiceModalComponent } from '../invoice-modal/invoice-modal';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, InvoiceModalComponent, FormsModule],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css'
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  searchLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalInvoices = signal(0);

  // Modal state
  isModalOpen = signal(false);
  selectedInvoice = signal<Invoice | null>(null);
  modalMode = signal<'view' | 'edit'>('view');

  // Sorting state
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Search state
  searchInput = signal<string>(''); // What user is typing
  searchTerm = signal<string>(''); // What we're actually searching for
  filteredInvoices = signal<Invoice[]>([]);

  // Set up reactive filtering when search term changes
  private readonly searchEffect = effect(() => {
    const search = this.searchTerm().toLowerCase().trim();

    // Only search if there's a search term, otherwise filteredInvoices is not used
    if (search) {
      this.performSearch(search);
    } else if (this.sortColumn()) {
      // When no search, apply sorting to original invoices if there's active sorting
      this.applySortingToOriginal();
    }
  });

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices(page: number = 1) {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService.getInvoices({ page, per_page: 10 }).subscribe({
      next: (response: InvoiceListResponse) => {
        this.invoices.set(response.data);
        this.currentPage.set(response.current_page);
        this.totalPages.set(response.last_page);
        this.totalInvoices.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load invoices. Please try again.');
        this.loading.set(false);
        console.error('Error loading invoices:', err);
      }
    });
  }

  performSearch(search: string): void {
    this.searchLoading.set(true);
    this.invoiceService.searchInvoices(search).subscribe({
      next: (results: Invoice[]) => {
        this.filteredInvoices.set(results);
        this.searchLoading.set(false);

        // Apply current sorting to filtered results if there's active sorting
        if (this.sortColumn()) {
          this.applySortingToFiltered();
        }
      },
      error: (err) => {
        this.error.set('Failed to search invoices. Please try again.');
        this.searchLoading.set(false);
        console.error('Error searching invoices:', err);
      }
    });
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchInput.set(target.value);
  }

  onSearchSubmit() {
    const searchValue = this.searchInput().trim();
    this.searchTerm.set(searchValue);

    // Clear search if empty
    if (!searchValue) {
      this.filteredInvoices.set([]);
    }
  }

  onClearSearch() {
    this.searchInput.set('');
    this.searchTerm.set('');
    this.filteredInvoices.set([]);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadInvoices(page);
    }
  }

  getTotalAmount(invoice: Invoice): number {
    return invoice.invoice_items.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
  }

  openViewModal(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.modalMode.set('view');
    this.isModalOpen.set(true);
  }

  openEditModal(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.modalMode.set('edit');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedInvoice.set(null);
  }

  onSaveInvoice(updatedInvoice: Invoice) {
    // Update the invoice in the current page list
    const currentInvoices = this.invoices();
    const index = currentInvoices.findIndex(inv => inv.id === updatedInvoice.id);
    if (index !== -1) {
      const updatedInvoices = [...currentInvoices];
      updatedInvoices[index] = updatedInvoice;
      this.invoices.set(updatedInvoices);
    }

    // If search is active, refresh search results
    if (this.searchTerm()) {
      this.performSearch(this.searchTerm());
    }
  }

  deleteInvoice(invoice: Invoice) {
    const confirmDelete = confirm(`Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`);

    if (!confirmDelete) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        // Remove the invoice from the current page list
        const currentInvoices = this.invoices();
        const updatedInvoices = currentInvoices.filter(inv => inv.id !== invoice.id);
        this.invoices.set(updatedInvoices);

        // Update total count
        this.totalInvoices.set(this.totalInvoices() - 1);

        this.loading.set(false);

        // Show success message
        this.successMessage.set(`Invoice ${invoice.number} has been deleted successfully.`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);

        // If search is active, refresh search results
        if (this.searchTerm()) {
          this.performSearch(this.searchTerm());
        } else if (updatedInvoices.length === 0 && this.currentPage() > 1) {
          // If this was the last item on the page and we're not on page 1, go back a page
          this.onPageChange(this.currentPage() - 1);
        }
      },
      error: (err) => {
        this.error.set('Failed to delete invoice. Please try again.');
        this.loading.set(false);
        console.error('Error deleting invoice:', err);
      }
    });
  }

  sortBy(column: string) {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();

    // Toggle direction if clicking the same column, otherwise set to 'asc'
    if (currentColumn === column) {
      this.sortDirection.set(currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    // Apply sorting based on whether there's a search term
    if (this.searchTerm()) {
      this.applySortingToFiltered();
    } else {
      this.applySortingToOriginal();
    }
  }

  private applySortingToOriginal() {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const currentInvoices = [...this.invoices()];

    currentInvoices.sort((a, b) => {
      return this.compareInvoices(a, b, column, direction);
    });

    this.invoices.set(currentInvoices);
  }

  private applySortingToFiltered() {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const currentFiltered = [...this.filteredInvoices()];

    currentFiltered.sort((a, b) => {
      return this.compareInvoices(a, b, column, direction);
    });

    this.filteredInvoices.set(currentFiltered);
  }

  private compareInvoices(a: Invoice, b: Invoice, column: string, direction: 'asc' | 'desc'): number {
    let valueA: any;
    let valueB: any;

    switch (column) {
      case 'number':
        valueA = a.number.toLowerCase();
        valueB = b.number.toLowerCase();
        break;
      case 'date':
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case 'customer':
        valueA = a.customer_name.toLowerCase();
        valueB = b.customer_name.toLowerCase();
        break;
      case 'reference':
        valueA = a.reference?.toLowerCase() || '';
        valueB = b.reference?.toLowerCase() || '';
        break;
      case 'items':
        valueA = a.invoice_items.length;
        valueB = b.invoice_items.length;
        break;
      case 'total':
        valueA = this.getTotalAmount(a);
        valueB = this.getTotalAmount(b);
        break;
      default:
        return 0;
    }

    if (valueA < valueB) {
      return direction === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  }

  getSortIcon(column: string): string {
    const currentColumn = this.sortColumn();
    const direction = this.sortDirection();

    if (currentColumn !== column) {
      return '↕️'; // Both arrows when not sorted
    }

    return direction === 'asc' ? '↑' : '↓';
  }

  isSorted(column: string): boolean {
    return this.sortColumn() === column;
  }
}
