<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitContent extends Model
{
    protected $fillable = [
        'kit_id',
        'label_ar',
        'label_tmz',
        'label_fr',
        'label_en',
        'sort_order',
    ];

    public function kit(): BelongsTo
    {
        return $this->belongsTo(Kit::class);
    }
}
