<?php

namespace App\Http\Controllers;

use App\Events\MessagePublic;
use App\Events\UserTypingPublic;
use App\Events\AiThinkingPublic;
use App\Events\UserSpeechPublic;
use App\Models\Message as MessageModel;
use Illuminate\Http\Request;
use App\Models\User;
use Auth;
use Storage;
use App\Services\OpenAIService;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class GuestController extends Controller
{
    protected $user;
    protected $openAiService;
    protected $markdownService;

    public function __construct(OpenAIService $openAiService)
    {
        //$this->apiToken = uniqid(base64_encode(Str::random(40)));
        $this->middleware('auth:api', ["except" => ["message", "getMessages", "userTyping", "speech", "generateResponse", "generateImage", "saveMessageToDatabase", "thinking", "synthesize", "transcribe"]]);
        $this->user = new User;
        $this->openAiService = $openAiService;
    }

    /**
     * Handle the incoming chat messages.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function message(Request $request)
    {

        // Create a new message using the authenticated user's ID
        $message = new MessageModel();
        $message->user_id = null; // Assign the user_id to the message
        $message->domain = env('APP_DOMAIN_ADMIN');
        $message->username = 'Guest';
        $message->message = $request->input('message');
        $message->save();

        // Trigger an event for the new message
        event(new MessagePublic('Guest', $request->input('message')));

        return response()->json(['status' => 'Message sent successfully!'], 200);
    }

    /**
     * Retrieve the latest chat messages.
     *
     * @return \Illuminate\Http\Response
     */
    public function getMessages()
    {
        // Select messages including those with user_id = 0 but only if the domain matches
        $messages = MessageModel::select('messages.*', 'users.profile_picture_path', 'users.gender')
            ->leftJoin('users', 'messages.user_id', '=', 'users.id') // Left join with 'users' table
            ->where(function ($query) {
                $query->where('messages.domain', '=', env('APP_DOMAIN_ADMIN'))
                    ->orWhere(function ($query) {
                        $query->where('messages.user_id', '=', null)
                            ->where('messages.domain', '=', env('APP_DOMAIN_ADMIN'));
                    }); // Include messages with user_id = NULL only if domain matches
            })
            ->orderBy('messages.created_at', 'desc')
            ->get()
            ->map(function ($message) {
                // Format the created_at datetime field to a custom format
                $message->formatted_created_at = $message->created_at->format('Y-m-d H:i:s'); // Customize this format as needed

                return $message;
            });

        return response()->json($messages);
    }

    public function userTyping(Request $request)
    {
        $username = 'Guest';
        $isTyping = $request->isTyping;
    
        broadcast(new UserTypingPublic($username, $isTyping))->toOthers();
    
        return response()->json(['status' => 'success']);
    }

    public function speech(Request $request)
    {
        $username = 'Guest';
        $isSpeech = $request->isSpeech;
    
        broadcast(new UserSpeechPublic($username, $isSpeech))->toOthers();
    
        return response()->json(['status' => 'success', 'message' => $isSpeech]);
    }

    public function generateResponse(Request $request)
    {

        $prompt = $request->input('prompt');
        $response = $this->openAiService->generateText($prompt);

        return response()->json(['response' => $response]);
    }

    public function generateImage(Request $request) {
        
        $prompt = $request->input('prompt');
        $response = $this->openAiService->generateImage($prompt);

        return response()->json(['response' => $response]);

    }

    public function saveMessageToDatabase(Request $request)
    {       
        $data = $request->all();
        $generate = $data['generate'] ?? false;
        $type = $data['type'] ?? 'text'; // Default to text if not specified

        $message = new MessageModel();

        if ($generate === true) {
            // Image message
            if (isset($data['message']['data'][0]['url'])) {
                $file = file_get_contents($data['message']['data'][0]['url']);
                $fileName = 'ai_images/' . uniqid() . '.png';
                Storage::disk('public')->put($fileName, $file);

                $message->username = "AI";
                $message->user_id = null;
                $message->domain = env('APP_DOMAIN_ADMIN');
                $message->image_path = 'storage/' . $fileName;
                $message->message = $data['message']['data'][0]['revised_prompt'] ?? '';
                $message->type = "image";
                $message->gender = "male";
                $prompt = $message->message;
            } else {
                // Fallback for missing image data
                $message->username = "AI";
                $message->user_id = null;
                $message->domain = env('APP_DOMAIN_ADMIN');
                $message->message = '';
                $message->type = "image";
                $message->gender = "male";
                $prompt = '';
            }
        } else {

            if ($type === 'docx') {
                
            // Text/Word message
            $prompt = $data['message'] ?? '';
            $filename = $data['filename'] ?? null; // filename should be sent from frontend after Word file is generated

            $message->username = "AI";
            $message->user_id = null;
            $message->domain = env('APP_DOMAIN_ADMIN');
            $message->message = $prompt; // Convert newlines to <br> for HTML display
            $message->file_path = 'storage/' . $filename; // Store the file path for the Word document
            $message->download_link = url('/storage/' . $filename); // No image path for Word documents
            $message->type = "docx";
            $message->gender = "male";
            
            } else if ($type === 'pptx') {
                    
                    // Text/PowerPoint message
                    $prompt = $data['message'] ?? '';
                    $filename = $data['filename'] ?? null; // filename should be sent from frontend after PowerPoint file is generated
                    $message->file_path = 'storage/' . $filename; // Store the file path for the Word document
                    $message->download_link = url('/storage/' . $filename); // No image path for Word documents
                    $message->username = "AI";
                    $message->user_id = null;
                    $message->domain = env('APP_DOMAIN_ADMIN');
                    $message->message = $prompt; // Convert newlines to <br> for HTML display
                    $message->type = "pptx";
                
            } else {
                // Create new message
                $prompt = $request['message'];

                $highlightedMessage = $prompt; // No syntax highlighting needed
                
                $message->username = "AI";
                $message->user_id = null;
                $message->domain = env('APP_DOMAIN_ADMIN');
                $message->message = $highlightedMessage;
                $message->gender = "male";
            }
        }
        // Save the message to the database

        $message->save();

        // Trigger an event for the new message
        event(new MessagePublic("AI", $prompt));

        return response()->json(['success' => 'Message saved successfully'], 200);
    }

    public function thinking(Request $request)
    {
        $user = "AI";
        $isThinking = $request->isThinking;

        broadcast(new AiThinkingPublic($user, $isThinking))->toOthers();

        return response()->json(['status' => 'Thinking Message Sent!', 'message' => $isThinking]);
    }

    public function synthesize(Request $request)
    {
        $messageId = $request->input('message_id');
        $text = $request->input('text');
        $defaultVoice = $request->input('voice', 'alloy');

        // Retrieve the message by its ID
        $message = MessageModel::find($messageId);

        if ($message && $message->audio_path) {
            // If audio_path is not null, return the existing audio path
            return response()->json(['url' => Storage::url($message->audio_path)]);
        }

        // Determine the voice based on the gender
        $voice = $defaultVoice;
        if ($message && $message->gender) {
            if ($message->gender === 'male') {
                $voice = 'onyx'; // Replace with the actual male voice ID
            } else if ($message->gender === 'female') {
                $voice = 'shimmer'; // Replace with the actual female voice ID
            }
        }

        // Synthesize the speech
        $audioContent = $this->openAiService->synthesizeSpeech($text, $voice);

        // Generate a unique filename
        $fileName = 'audio/' . uniqid() . '.mp3';
        Storage::disk('public')->put($fileName, $audioContent);

        // Update the message with the new audio path
        if ($message) {
            $message->audio_path = $fileName;
            $message->save();
        }

        // Return the audio file URL
        return response()->json(['url' => Storage::url($fileName)]);
    }

    public function transcribe(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:ogg,mp3,wav',
        ]);

        $audioFile = $request->file('audio');
        $audioPath = $audioFile->store('audio', 'public');

        // Ensure the audioPath is correctly processed
        $transcription = $this->openAiService->transcribeSpeech($audioPath);

        // Create a new record in the database
        $message = new MessageModel();
        $message->username = 'Guest';
        $message->user_id = null;
        $message->domain = env('APP_DOMAIN_ADMIN');
        $message->message = $transcription ?? '';
        $message->gender = $request->input('gender');
        $message->save();

        // Trigger an event for the new message
        event(new MessagePublic('Guest', $transcription));

        return response()->json(['success' => true, 'transcription' => $transcription]);
    }

}
