<?php

namespace App\Services;

use App\Models\Config;

class ConfigService
{
    public function getConfig()
    {
        return Config::pluck('value', 'key');
    }

    public function update(array $data)
    {
        foreach ($data as $key => $value) {
            Config::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return true;
    }
}
