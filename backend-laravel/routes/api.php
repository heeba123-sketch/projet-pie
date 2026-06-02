<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Kit;
use App\Models\Tutorial;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;

Route::get('/kits', function () {
    $kits = Kit::with('contents')->get();
    
    $transformed = $kits->map(function ($kit) {
        return [
            'id' => $kit->id,
            'title' => [
                'ar' => $kit->title_ar,
                'tmz' => $kit->title_tmz,
                'fr' => $kit->title_fr,
                'en' => $kit->title_en,
            ],
            'price' => (float)$kit->price,
            'description' => [
                'ar' => $kit->description_ar,
                'tmz' => $kit->description_tmz,
                'fr' => $kit->description_fr,
                'en' => $kit->description_en,
            ],
            'whatsInside' => $kit->contents->sortBy('sort_order')->map(function ($content) {
                return [
                    'ar' => $content->label_ar,
                    'tmz' => $content->label_tmz,
                    'fr' => $content->label_fr,
                    'en' => $content->label_en,
                ];
            })->values()->all(),
            'imageUrl' => $kit->image_url,
            'colorHex' => $kit->color_hex,
            'stock' => (int)$kit->stock,
        ];
    });
    
    return response()->json($transformed);
});

Route::get('/tutorials', function () {
    $tutorials = Tutorial::with('steps')->get();
    
    $transformed = $tutorials->map(function ($tuto) {
        $hasExercise = $tuto->earn_price !== null || $tuto->exercise_title_fr !== null;
        
        return [
            'id' => $tuto->id,
            'metier' => $tuto->metier,
            'linkedKitId' => $tuto->linked_kit_id,
            'title' => [
                'ar' => $tuto->title_ar,
                'tmz' => $tuto->title_tmz,
                'fr' => $tuto->title_fr,
                'en' => $tuto->title_en,
            ],
            'description' => [
                'ar' => $tuto->description_ar,
                'tmz' => $tuto->description_tmz,
                'fr' => $tuto->description_fr,
                'en' => $tuto->description_en,
            ],
            'difficulty' => $tuto->difficulty,
            'duration' => $tuto->duration,
            'videoMockName' => $tuto->video_mock_name,
            'videoEmbedId' => $tuto->video_embed_id,
            'exercise' => $hasExercise ? [
                'title' => [
                    'ar' => $tuto->exercise_title_ar,
                    'tmz' => $tuto->exercise_title_tmz,
                    'fr' => $tuto->exercise_title_fr,
                    'en' => $tuto->exercise_title_en,
                ],
                'desc' => [
                    'ar' => $tuto->exercise_desc_ar,
                    'tmz' => $tuto->exercise_desc_tmz,
                    'fr' => $tuto->exercise_desc_fr,
                    'en' => $tuto->exercise_desc_en,
                ],
                'earnPrice' => (float)$tuto->earn_price,
                'outputProductId' => $tuto->output_product_id,
            ] : null,
            'steps' => $tuto->steps->sortBy('step_number')->map(function ($step) {
                return [
                    'stepNumber' => (int)$step->step_number,
                    'instruction' => [
                        'ar' => $step->instruction_ar,
                        'tmz' => $step->instruction_tmz,
                        'fr' => $step->instruction_fr,
                        'en' => $step->instruction_en,
                    ],
                    'animationKey' => $step->animation_key,
                ];
            })->values()->all(),
        ];
    });
    
    return response()->json($transformed);
});

Route::get('/products', function () {
    $products = Product::orderBy('created_at', 'desc')->get();
    
    $transformed = $products->map(function ($prod) {
        return [
            'id' => $prod->id,
            'title' => $prod->title,
            'price' => (float)$prod->price,
            'description' => $prod->description,
            'imageUrl' => $prod->image_url,
            'sellerName' => $prod->seller_name,
            'isCertified' => (bool)$prod->is_certified,
            'likes' => (int)$prod->likes,
            'isUserAdded' => (bool)$prod->is_user_added,
            'voiceMemoUrl' => $prod->voice_memo_url,
        ];
    });
    
    return response()->json($transformed);
});

Route::post('/products', function (Request $request) {
    $title = $request->input('title');
    $price = $request->input('price');
    
    if (!$title || !$price) {
        return response()->json(['error' => 'Title and price are required.'], 400);
    }
    
    $prod = Product::create([
        'id' => 'prod-user-' . time() . '-' . rand(100, 999),
        'title' => $title,
        'price' => (float)$price,
        'description' => $request->input('description', "Création fait-main partagée via l'interface tactile."),
        'image_url' => $request->input('imageUrl', "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600"),
        'seller_name' => $request->input('sellerName', "Artisane Locale"),
        'is_certified' => false,
        'likes' => 0,
        'is_user_added' => true,
        'voice_memo_url' => $request->input('voiceMemoUrl'),
    ]);
    
    return response()->json([
        'id' => $prod->id,
        'title' => $prod->title,
        'price' => (float)$prod->price,
        'description' => $prod->description,
        'imageUrl' => $prod->image_url,
        'sellerName' => $prod->seller_name,
        'isCertified' => (bool)$prod->is_certified,
        'likes' => (int)$prod->likes,
        'isUserAdded' => (bool)$prod->is_user_added,
        'voiceMemoUrl' => $prod->voice_memo_url,
    ], 201);
});

