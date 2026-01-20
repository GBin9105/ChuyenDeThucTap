<?php

namespace App\Services;

use App\Models\Topic;

class TopicService
{
    public function all()
    {
        return Topic::all();
    }

    public function create(array $data)
    {
        return Topic::create($data);
    }

    public function update(Topic $topic, array $data)
    {
        $topic->update($data);
        return $topic;
    }

    public function delete(Topic $topic)
    {
        return $topic->delete();
    }
}
