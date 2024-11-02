<?php

// app/Events/OpenAIResponseReceived.php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OpenAIResponseReceived implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $response;

    public function __construct($response)
    {
        $this->response = $response;
    }

    public function broadcastOn()
    {
        return new Channel(env('APP_DOMAIN_ADMIN') . '-openai-responses');
    }
}
