<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title_fr',
        'title_ar',
        'title_tmz',
        'title_en',
        'message_fr',
        'message_ar',
        'message_tmz',
        'message_en',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}
