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
use App\Services\MarkdownService;
use Illuminate\Support\Facades\Validator;

class GuestController extends Controller
{
    protected $user;
    protected $openaiService;
    protected $markdownService;

    public function __construct(OpenAIService $openaiService, MarkdownService $markdownService)
    {
        //$this->apiToken = uniqid(base64_encode(Str::random(40)));
        $this->middleware('auth:api', ["except" => ["message", "getMessages", "userTyping", "speech", "generateResponse", "saveMessageToDatabase", "thinking", "synthesize", "transcribe"]]);
        $this->user = new User;
        $this->openaiService = $openaiService;
        $this->markdownService = $markdownService;
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
        $response = $this->openaiService->generateText($prompt);

        return response()->json(['response' => $response]);
    }

    public function saveMessageToDatabase(Request $request)
    {       

        // Validate incoming request data
        $validator = Validator::make($request->all(), [
            'messagePlain' => 'required|string',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $prompt = $request->input('message');

        // Extract message content from request
        $promptPlain = $request->input('messagePlain');

        // Check if the message contains code
        $containsCode = $this->containsCode($promptPlain);

        // Apply syntax highlighting if message contains code
        if ($containsCode) {
            $highlightedMessage = $this->applySyntaxHighlighting($this->markdownService->parse(highlight_string($prompt)));
        } else {
            $highlightedMessage = $this->markdownService->parse($promptPlain); // No syntax highlighting needed
        }

        // Create new message
        $message = new MessageModel();
        $message->username = "AI";
        $message->user_id = null;
        $message->domain = env('APP_DOMAIN_ADMIN');
        $message->message = $highlightedMessage;
        $message->gender = $request->input('gender');
        $message->save();

        // Trigger an event for the new message
        event(new MessagePublic("AI", $promptPlain));

        return response()->json(['success' => 'Message saved successfully'], 200);
    }

    // Function to detect if message contains code
    private function containsCode($message)
    {
        // Implement your code detection logic here
        // For example, you can use regular expressions to detect code snippets
        // Modify this according to your specific needs
        return preg_match('/<code>(.*?)<\/code>/', $message);
    }

    // Function to apply syntax highlighting to code within the message
    private function applySyntaxHighlighting($message)
    {
        // Implement syntax highlighting logic using a library like `highlight.js` or `Prism.js`
        // For demonstration, you can use a placeholder method
        return $message; // Placeholder: return the original message (no syntax highlighting)
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

        $audioContent = $this->openaiService->synthesizeSpeech($text, $voice);

        $fileName = 'audio/' . uniqid() . '.mp3';
        Storage::disk('public')->put($fileName, $audioContent);

        // Update the message with the new audio path
        if ($message) {
            $message->audio_path = $fileName;
            $message->save();
        }

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
        $transcription = $this->openaiService->transcribeSpeech($audioPath);

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
