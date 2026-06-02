<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kit extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title_ar',
        'title_tmz',
        'title_fr',
        'title_en',
        'price',
        'description_ar',
        'description_tmz',
        'description_fr',
        'description_en',
        'image_url',
        'color_hex',
        'stock',
        'reorder_at',
    ];

    public function contents(): HasMany
    {
        return $this->hasMany(KitContent::class);
    }

    public function tutorials(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'linked_kit_id');
    }
}
