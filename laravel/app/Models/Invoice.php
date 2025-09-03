<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'date',
        'reference',
        'customer_name',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}