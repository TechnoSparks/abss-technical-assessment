<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Carbon\Carbon;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            'Acme Corp', 'Beta LLC', 'Gamma Industries', 'Delta Solutions', 'Epsilon Tech',
            'Zeta Enterprises', 'Eta Systems', 'Theta Group', 'Iota Holdings', 'Kappa Ltd',
            'Lambda Inc', 'Mu Corporation', 'Nu Dynamics', 'Xi Partners', 'Omicron Co',
            'Pi Innovations', 'Rho Ventures', 'Sigma Networks', 'Tau Technologies', 'Upsilon Ltd'
        ];

        $products = [
            ['name' => 'Widget A', 'price' => 50.00],
            ['name' => 'Widget B', 'price' => 30.00],
            ['name' => 'Widget C', 'price' => 20.00],
            ['name' => 'Gadget Pro', 'price' => 75.00],
            ['name' => 'Tool Kit', 'price' => 45.00],
            ['name' => 'Device X', 'price' => 120.00],
            ['name' => 'Component Y', 'price' => 25.00],
            ['name' => 'Module Z', 'price' => 65.00],
            ['name' => 'Service Pack', 'price' => 100.00],
            ['name' => 'Premium License', 'price' => 200.00],
        ];

        for ($i = 1; $i <= 50; $i++) {
            // Create invoice with random data
            $invoice = Invoice::create([
                'number' => sprintf('INV-%03d', $i),
                'date' => Carbon::now()->subDays(rand(1, 90))->format('Y-m-d'),
                'reference' => sprintf('PO-%d', 1000 + $i),
                'customer_name' => $companies[array_rand($companies)],
            ]);

            // Create 1-5 random items for each invoice
            $itemCount = rand(1, 5);
            for ($j = 0; $j < $itemCount; $j++) {
                $product = $products[array_rand($products)];
                $quantity = rand(1, 10);
                $unitPrice = $product['price'];
                $totalAmount = $unitPrice * $quantity;

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_name' => $product['name'],
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'total_amount' => $totalAmount,
                ]);
            }
        }
    }
}
