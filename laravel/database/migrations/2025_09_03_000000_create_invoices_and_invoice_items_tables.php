<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number');
            $table->date('date');
            $table->string('reference')->nullable();
            $table->string('customer_name');
            $table->timestamps();
            $table->unique(['number', 'customer_name', 'date']); // Unique per customer per year
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('product_name');
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('total_amount', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
