<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'price',
        'description',
        'image_url',
        'seller_name',
        'is_certified',
        'likes',
        'is_user_added',
        'voice_memo_url',
    ];
}
