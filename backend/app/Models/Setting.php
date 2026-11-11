<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /** Keys the API exposes and allows admin/developer to update. */
    public const SERVICE_LOG_ID_PREFIX = 'service_log_id_prefix';

    public const KEYS = [
        self::SERVICE_LOG_ID_PREFIX,
        'shop_name',
        'shop_phone',
        'shop_address',
        'shop_gst',
        'shop_email',
    ];

    /** Max length and allowed characters for the service log ID prefix. */
    public const PREFIX_MAX_LENGTH = 10;

    public const PREFIX_PATTERN = '/^[A-Za-z0-9\-_#\/]*$/';

    /** Per-request memo so model accessors don't hit the DB once per row. */
    protected static ?array $cache = null;

    public static function flushCache(): void
    {
        static::$cache = null;
    }

    public static function all_as_array(): array
    {
        if (static::$cache === null) {
            static::$cache = static::query()->pluck('value', 'key')->toArray();
        }
        $out = [];
        foreach (self::KEYS as $key) {
            $out[$key] = static::$cache[$key] ?? null;
        }

        return $out;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $values = static::all_as_array();
        $value = $values[$key] ?? null;

        return $value === null || $value === '' ? $default : $value;
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        static::flushCache();
    }

    /** Sanitised service log ID prefix ("" when unset). */
    public static function serviceLogIdPrefix(): string
    {
        return (string) static::get(self::SERVICE_LOG_ID_PREFIX, '');
    }

    public static function sanitizePrefix(?string $raw): string
    {
        $clean = preg_replace('/[^A-Za-z0-9\-_#\/]/', '', (string) $raw);

        return mb_substr($clean, 0, self::PREFIX_MAX_LENGTH);
    }
}
