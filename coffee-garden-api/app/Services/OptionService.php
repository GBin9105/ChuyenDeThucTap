<?php

namespace App\Services;

use App\Models\Option;

class OptionService
{
    public function all()
    {
        return Option::all();
    }

    public function create(array $data)
    {
        return Option::create($data);
    }

    public function update(Option $option, array $data)
    {
        $option->update($data);
        return $option;
    }

    public function delete(Option $option)
    {
        return $option->delete();
    }
}
