<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'id' => 'ord-' . substr($this->faker->unique()->uuid(), 0, 32),
            'phone' => $this->faker->phoneNumber(),
            'customer_notes' => $this->faker->randomElement([
                'Commande Express par icônes',
                'Livraison rapide s\'il vous plaît',
                'Appeler avant livraison',
                null
            ]),
            'user_language' => $this->faker->randomElement(['fr', 'ar', 'tmz', 'en']),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'shipped', 'delivered']),
            'created_at' => $this->faker->dateTimeThisMonth(),
        ];
    }
}
