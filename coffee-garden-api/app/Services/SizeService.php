<?php

namespace App\Services;

use App\Models\Size;

class SizeService
{
    public function all()
    {
        return Size::all();
    }

    public function productSizes($id)
    {
        return Size::where('product_id', $id)->get();
    }

    public function create(array $data)
    {
        return Size::create($data);
    }

    public function update(Size $size, array $data)
    {
        $size->update($data);
        return $size;
    }

    public function delete(Size $size)
    {
        return $size->delete();
    }
}
