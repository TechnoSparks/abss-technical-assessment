# Invoice Management API

This API provides endpoints for managing invoices and their items.

## Base URL
```
/api
```

## Available Endpoints

1. **GET** `/invoices` - List invoices with pagination and filtering
2. **GET** `/invoices/{id}` - Get a specific invoice by ID
3. **GET** `/invoices/search` - Search invoices across multiple fields
4. **POST** `/invoices` - Create a new invoice
5. **PUT/PATCH** `/invoices/{id}` - Update an existing invoice
6. **DELETE** `/invoices/{id}` - Delete an invoice

## Endpoints

### 1. List Invoices
**GET** `/invoices`

Retrieve a paginated list of invoices with optional filtering.

#### Query Parameters (All Optional)
- `customer_name` (string): Filter invoices by customer name (partial match)
- `date_from` (date): Filter invoices from this date onwards (YYYY-MM-DD format)
- `date_to` (date): Filter invoices up to this date (YYYY-MM-DD format)
- `per_page` (integer): Number of invoices per page (default: 15)
- `page` (integer): Page number for pagination (default: 1)

#### Example Requests
```bash
GET /api/invoices
GET /api/invoices?customer_name=Acme
GET /api/invoices?date_from=2025-01-01&date_to=2025-12-31
GET /api/invoices?per_page=10&page=2
```

