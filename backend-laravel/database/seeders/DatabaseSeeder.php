<?php

namespace Database\Seeders;

use App\Models\Kit;
use App\Models\KitContent;
use App\Models\Tutorial;
use App\Models\TutorialStep;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Truncate all tables to avoid duplicates
        Schema::disableForeignKeyConstraints();
        KitContent::truncate();
        Kit::truncate();
        TutorialStep::truncate();
        Tutorial::truncate();
        Product::truncate();
        \App\Models\PieUser::truncate();
        \App\Models\OrderItem::truncate();
        \App\Models\Order::truncate();
        Schema::enableForeignKeyConstraints();

        // Load db.json
        $jsonPath = base_path('../db.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("db.json not found at: {$jsonPath}");
            return;
        }

        $dbData = json_decode(file_get_contents($jsonPath), true);
        if (!$dbData) {
            $this->command->error("Failed to parse db.json");
            return;
        }

        // Extract adminStock if available
        $adminStock = $dbData['adminStock'] ?? [];

        // 1. Seed Kits and KitContents
        if (isset($dbData['kits']) && is_array($dbData['kits'])) {
            foreach ($dbData['kits'] as $kitData) {
                $kitId = $kitData['id'];
                $stock = $adminStock[$kitId] ?? 10;

                $kit = Kit::create([
                    'id' => $kitId,
                    'title_ar' => $kitData['title']['ar'] ?? '',
                    'title_tmz' => $kitData['title']['tmz'] ?? '',
                    'title_fr' => $kitData['title']['fr'] ?? '',
                    'title_en' => $kitData['title']['en'] ?? '',
                    'price' => $kitData['price'] ?? 0,
                    'description_ar' => $kitData['description']['ar'] ?? '',
                    'description_tmz' => $kitData['description']['tmz'] ?? '',
                    'description_fr' => $kitData['description']['fr'] ?? '',
                    'description_en' => $kitData['description']['en'] ?? '',
                    'image_url' => $kitData['imageUrl'] ?? '',
                    'color_hex' => $kitData['colorHex'] ?? '#FFFFFF',
                    'stock' => $stock,
                    'reorder_at' => 8,
                ]);

                if (isset($kitData['whatsInside']) && is_array($kitData['whatsInside'])) {
                    foreach ($kitData['whatsInside'] as $index => $contentData) {
                        KitContent::create([
                            'kit_id' => $kit->id,
                            'label_ar' => $contentData['ar'] ?? '',
                            'label_tmz' => $contentData['tmz'] ?? '',
                            'label_fr' => $contentData['fr'] ?? '',
                            'label_en' => $contentData['en'] ?? '',
                            'sort_order' => $index,
                        ]);
                    }
                }
            }
            $this->command->info("Kits and KitContents seeded successfully!");
        }

        // 2. Seed Tutorials and TutorialSteps
        if (isset($dbData['tutorials']) && is_array($dbData['tutorials'])) {
            foreach ($dbData['tutorials'] as $tutoData) {
                $exercise = $tutoData['exercise'] ?? [];
                
                $linkedKitId = $tutoData['linkedKitId'] ?? null;
                if ($linkedKitId && !Kit::where('id', $linkedKitId)->exists()) {
                    $linkedKitId = null;
                }

                $tutorial = Tutorial::create([
                    'id' => $tutoData['id'],
                    'metier' => $tutoData['metier'] ?? 'crochet',
                    'linked_kit_id' => $linkedKitId,
                    'title_ar' => $tutoData['title']['ar'] ?? '',
                    'title_tmz' => $tutoData['title']['tmz'] ?? '',
                    'title_fr' => $tutoData['title']['fr'] ?? '',
                    'title_en' => $tutoData['title']['en'] ?? '',
                    'description_ar' => $tutoData['description']['ar'] ?? '',
                    'description_tmz' => $tutoData['description']['tmz'] ?? '',
                    'description_fr' => $tutoData['description']['fr'] ?? '',
                    'description_en' => $tutoData['description']['en'] ?? '',
                    'difficulty' => $tutoData['difficulty'] ?? 'facile',
                    'duration' => $tutoData['duration'] ?? '5 min',
                    'video_embed_id' => $tutoData['videoEmbedId'] ?? null,
                    'video_mock_name' => $tutoData['videoMockName'] ?? null,
                    'earn_price' => $exercise['earnPrice'] ?? null,
                    'output_product_id' => $exercise['outputProductId'] ?? null,
                    'exercise_title_ar' => $exercise['title']['ar'] ?? null,
                    'exercise_title_tmz' => $exercise['title']['tmz'] ?? null,
                    'exercise_title_fr' => $exercise['title']['fr'] ?? null,
                    'exercise_title_en' => $exercise['title']['en'] ?? null,
                    'exercise_desc_ar' => $exercise['desc']['ar'] ?? null,
                    'exercise_desc_tmz' => $exercise['desc']['tmz'] ?? null,
                    'exercise_desc_fr' => $exercise['desc']['fr'] ?? null,
                    'exercise_desc_en' => $exercise['desc']['en'] ?? null,
                ]);

                if (isset($tutoData['steps']) && is_array($tutoData['steps'])) {
                    foreach ($tutoData['steps'] as $stepData) {
                        TutorialStep::create([
                            'tutorial_id' => $tutorial->id,
                            'step_number' => $stepData['stepNumber'] ?? 1,
                            'instruction_ar' => $stepData['instruction']['ar'] ?? '',
                            'instruction_tmz' => $stepData['instruction']['tmz'] ?? '',
                            'instruction_fr' => $stepData['instruction']['fr'] ?? '',
                            'instruction_en' => $stepData['instruction']['en'] ?? '',
                            'animation_key' => $stepData['animationKey'] ?? 'wrap-finger',
                        ]);
                    }
                }
            }
            $this->command->info("Tutorials and TutorialSteps seeded successfully!");
        }

        // 3. Seed Products
        if (isset($dbData['products']) && is_array($dbData['products'])) {
            foreach ($dbData['products'] as $prodData) {
                Product::create([
                    'id' => $prodData['id'],
                    'title' => $prodData['title'] ?? '',
                    'price' => $prodData['price'] ?? 0,
                    'description' => $prodData['description'] ?? '',
                    'image_url' => $prodData['imageUrl'] ?? '',
                    'seller_name' => $prodData['sellerName'] ?? '',
                    'is_certified' => $prodData['isCertified'] ?? false,
                    'likes' => $prodData['likes'] ?? 0,
                    'is_user_added' => false,
                    'voice_memo_url' => null,
                ]);
            }
            $this->command->info("Products seeded successfully!");
        }

        // 4. Seed additional mock data using factories for rich complex app demo
        // Generate mock artisans (PieUsers)
        \App\Models\PieUser::factory()->count(8)->create();

        // Ensure key mock users are seeded
        \App\Models\PieUser::firstOrCreate([
            'uid' => 'user-lma-1'
        ], [
            'display_name' => 'Khadiya Soussia',
            'email' => 'khadija@pie.ma',
            'role' => 'foyer',
            'location' => 'Tafraout',
            'earnings' => 4800,
            'courses_completed' => 3,
            'level' => 'Maâlma Confirmée',
            'xp' => 1250,
            'streak' => 12
        ]);
        
        \App\Models\PieUser::firstOrCreate([
            'uid' => 'user-lma-2'
        ], [
            'display_name' => 'Yassir Gherbi',
            'email' => 'yassir@pie.ma',
            'role' => 'jeune',
            'location' => 'Sefrou',
            'earnings' => 2300,
            'courses_completed' => 2,
            'level' => 'Artisan Passionné',
            'xp' => 850,
            'streak' => 5
        ]);

        // Generate 20 additional marketplace products
        \App\Models\Product::factory()->count(20)->create();

        // Generate 15 mock orders with items
        \App\Models\Order::factory()->count(15)->create()->each(function ($order) {
            $kitIds = ['kit-1', 'kit-2', 'kit-3'];
            $itemsCount = rand(1, 3);
            $selectedKits = array_rand(array_flip($kitIds), $itemsCount);
            if (!is_array($selectedKits)) {
                $selectedKits = [$selectedKits];
            }
            foreach ($selectedKits as $kitId) {
                \App\Models\OrderItem::create([
                    'order_id' => $order->id,
                    'kit_id' => $kitId,
                    'quantity' => rand(1, 3),
                ]);
            }
        });
        $this->command->info("Additional complex mock data seeded successfully!");
    }
}
