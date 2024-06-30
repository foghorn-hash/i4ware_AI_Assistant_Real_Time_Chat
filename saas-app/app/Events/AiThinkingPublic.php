<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Auth;

class AiThinkingPublic implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $username;
    public $isThinking;

    public function __construct($username, $isThinking)
    {
        $this->username = $username;
        $this->isThinking = $isThinking;
    }

    public function broadcastOn()
    {
        return new Channel(env('APP_DOMAIN_ADMIN') . '_chat');
    }

    public function broadcastAs()
    {
        return 'ai-thinking';
    }
}

