<?php

namespace Database\Factories;

use App\Models\PieUser;
use Illuminate\Database\Eloquent\Factories\Factory;

class PieUserFactory extends Factory
{
    protected $model = PieUser::class;

    public function definition(): array
    {
        return [
            'uid' => 'user-' . $this->faker->unique()->uuid(),
            'display_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'role' => $this->faker->randomElement(['foyer', 'jeune', 'etudiant', 'rural']),
            'location' => $this->faker->randomElement(['Tafraout', 'Sefrou', 'Aït Melloul', 'Chefchaouen', 'Marrakech', 'Fès']),
            'earnings' => $this->faker->randomFloat(2, 0, 5000),
            'courses_completed' => $this->faker->numberBetween(0, 5),
            'level' => $this->faker->randomElement(['Nouveau Membre', 'Artisan Passionné', 'Maâlma Confirmée']),
            'xp' => $this->faker->numberBetween(0, 2000),
            'streak' => $this->faker->numberBetween(0, 15),
        ];
    }
}
