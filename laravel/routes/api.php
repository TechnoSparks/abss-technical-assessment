<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\InvoiceController;

// Invoice endpoints
// show list of invoices, including their items
Route::get('/invoices', [InvoiceController::class, 'index']);
// search invoices across all fields
Route::get('/invoices/search', [InvoiceController::class, 'search']);
// show invoice items for a particular invoice ID
Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
// POST new invoice
Route::post('/invoices', [InvoiceController::class, 'store']);
// UPDATE particular invoice
Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
Route::patch('/invoices/{id}', [InvoiceController::class, 'update']);
// DELETE invoice
Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);
