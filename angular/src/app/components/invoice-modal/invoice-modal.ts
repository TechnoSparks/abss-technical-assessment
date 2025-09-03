import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceItem } from '../../interfaces/invoice.interface';
import { InvoiceService } from '../../services/invoice';

@Component({
  selector: 'app-invoice-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-modal.html',
  styleUrl: './invoice-modal.css'
})
export class InvoiceModalComponent implements OnInit, OnChanges {
  private readonly invoiceService = inject(InvoiceService);

  @Input() invoice: Invoice | null = null;
  @Input() isOpen = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveInvoice = new EventEmitter<Invoice>();

  editedInvoice = signal<Invoice | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.initializeEditedInvoice();
  }

  ngOnChanges() {
    this.initializeEditedInvoice();
  }

  private initializeEditedInvoice() {
    if (this.invoice) {
      const invoiceCopy = { ...this.invoice };

      // Format date for HTML5 date input (YYYY-MM-DD)
      if (invoiceCopy.date) {
        invoiceCopy.date = this.formatDateForInput(invoiceCopy.date);
      }

      this.editedInvoice.set(invoiceCopy);
      // Clear any previous messages when opening modal
      this.error.set(null);
      this.success.set(null);
    }
  }

  private formatDateForInput(dateString: string): string {
    // Handle different date formats that might come from the API
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return dateString; // Return original if invalid
    }

    // Format as YYYY-MM-DD for HTML5 date input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const formatted = `${year}-${month}-${day}`;

    // Debug logging (remove in production)
    if (dateString !== formatted) {
      console.log(`Date formatting: "${dateString}" -> "${formatted}"`);
    }

    return formatted;
  }

  onClose() {
    this.closeModal.emit();
  }

  onReset() {
    if (this.invoice) {
      const invoiceCopy = {
        ...this.invoice,
        invoice_items: this.invoice.invoice_items.map(item => ({ ...item }))
      };

      // Format date for HTML5 date input
      if (invoiceCopy.date) {
        invoiceCopy.date = this.formatDateForInput(invoiceCopy.date);
      }

      this.editedInvoice.set(invoiceCopy);
      // Clear any error/success messages and show reset feedback
      this.error.set(null);
      this.success.set('Changes have been reset to original values');

      // Clear the success message after a short delay
      setTimeout(() => {
        this.success.set(null);
      }, 2000);
    }
  }

  hasChanges(): boolean {
    const edited = this.editedInvoice();
    const original = this.invoice;

    if (!edited || !original) return false;

    // Check if basic invoice fields have changed
    if (edited.number !== original.number ||
        this.formatDateForInput(edited.date) !== this.formatDateForInput(original.date) ||
        edited.reference !== original.reference ||
        edited.customer_name !== original.customer_name) {
      return true;
    }

    // Check if invoice items have changed
    if (edited.invoice_items.length !== original.invoice_items.length) {
      return true;
    }

    // Check each item for changes
    for (let i = 0; i < edited.invoice_items.length; i++) {
      const editedItem = edited.invoice_items[i];
      const originalItem = original.invoice_items[i];

      if (editedItem.product_name !== originalItem.product_name ||
          editedItem.unit_price !== originalItem.unit_price ||
          editedItem.quantity !== originalItem.quantity) {
        return true;
      }
    }

    return false;
  }

  onSave() {
    const edited = this.editedInvoice();
    if (!edited) return;

    // Client-side validation
    if (!this.validateInvoice(edited)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.invoiceService.updateInvoice(edited.id, edited).subscribe({
      next: (updatedInvoice: Invoice) => {
        this.loading.set(false);
        this.success.set('Invoice updated successfully!');

        // Close modal after a brief delay to show success message
        setTimeout(() => {
          this.saveInvoice.emit(updatedInvoice);
          this.closeModal.emit();
        }, 1000);
      },
      error: (err: any) => {
        this.loading.set(false);

        // Handle validation errors from the API
        if (err.status === 422 && err.error?.errors) {
          const errors = err.error.errors;
          const errorMessages: string[] = [];

          // Handle specific validation errors with better messaging
          Object.keys(errors).forEach(field => {
            const fieldErrors = errors[field];
            fieldErrors.forEach((message: string) => {
              if (field === 'number' && message.includes('has already been taken')) {
                errorMessages.push('This invoice number already exists. Please use a different number.');
              } else {
                errorMessages.push(message);
              }
            });
          });

          this.error.set(errorMessages.join(' '));
        } else if (err.error?.message) {
          this.error.set(err.error.message);
        } else {
          this.error.set('Failed to save invoice. Please try again.');
        }
        console.error('Error saving invoice:', err);
      }
    });
  }

  private validateInvoice(invoice: Invoice): boolean {
    // Reset error and success states
    this.error.set(null);
    this.success.set(null);

    // Validate required fields
    if (!invoice.number?.trim()) {
      this.error.set('Invoice number is required');
      return false;
    }

    if (!invoice.date) {
      this.error.set('Invoice date is required');
      return false;
    }

    if (!invoice.customer_name?.trim()) {
      this.error.set('Customer name is required');
      return false;
    }

    // Validate items
    if (!invoice.invoice_items.length) {
      this.error.set('At least one invoice item is required');
      return false;
    }

    for (let i = 0; i < invoice.invoice_items.length; i++) {
      const item = invoice.invoice_items[i];

      if (!item.product_name?.trim()) {
        this.error.set(`Product name is required for item ${i + 1}`);
        return false;
      }

      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        this.error.set(`Valid unit price is required for item ${i + 1}`);
        return false;
      }

      if (!item.quantity || item.quantity <= 0) {
        this.error.set(`Valid quantity is required for item ${i + 1}`);
        return false;
      }
    }

    return true;
  }

  addItem() {
    const edited = this.editedInvoice();
    if (!edited) return;

    const newItem: InvoiceItem = {
      id: 0, // Will be assigned by backend
      invoice_id: edited.id,
      product_name: '',
      unit_price: '0.00',
      quantity: 1,
      total_amount: '0.00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.editedInvoice.set({
      ...edited,
      invoice_items: [...edited.invoice_items, newItem]
    });
  }

  removeItem(index: number) {
    const edited = this.editedInvoice();
    if (!edited) return;

    const items = [...edited.invoice_items];
    items.splice(index, 1);

    this.editedInvoice.set({
      ...edited,
      invoice_items: items
    });
  }

  updateItem(index: number, field: keyof InvoiceItem, value: any) {
    const edited = this.editedInvoice();
    if (!edited) return;

    const items = [...edited.invoice_items];
    const currentItem = { ...items[index] };

    // Type-safe assignment
    if (field === 'product_name') {
      currentItem.product_name = String(value);
    } else if (field === 'unit_price') {
      currentItem.unit_price = String(value);
    } else if (field === 'quantity') {
      currentItem.quantity = Number(value);
    }

    items[index] = currentItem;

    // Auto-calculate total amount when unit price or quantity changes
    if (field === 'unit_price' || field === 'quantity') {
      const unitPrice = parseFloat(currentItem.unit_price);
      const quantity = currentItem.quantity;
      currentItem.total_amount = (unitPrice * quantity).toFixed(2);
      items[index] = currentItem;
    }

    this.editedInvoice.set({
      ...edited,
      invoice_items: items
    });
  }

  getTotalAmount(): number {
    const edited = this.editedInvoice();
    if (!edited) return 0;

    return edited.invoice_items.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
  }

  isViewMode(): boolean {
    return this.mode === 'view';
  }

  isEditMode(): boolean {
    return this.mode === 'edit';
  }

  generateUniqueInvoiceNumber(): string {
    // Generate a simple unique invoice number based on timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-4); // last 4 digits of timestamp

    return `INV-${year}${month}${day}-${time}`;
  }

  suggestNewInvoiceNumber() {
    const edited = this.editedInvoice();
    if (!edited) return;

    const newNumber = this.generateUniqueInvoiceNumber();
    this.editedInvoice.set({
      ...edited,
      number: newNumber
    });

    // Clear any error messages
    this.error.set(null);
  }
}
