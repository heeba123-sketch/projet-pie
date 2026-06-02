<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorialStep extends Model
{
    protected $fillable = [
        'tutorial_id',
        'step_number',
        'instruction_ar',
        'instruction_tmz',
        'instruction_fr',
        'instruction_en',
        'animation_key',
    ];

    public function tutorial(): BelongsTo
    {
        return $this->belongsTo(Tutorial::class);
    }
}
