<?php

namespace Tests\Unit;

use App\Support\InputNormalizer;
use PHPUnit\Framework\TestCase;

class InputNormalizerTest extends TestCase
{
    public function test_normalizes_valid_10_digit_and_country_code_mobile_numbers(): void
    {
        $this->assertEquals('9876543210', InputNormalizer::normalizeMobile10('9876543210'));
        $this->assertEquals('9876543210', InputNormalizer::normalizeMobile10('+91 98765 43210'));
        $this->assertEquals('9876543210', InputNormalizer::normalizeMobile10('09876543210'));

        $this->assertNull(InputNormalizer::normalizeMobile10('12345'));
        $this->assertNull(InputNormalizer::normalizeMobile10('9876543210123'));
        $this->assertNull(InputNormalizer::normalizeMobile10(''));
        $this->assertNull(InputNormalizer::normalizeMobile10(null));
    }

    public function test_capitalizes_words_and_sentences(): void
    {
        $this->assertEquals('Ganesh Kumar', InputNormalizer::capitalizeWords('  ganesh   kumar  '));
        $this->assertEquals('SMR Battery', InputNormalizer::capitalizeWords('SMR battery'));
        $this->assertEquals('Door no 12, main road', InputNormalizer::capitalizeFirst('  door no 12, main road  '));
    }
}
