<?php

// app/Console/Commands/OpenAIRealtime.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Ratchet\Client\Connector;
use Ratchet\Client\WebSocket;
use React\EventLoop\Factory as LoopFactory;
use App\Events\OpenAIResponseReceived;

class OpenAIRealtime extends Command
{
    protected $signature = 'openai:realtime';
    protected $description = 'Connect to OpenAI Realtime API and broadcast responses';

    public function handle()
    {
        $loop = LoopFactory::create();
        $connector = new Connector($loop);

        $url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

        $connector($url, [], [
            'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
            'OpenAI-Beta' => 'realtime=v1',
        ])->then(function (WebSocket $ws) {
            // Connected to OpenAI
            $ws->send(json_encode([
                'type' => 'response.create',
                'response' => [
                    'modalities' => ['text'],
                    'instructions' => 'Please assist the user.',
                ]
            ]));

            $ws->on('message', function ($message) {
                $response = json_decode($message, true);
                
                // Broadcast the response to the frontend
                broadcast(new OpenAIResponseReceived($response));
            });

            $ws->on('close', function () {
                echo "Connection closed\n";
            });
        }, function ($e) {
            echo "Could not connect: {$e->getMessage()}\n";
        });

        $loop->run();
    }
}