#### Response Format
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "number": "INV-2025-001",
      "date": "2025-09-03",
      "reference": "REF-001",
      "customer_name": "Acme Corporation",
      "created_at": "2025-09-03T10:00:00Z",
      "updated_at": "2025-09-03T10:00:00Z",
      "invoice_items": [
        {
          "id": 1,
          "invoice_id": 1,
          "product_name": "Product A",
          "unit_price": "100.00",
          "quantity": 2,
          "total_amount": "200.00",
          "created_at": "2025-09-03T10:00:00Z",
          "updated_at": "2025-09-03T10:00:00Z"
        }
      ]
    }
  ],
  "first_page_url": "http://localhost/api/invoices?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "http://localhost/api/invoices?page=1",
  "links": [...],
  "next_page_url": null,
  "path": "http://localhost/api/invoices",
  "per_page": 15,
  "prev_page_url": null,
  "to": 1,
  "total": 1
}
```

### 2. Get Single Invoice
**GET** `/invoices/{id}`

Retrieve a specific invoice by its ID, including all invoice items.

#### Path Parameters
- `id` (integer, required): The invoice ID

#### Example Request
```bash
GET /api/invoices/1
```

#### Response Format
```json
{
  "id": 1,
  "number": "INV-2025-001",
  "date": "2025-09-03",
  "reference": "REF-001",
  "customer_name": "Acme Corporation",
  "created_at": "2025-09-03T10:00:00Z",
  "updated_at": "2025-09-03T10:00:00Z",
  "invoice_items": [
    {
      "id": 1,
      "invoice_id": 1,
      "product_name": "Product A",
      "unit_price": "100.00",
      "quantity": 2,
      "total_amount": "200.00",
      "created_at": "2025-09-03T10:00:00Z",
      "updated_at": "2025-09-03T10:00:00Z"
    }
  ]
}
```

#### Error Response (404)
```json
{
  "message": "No query results for model [App\\Models\\Invoice] 1"
}
```

### 3. Search Invoices
**GET** `/invoices/search`

Search for invoices across multiple fields including invoice number, customer name, reference, date, and product names.

#### Query Parameters
- `q` (string, required): Search term to look for across all searchable fields

#### Searchable Fields
The search will look for matches in:
- **Invoice Number**: Partial matches (e.g., searching "INV-001" will find "INV-001")
- **Customer Name**: Partial matches (e.g., searching "Acme" will find "Acme Corporation")
- **Reference**: Partial matches in the reference field
- **Date**: Partial matches in the date field (various formats supported)
- **Product Names**: Searches within invoice items' product names
- **Total Amounts**: For numeric search terms, searches calculated invoice totals

#### Example Requests
```bash
GET /api/invoices/search?q=INV-001
GET /api/invoices/search?q=Acme
GET /api/invoices/search?q=Widget
GET /api/invoices/search?q=1500
```

#### Response Format
Returns an array of invoices (not paginated) matching the search criteria:

```json
[
  {
    "id": 1,
    "number": "INV-2025-001",
    "date": "2025-09-03",
    "reference": "REF-001",
    "customer_name": "Acme Corporation",
    "created_at": "2025-09-03T10:00:00Z",
    "updated_at": "2025-09-03T10:00:00Z",
    "invoice_items": [
      {
        "id": 1,
        "invoice_id": 1,
        "product_name": "Product A",
        "unit_price": "100.00",
        "quantity": 2,
        "total_amount": "200.00",
        "created_at": "2025-09-03T10:00:00Z",
        "updated_at": "2025-09-03T10:00:00Z"
      }
    ]
  }
]
```

#### Notes
- Search is case-insensitive
- Returns empty array `[]` if no matches found
- Results are ordered by date (newest first)
- No pagination is applied to search results
- For numeric search terms, also searches in calculated invoice totals

### 4. Create Invoice
**POST** `/invoices`

Create a new invoice with associated invoice items.

#### Request Body (JSON)

##### Invoice Fields
- `number` (string, required): Invoice number (max 255 characters)
- `date` (date, required): Invoice date (YYYY-MM-DD format)
- `customer_name` (string, required): Customer name (max 255 characters)
- `reference` (string, optional): Invoice reference (max 255 characters)
- `items` (array, required): Array of invoice items (minimum 1 item)

##### Invoice Item Fields (for each item in `items` array)
- `product_name` (string, required): Product name (max 255 characters)
- `unit_price` (decimal, required): Unit price (minimum 0)
- `quantity` (integer, required): Quantity (minimum 1)

**Note**: The `total_amount` for each item is automatically calculated as `unit_price × quantity`.

#### Example Request
```json
{
  "number": "INV-2025-001",
  "date": "2025-09-03",
  "reference": "REF-001",
  "customer_name": "Acme Corporation",
  "items": [
    {
      "product_name": "Product A",
      "unit_price": 100.00,
      "quantity": 2
    },
    {
      "product_name": "Product B",
      "unit_price": 50.00,
      "quantity": 1
    }
  ]
}
```

#### Success Response (201)
```json
{
  "message": "Invoice created successfully",
  "data": {
    "id": 1,
    "number": "INV-2025-001",
    "date": "2025-09-03",
    "reference": "REF-001",
    "customer_name": "Acme Corporation",
    "created_at": "2025-09-03T10:00:00Z",
    "updated_at": "2025-09-03T10:00:00Z",
    "invoice_items": [
      {
        "id": 1,
        "invoice_id": 1,
        "product_name": "Product A",
        "unit_price": "100.00",
        "quantity": 2,
        "total_amount": "200.00",
        "created_at": "2025-09-03T10:00:00Z",
        "updated_at": "2025-09-03T10:00:00Z"
      },
      {
        "id": 2,
        "invoice_id": 1,
        "product_name": "Product B",
        "unit_price": "50.00",
        "quantity": 1,
        "total_amount": "50.00",
        "created_at": "2025-09-03T10:00:00Z",
        "updated_at": "2025-09-03T10:00:00Z"
      }
    ]
  }
}
```

#### Validation Error Response (422)
```json
{
  "message": "Validation failed",
  "errors": {
    "number": ["The number field is required."],
    "date": ["The date field is required."],
    "customer_name": ["The customer name field is required."],
    "items": ["The items field is required."],
    "items.0.product_name": ["The items.0.product_name field is required."],
    "items.0.unit_price": ["The items.0.unit_price field is required."],
    "items.0.quantity": ["The items.0.quantity field is required."]
  }
}
```

#### Server Error Response (500)
```json
{
  "message": "Failed to create invoice",
  "error": "Error details here"
}
```

### 5. Update Invoice
**PUT** `/invoices/{id}` or **PATCH** `/invoices/{id}`

Update an existing invoice and replace all its invoice items.

#### Path Parameters
- `id` (integer, required): The invoice ID to update

#### Request Body (JSON)

##### Invoice Fields
- `number` (string, required): Invoice number (max 255 characters)
- `date` (date, required): Invoice date (YYYY-MM-DD format)
- `customer_name` (string, required): Customer name (max 255 characters)
- `reference` (string, optional): Invoice reference (max 255 characters)
- `items` (array, required): Array of invoice items (minimum 1 item)

##### Invoice Item Fields (for each item in `items` array)
- `product_name` (string, required): Product name (max 255 characters)
- `unit_price` (decimal, required): Unit price (minimum 0)
- `quantity` (integer, required): Quantity (minimum 1)

**Note**:
- The `total_amount` for each item is automatically calculated as `unit_price × quantity`.
- All existing invoice items will be deleted and replaced with the new items provided.
- Both PUT and PATCH methods work identically for complete invoice replacement.

#### Example Request
```json
{
  "number": "INV-2025-001-UPDATED",
  "date": "2025-09-04",
  "reference": "REF-001-UPDATED",
  "customer_name": "Acme Corporation Updated",
  "items": [
    {
      "product_name": "Updated Product A",
      "unit_price": 150.00,
      "quantity": 3
    },
    {
      "product_name": "New Product C",
      "unit_price": 75.00,
      "quantity": 2
    }
  ]
}
```

#### Success Response (200)
```json
{
  "message": "Invoice updated successfully",
  "data": {
    "id": 1,
    "number": "INV-2025-001-UPDATED",
    "date": "2025-09-04",
    "reference": "REF-001-UPDATED",
    "customer_name": "Acme Corporation Updated",
    "created_at": "2025-09-03T10:00:00Z",
    "updated_at": "2025-09-04T11:00:00Z",
    "invoice_items": [
      {
        "id": 3,
        "invoice_id": 1,
        "product_name": "Updated Product A",
        "unit_price": "150.00",
        "quantity": 3,
        "total_amount": "450.00",
        "created_at": "2025-09-04T11:00:00Z",
        "updated_at": "2025-09-04T11:00:00Z"
      },
      {
        "id": 4,
        "invoice_id": 1,
        "product_name": "New Product C",
        "unit_price": "75.00",
        "quantity": 2,
        "total_amount": "150.00",
        "created_at": "2025-09-04T11:00:00Z",
        "updated_at": "2025-09-04T11:00:00Z"
      }
    ]
  }
}
```

#### Error Response (404)
```json
{
  "message": "No query results for model [App\\Models\\Invoice] 1"
}
```

#### Validation Error Response (422)
```json
{
  "message": "Validation failed",
  "errors": {
    "number": ["The number field is required."],
    "date": ["The date field is required."],
    "customer_name": ["The customer name field is required."],
    "items": ["The items field is required."],
    "items.0.product_name": ["The items.0.product_name field is required."],
    "items.0.unit_price": ["The items.0.unit_price field is required."],
    "items.0.quantity": ["The items.0.quantity field is required."]
  }
}
```

#### Server Error Response (500)
```json
{
  "message": "Failed to update invoice",
  "error": "Error details here"
}
```

### 6. Delete Invoice
**DELETE** `/invoices/{id}`

Delete an existing invoice and all its associated invoice items.

#### Path Parameters
- `id` (integer, required): The invoice ID to delete

#### Example Request
```bash
DELETE /api/invoices/1
```

#### Success Response (200)
```json
{
  "message": "Invoice deleted successfully"
}
```

#### Error Response (404)
```json
{
  "message": "No query results for model [App\\Models\\Invoice] 1"
}
```

#### Server Error Response (500)
```json
{
  "message": "Failed to delete invoice",
  "error": "Error details here"
}
```

**Note**:
- Deleting an invoice will automatically delete all associated invoice items due to cascade delete constraints.
- This operation is irreversible - once deleted, the invoice and its items cannot be recovered.
- The operation is atomic - either the entire invoice (including all items) is deleted, or nothing is deleted if an error occurs.

## Database Constraints

- The combination of `number`, `customer_name`, and `date` must be unique
- Invoice items are automatically deleted when the parent invoice is deleted (cascade delete)

## Data Types

- `id`: Auto-incrementing integer
- `number`: String (max 255 characters)
- `date`: Date (YYYY-MM-DD format)
- `reference`: String (max 255 characters, nullable)
- `customer_name`: String (max 255 characters)
- `product_name`: String (max 255 characters)
- `unit_price`: Decimal (10 digits total, 2 decimal places)
- `quantity`: Integer
- `total_amount`: Decimal (10 digits total, 2 decimal places)
- `created_at`, `updated_at`: Timestamps (ISO 8601 format)