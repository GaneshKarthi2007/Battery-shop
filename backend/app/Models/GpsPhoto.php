<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GpsPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'service_id',
        'image_path',
        'latitude',
        'longitude',
        'captured_at',
    ];

    protected $casts = [
        'latitude'    => 'float',
        'longitude'   => 'float',
        'captured_at' => 'datetime',
    ];

    /**
     * Append the full image URL when serialising.
     */
    protected $appends = ['image_url'];

    /**
     * The user who captured this photo.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The service this photo is attached to (optional).
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Service::class);
    }

    /**
     * Accessor: full public URL of the stored image.
     */
    public function getImageUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }
}
