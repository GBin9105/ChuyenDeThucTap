<?php

namespace App\Services;

use App\Models\Topping;

class ToppingService
{
    public function all()
    {
        return Topping::all();
    }

    public function productToppings($id)
    {
        return Topping::where('product_id', $id)->get();
    }

    public function create(array $data)
    {
        return Topping::create($data);
    }

    public function update(Topping $topping, array $data)
    {
        $topping->update($data);
        return $topping;
    }

    public function delete(Topping $topping)
    {
        return $topping->delete();
    }
}
