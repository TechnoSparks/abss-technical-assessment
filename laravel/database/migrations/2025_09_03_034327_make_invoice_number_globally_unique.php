<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the existing composite unique constraint
            $table->dropUnique(['number', 'customer_name', 'date']);

            // Add a new unique constraint on just the number column
            $table->unique('number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the unique constraint on number
            $table->dropUnique(['number']);

            // Restore the original composite unique constraint
            $table->unique(['number', 'customer_name', 'date']);
        });
    }
};
