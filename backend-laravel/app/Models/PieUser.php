<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PieUser extends Model
{
    use HasFactory;
    public $incrementing = false;
    protected $primaryKey = 'uid';
    protected $keyType = 'string';

    protected $fillable = [
        'uid',
        'display_name',
        'email',
        'role',
        'location',
        'earnings',
        'courses_completed',
        'level',
        'xp',
        'streak',
    ];
}
