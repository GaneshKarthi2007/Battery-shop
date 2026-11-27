<?php

namespace App\Support;

class InputNormalizer
{
    /**
     * Normalize an Indian mobile number to 10 digits, or return null if invalid.
     */
    public static function normalizeMobile10(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $raw) ?? '';
        if (strlen($digits) === 12 && str_starts_with($digits, '91')) {
            $digits = substr($digits, 2);
        } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        return preg_match('/^\d{10}$/', $digits) ? $digits : null;
    }

    /**
     * Capitalize the first letter of each word (for customer names, categories, etc.).
     */
    public static function capitalizeWords(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim(preg_replace('/\s+/', ' ', $value) ?? '');
        if ($trimmed === '') {
            return '';
        }

        return preg_replace_callback(
            '/(?:^|\s)\S/u',
            fn (array $matches) => mb_strtoupper($matches[0], 'UTF-8'),
            $trimmed
        );
    }

    /**
     * Capitalize the first letter of a sentence / general text input.
     */
    public static function capitalizeFirst(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return '';
        }

        return mb_strtoupper(mb_substr($trimmed, 0, 1, 'UTF-8'), 'UTF-8')
            . mb_substr($trimmed, 1, null, 'UTF-8');
    }
}
