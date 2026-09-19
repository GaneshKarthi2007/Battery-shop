<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:vapid {--show : Output the keys only without modifying environment files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for Web Push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!getenv('OPENSSL_CONF')) {
            $storageCnf = storage_path('openssl.cnf');
            if (!file_exists($storageCnf)) {
                file_put_contents($storageCnf, "[ req ]\ndefault_bits = 2048\ndefault_md = sha256\n[ v3_ca ]\n");
            }
            putenv('OPENSSL_CONF=' . $storageCnf);
            $_ENV['OPENSSL_CONF'] = $storageCnf;
        }

        try {
            $keys = VAPID::createVapidKeys();
        } catch (\Throwable $e) {
            $keys = \App\Services\WebPushService::createVapidKeysFallback();
        }

        $this->info('VAPID Keys generated successfully:');
        $this->line('<comment>VAPID_PUBLIC_KEY=</comment>' . $keys['publicKey']);
        $this->line('<comment>VAPID_PRIVATE_KEY=</comment>' . $keys['privateKey']);

        if ($this->option('show')) {
            return 0;
        }

        $envFile = base_path('.env');
        if (file_exists($envFile)) {
            $content = file_get_contents($envFile);

            if (str_contains($content, 'VAPID_PUBLIC_KEY=')) {
                $content = preg_replace('/VAPID_PUBLIC_KEY=.*/', 'VAPID_PUBLIC_KEY=' . $keys['publicKey'], $content);
            } else {
                $content .= "\nVAPID_PUBLIC_KEY=" . $keys['publicKey'];
            }

            if (str_contains($content, 'VAPID_PRIVATE_KEY=')) {
                $content = preg_replace('/VAPID_PRIVATE_KEY=.*/', 'VAPID_PRIVATE_KEY=' . $keys['privateKey'], $content);
            } else {
                $content .= "\nVAPID_PRIVATE_KEY=" . $keys['privateKey'];
            }

            if (!str_contains($content, 'VAPID_SUBJECT=')) {
                $content .= "\nVAPID_SUBJECT=mailto:admin@batteryshop.com";
            }

            file_put_contents($envFile, $content);
            $this->info('.env file updated with VAPID keys.');
        }

        return 0;
    }
}
