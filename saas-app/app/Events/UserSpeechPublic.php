<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;

class UserSpeechPublic implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $username;
    public $isSpeech;

    public function __construct($username, $isSpeech)
    {
        $this->username = $username;
        $this->isSpeech= $isSpeech;
    }

    public function broadcastOn()
    {
        return new Channel(env('APP_DOMAIN_ADMIN') . '_chat');
    }

    public function broadcastAs()
    {
        return 'user-speech';
    }
}

