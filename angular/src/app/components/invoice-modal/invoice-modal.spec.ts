import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceModalComponent } from './invoice-modal';

describe('InvoiceModalComponent', () => {
  let component: InvoiceModalComponent;
  let fixture: ComponentFixture<InvoiceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
