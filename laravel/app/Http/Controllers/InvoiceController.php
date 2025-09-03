<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    // ---------- method returns the list of Invoice ----------
    // **GET** `/invoices`

    public function index(Request $request)
    {
        $query = Invoice::with('invoiceItems'); // targets Invoice that has InvoiceItem

        // Optional filtering by customer name
        if ($request->has('customer_name')) {
            $query->where('customer_name', 'like', '%' . $request->customer_name . '%');
        }

        // Optional filtering by date range
        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        // Optional pagination
        $perPage = $request->get('per_page', 15);
        $invoices = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json($invoices);
    }

    // ---------- method searches invoices across all fields ----------
    // **GET** /invoices/search?q=search_term

    public function search(Request $request)
    {
        $searchTerm = $request->get('q');

        if (empty($searchTerm)) {
            return response()->json([]);
        }

        $query = Invoice::with('invoiceItems')
            ->where(function ($q) use ($searchTerm) {
                // Search in invoice number
                $q->where('number', 'like', '%' . $searchTerm . '%')
                  // Search in customer name
                  ->orWhere('customer_name', 'like', '%' . $searchTerm . '%')
                  // Search in reference
                  ->orWhere('reference', 'like', '%' . $searchTerm . '%')
                  // Search in date (try to match various date formats)
                  ->orWhere('date', 'like', '%' . $searchTerm . '%')
                  // Search in invoice items product names
                  ->orWhereHas('invoiceItems', function ($itemQuery) use ($searchTerm) {
                      $itemQuery->where('product_name', 'like', '%' . $searchTerm . '%');
                  });
            });

        // For numeric search terms, also search in total amounts
        if (is_numeric($searchTerm)) {
            $query->orWhereHas('invoiceItems', function ($itemQuery) use ($searchTerm) {
                $itemQuery->havingRaw('SUM(CAST(total_amount AS DECIMAL(10,2))) LIKE ?', ['%' . $searchTerm . '%'])
                          ->groupBy('invoice_id');
            });
        }

        $results = $query->orderBy('date', 'desc')->get();

        return response()->json($results);
    }

    // ---------- method returns the information of a single Invoice ----------
    // **GET** /invoices/{id}

    public function show($id)
    {
        $invoice = Invoice::with('invoiceItems')->findOrFail($id);
        return response()->json($invoice);
    }

    // ---------- method stores the information of a single Invoice ----------
    // **POST** /invoices

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'number' => 'required|string|max:255|unique:invoices,number',
            'date' => 'required|date',
            'reference' => 'nullable|string|max:255',
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create the invoice
            $invoice = Invoice::create([
                'number' => $request->number,
                'date' => $request->date,
                'reference' => $request->reference,
                'customer_name' => $request->customer_name,
            ]);

            // Create invoice items
            foreach ($request->items as $item) {
                $totalAmount = $item['unit_price'] * $item['quantity'];

                $invoice->invoiceItems()->create([
                    'product_name' => $item['product_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_amount' => $totalAmount,
                ]);
            }

            DB::commit();

            // Return the created invoice with its items
            $invoice->load('invoiceItems');

            return response()->json([
                'message' => 'Invoice created successfully',
                'data' => $invoice
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ---------- method updates an existing Invoice ----------
    // **PUT/PATCH** `/invoices/{id}`

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'number' => 'required|string|max:255|unique:invoices,number,' . $id,
            'date' => 'required|date',
            'reference' => 'nullable|string|max:255',
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Find the invoice or fail with 404
            $invoice = Invoice::findOrFail($id);

            // Update the invoice details
            $invoice->update([
                'number' => $request->number,
                'date' => $request->date,
                'reference' => $request->reference,
                'customer_name' => $request->customer_name,
            ]);

            // Delete existing invoice items and create new ones
            // This approach ensures data consistency and handles additions/removals
            $invoice->invoiceItems()->delete();

            // Create new invoice items
            foreach ($request->items as $item) {
                $totalAmount = $item['unit_price'] * $item['quantity'];

                $invoice->invoiceItems()->create([
                    'product_name' => $item['product_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_amount' => $totalAmount,
                ]);
            }

            DB::commit();

            // Return the updated invoice with its items
            $invoice->load('invoiceItems');

            return response()->json([
                'message' => 'Invoice updated successfully',
                'data' => $invoice
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ---------- method deletes an existing Invoice ----------
    // **DELETE** `/invoices/{id}`

    public function destroy($id)
    {
        try {
            // Find the invoice or fail with 404
            $invoice = Invoice::findOrFail($id);

            // Delete the invoice (invoice items will be automatically deleted due to cascade delete)
            $invoice->delete();

            return response()->json([
                'message' => 'Invoice deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
