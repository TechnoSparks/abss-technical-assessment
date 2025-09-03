import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InvoiceListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Invoice Management System');
}