Route::post('/orders', function (Request $request) {
    $items = $request->input('items', []);
    $phone = $request->input('phone');
    $customerNotes = $request->input('customerNotes');
    $userLanguage = $request->input('userLanguage', 'fr');
    
    if (empty($items)) {
        return response()->json(['error' => 'Cart is empty.'], 400);
    }
    
    $order = Order::create([
        'id' => 'ord-' . time() . '-' . rand(100, 999),
        'phone' => $phone ?: "Non renseigné (Livraison tactile)",
        'customer_notes' => $customerNotes ?: "Commande Express par icônes",
        'user_language' => $userLanguage ?: "fr",
        'status' => 'pending',
    ]);
    
    foreach ($items as $item) {
        $kitId = $item['kitId'] ?? null;
        $quantity = (int)($item['quantity'] ?? 1);
        
        if ($kitId) {
            OrderItem::create([
                'order_id' => $order->id,
                'kit_id' => $kitId,
                'quantity' => $quantity,
            ]);
            
            // Decrement kit stock
            $kit = Kit::find($kitId);
            if ($kit) {
                $kit->stock = max(0, $kit->stock - $quantity);
                $kit->save();
            }
        }
    }
    
    return response()->json([
        'success' => true,
        'orderId' => $order->id,
    ], 201);
});

Route::get('/admin/summary', function () {
    $kits = Kit::all();
    $orders = Order::with('items')->get();
    $products = Product::all();
    
    $kitUnitsSold = 0;
    $monthlyRevenue = 0;
    $now = now();
    
    foreach ($orders as $order) {
        foreach ($order->items as $item) {
            $kitUnitsSold += $item->quantity;
            
            $kit = $kits->firstWhere('id', $item->kit_id);
            $kitPrice = $kit ? (float)$kit->price : 120.0;
            
            $orderDate = $order->created_at ?: $now;
            if ($orderDate->month === $now->month && $orderDate->year === $now->year) {
                $monthlyRevenue += ($item->quantity * $kitPrice);
            }
        }
    }
    
    $stock = $kits->map(function ($kit) {
        return [
            'kitId' => $kit->id,
            'title' => $kit->title_fr,
            'stock' => (int)$kit->stock,
            'reorderAt' => (int)$kit->reorder_at,
        ];
    });
    
    return response()->json([
        'premiumSubscribers' => 24,
        'kitsSold' => $kitUnitsSold,
        'monthlyCreations' => $products->where('is_user_added', true)->count(),
        'pendingCreations' => $products->where('is_certified', false)->count(),
        'monthlyRevenue' => $monthlyRevenue,
        'stock' => $stock,
        'ordersCount' => $orders->count(),
    ]);
});

Route::put('/admin/products/{id}/approve', function ($id) {
    $product = Product::find($id);
    if (!$product) {
        return response()->json(['error' => 'Product not found.'], 404);
    }
    $product->is_certified = true;
    $product->save();
    
    return response()->json([
        'id' => $product->id,
        'title' => $product->title,
        'price' => (float)$product->price,
        'description' => $product->description,
        'imageUrl' => $product->image_url,
        'sellerName' => $product->seller_name,
        'isCertified' => (bool)$product->is_certified,
        'likes' => (int)$product->likes,
        'isUserAdded' => (bool)$product->is_user_added,
        'voiceMemoUrl' => $product->voice_memo_url,
    ]);
});

Route::delete('/admin/products/{id}', function ($id) {
    $product = Product::find($id);
    if (!$product) {
        return response()->json(['error' => 'Product not found.'], 404);
    }
    $product->delete();
    return response()->json(['success' => true]);
});

Route::put('/admin/kits/{id}/stock', function (Request $request, $id) {
    $stock = $request->input('stock');
    if ($stock === null || !is_numeric($stock) || $stock < 0) {
        return response()->json(['error' => 'Stock must be a positive number.'], 400);
    }
    $kit = Kit::find($id);
    if (!$kit) {
        return response()->json(['error' => 'Kit not found.'], 404);
    }
    $kit->stock = (int)$stock;
    $kit->save();
    
    return response()->json([
        'kitId' => $kit->id,
        'stock' => (int)$kit->stock,
    ]);
});

Route::post('/sync', function (Request $request) {
    $products = $request->input('products', []);
    $orders = $request->input('orders', []);
    $syncedProducts = 0;
    $syncedOrders = 0;
    
    foreach ($products as $p) {
        $pId = $p['id'] ?? null;
        if ($pId && !Product::where('id', $pId)->exists()) {
            Product::create([
                'id' => $pId,
                'title' => $p['title'] ?? 'Sans Titre',
                'price' => (float)($p['price'] ?? 0),
                'description' => $p['description'] ?? '',
                'image_url' => $p['imageUrl'] ?? '',
                'seller_name' => $p['sellerName'] ?? 'Artisane connectée',
                'is_certified' => false,
                'likes' => 0,
                'is_user_added' => true,
                'voice_memo_url' => $p['voiceMemoUrl'] ?? null,
            ]);
            $syncedProducts++;
        }
    }
    
    foreach ($orders as $o) {
        $oId = $o['id'] ?? null;
        if ($oId && !Order::where('id', $oId)->exists()) {
            $order = Order::create([
                'id' => $oId,
                'phone' => $o['phone'] ?? "Non renseigné",
                'customer_notes' => $o['customerNotes'] ?? "Commande synchronisée depuis le mode hors-ligne",
                'user_language' => $o['userLanguage'] ?? 'ar',
                'status' => 'pending',
            ]);
            
            $items = $o['items'] ?? [];
            foreach ($items as $item) {
                $kitId = $item['kitId'] ?? null;
                $quantity = (int)($item['quantity'] ?? 1);
                
                if ($kitId) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'kit_id' => $kitId,
                        'quantity' => $quantity,
                    ]);
                }
            }
            $syncedOrders++;
        }
    }
    
    return response()->json([
        'success' => true,
        'syncedProducts' => $syncedProducts,
        'syncedOrders' => $syncedOrders,
    ]);
});
