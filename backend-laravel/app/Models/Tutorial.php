<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tutorial extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'metier',
        'linked_kit_id',
        'title_ar',
        'title_tmz',
        'title_fr',
        'title_en',
        'description_ar',
        'description_tmz',
        'description_fr',
        'description_en',
        'difficulty',
        'duration',
        'video_embed_id',
        'video_mock_name',
        'earn_price',
        'output_product_id',
        'exercise_title_ar',
        'exercise_title_tmz',
        'exercise_title_fr',
        'exercise_title_en',
        'exercise_desc_ar',
        'exercise_desc_tmz',
        'exercise_desc_fr',
        'exercise_desc_en',
    ];

    public function kit(): BelongsTo
    {
        return $this->belongsTo(Kit::class, 'linked_kit_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(TutorialStep::class);
    }
}
