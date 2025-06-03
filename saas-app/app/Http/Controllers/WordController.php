<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Storage;
use App\Services\OpenAIService;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Support\Facades\Response;
use Auth;
use App\Models\User;

class WordController extends Controller
{
    protected $user;
    protected $openAiService;

    public function __construct(OpenAIService $openAiService)
    {
        $this->middleware('auth:api', ["except" => ["generateWordFile"]]);
        $this->user = new User;
        $this->openAiService = $openAiService;
    }

    // POST /api/chatgpt/word/send
    public function generateWordFile(Request $request)
    {
        $prompt = $request->input('prompt');
        $aiResponse = $this->openAiService->askChatGPT($prompt);

        // Generate unique filename
        $filename = 'chatgpt_output_' . uniqid() . '.docx';
        $path = storage_path("app/public/$filename");

        // Create Word file
        $phpWord = new PhpWord();
        $section = $phpWord->addSection();
        foreach (preg_split('/\r\n|\r|\n/', $aiResponse) as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                $section->addTextBreak();
            } elseif (preg_match('/^\d+\./', $trimmed)) {
                // Numbered list
                $section->addListItem($trimmed, 0, null, 'number');
            } elseif (preg_match('/^- /', $trimmed)) {
                // Bullet list
                $section->addListItem(substr($trimmed, 2), 0, null, 'bullet');
            } elseif (preg_match('/^[A-Z][A-Za-z ]+:$/', $trimmed)) {
                // Heading (e.g., "Contact Information:")
                $section->addText($trimmed, ['bold' => true]);
            } else {
                $section->addText($trimmed);
            }
        }
        IOFactory::createWriter($phpWord, 'Word2007')->save($path);

        // Return filename to frontend
        return response()->json([
            'success' => true,
            'filename' => $filename,
            'message' => $aiResponse
        ]);
    }

}