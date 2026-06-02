<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $craftImages = [
            'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&q=80&w=600',
        ];

        return [
            'id' => 'prod-' . substr($this->faker->unique()->uuid(), 0, 31),
            'title' => $this->faker->randomElement([
                'Écharpe Atlas Royale',
                'Napperon Dentelle d\'Argan',
                'Sac Cabas Boho Soleil',
                'Coussin Brodé de Fès',
                'Tapis Mural Géométrique',
                'Tajine en Argile Polie de Safi',
                'Pochette en Laine Tissée',
                'Babouches Brodées Main',
            ]),
            'price' => $this->faker->randomElement([120, 150, 180, 220, 250, 290, 320, 350, 450]),
            'description' => $this->faker->paragraph(2),
            'image_url' => $this->faker->randomElement($craftImages),
            'seller_name' => 'Maâlma ' . $this->faker->firstNameFemale(),
            'is_certified' => $this->faker->boolean(70), // 70% certified
            'likes' => $this->faker->numberBetween(0, 100),
            'is_user_added' => $this->faker->boolean(50),
            'voice_memo_url' => null,
        ];
    }
}
