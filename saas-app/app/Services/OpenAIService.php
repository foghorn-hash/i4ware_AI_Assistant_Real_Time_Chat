<?php

namespace App\Services;

use GuzzleHttp\Client;

class OpenAIService
{
    protected $client;
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY');
        $this->client = new Client([
            'base_uri' => 'https://api.openai.com',
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
            ],
        ]);
    }

    public function generateText($prompt)
    {
        // Assuming 'transcription' is a variable containing user input or text
        $transcription = $prompt;

        // Define the messages array
        $messages = [
            [
                "role" => "system",
                "content" => "You are a helpful assistant."
            ],
            [
                "role" => "user",
                "content" => $transcription
            ]
        ];

        $response = $this->client->post('/v1/chat/completions', [
            'json' => [
                'model' => 'gpt-4o',
                'messages' => $messages,
                'max_tokens' => (integer) env('OPENAI_MAX_TOKENS'),
            ],
        ]);

        return json_decode($response->getBody(), true)['choices'][0]['message']['content'] ?? '';
    }

    public function synthesizeSpeech($text, $voice)
    {

         // Map voice parameter to appropriate model and voice
         switch ($voice) {
            case 'alloy':
                $model = 'tts-1';
                $voiceName = 'alloy';
                break;
            case 'shimmer':
                $model = 'tts-1';
                $voiceName = 'shimmer';
                break;
            case 'onyx':
                $model = 'tts-1';
                $voiceName = 'onyx';
                break;
            default:
                throw new \Exception('Invalid voice parameter.');
        }

        $response = $this->client->post('/v1/audio/speech', [
            'json' => [
                'model' => $model,
                'input' => $text,
                'voice' => $voiceName,
            ],
        ]);

        return $response->getBody()->getContents();
    }
}
