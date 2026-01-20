<?php

namespace App\Services;

use App\Models\Banner;

class BannerService
{
    public function all()
    {
        return Banner::orderBy('position')->get();
    }

    public function create(array $data)
    {
        return Banner::create($data);
    }

    public function update(Banner $banner, array $data)
    {
        $banner->update($data);
        return $banner;
    }

    public function delete(Banner $banner)
    {
        return $banner->delete();
    }

    public function byPosition($position)
    {
        return Banner::where('position', $position)->get();
    }
}
