<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MiscTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_number',
        'date',
        'type',
        'particular',
        'debit_amount',
        'credit_amount',
        'debit_ledger',
        'credit_ledger',
        'credit_entries',
        'debit_entries',
        'attachment_path',
        'bank_name',
        'cheque_no',
        'cheque_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'credit_entries' => 'array',
        'debit_entries' => 'array',
        'date' => 'date:Y-m-d',
        'cheque_date' => 'date:Y-m-d',
        'debit_amount' => 'float',
        'credit_amount' => 'float',
    ];

    protected $appends = ['attachment_url'];

    /**
     * Accessor: full public URL of the attachment (null when none).
     */
    public function getAttachmentUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorage::class)->url($this->attachment_path);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

