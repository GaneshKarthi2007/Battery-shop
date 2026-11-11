<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceProcessFlow extends Model
{
    protected $guarded = [];

    protected $appends = ['voice_note_url'];

    /**
     * Accessor: full public URL of this update's voice note (null when none).
     */
    public function getVoiceNoteUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorage::class)->url($this->voice_note);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
