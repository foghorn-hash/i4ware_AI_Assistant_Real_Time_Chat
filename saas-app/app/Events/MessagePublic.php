<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Auth;

class MessagePublic implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $username;
    public $message;

    public function __construct($username, $message)
    {
        $this->username = $username;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        $user = Auth::user();
        return new Channel(env('APP_DOMAIN_ADMIN') . '_chat');
    }

    public function broadcastAs()
    {
        return 'message';
    }
}
