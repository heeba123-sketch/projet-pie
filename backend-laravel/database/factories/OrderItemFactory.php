<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\Kit;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'kit_id' => $this->faker->randomElement(['kit-1', 'kit-2', 'kit-3']),
            'quantity' => $this->faker->numberBetween(1, 3),
        ];
    }
}
