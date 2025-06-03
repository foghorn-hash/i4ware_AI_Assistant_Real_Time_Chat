<?php

namespace App\Http\Controllers;

use Storage;
use App\Services\OpenAIService;
use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpPresentation\IOFactory;
use PhpOffice\PhpPresentation\Style\Color;
use PhpOffice\PhpPresentation\Style\Alignment;
use Illuminate\Support\Facades\Response;
use Illuminate\Http\Request;
use Auth;
use App\Models\User;


class PowerPointController extends Controller
{
    protected $user;
    protected $openAiService;

    public function __construct(OpenAIService $openAiService)
    {
        //$this->apiToken = uniqid(base64_encode(Str::random(40)));
        $this->middleware('auth:api', ["except" => ["generatePPT"]]);
        $this->user = new User;
        $this->openAiService = $openAiService;
    }

    public function generatePPT(Request $request)
    {
        $prompt = $request->input('prompt');
        $aiResponse = $this->openAiService->askChatGPT($prompt);

        $objPHPPresentation = new \PhpOffice\PhpPresentation\PhpPresentation();
        $slide = $objPHPPresentation->getActiveSlide();

        $shape = $slide->createRichTextShape()
            ->setHeight(300)->setWidth(600)->setOffsetX(100)->setOffsetY(100);
        $shape->getActiveParagraph()->getAlignment()->setHorizontal(\PhpOffice\PhpPresentation\Style\Alignment::HORIZONTAL_LEFT);

        // Split AI response into lines and add each as a new paragraph
        foreach (preg_split('/\r\n|\r|\n/', $aiResponse) as $line) {
            $textRun = $shape->createTextRun($line);
            $textRun->getFont()->setSize(20)->setColor(new \PhpOffice\PhpPresentation\Style\Color(\PhpOffice\PhpPresentation\Style\Color::COLOR_BLACK));
            $shape->createParagraph(); // New paragraph for each line
        }

        $filename = 'chatgpt_output_' . uniqid() . '.pptx';
        $path = storage_path("app/public/$filename");

        \PhpOffice\PhpPresentation\IOFactory::createWriter($objPHPPresentation, 'PowerPoint2007')->save($path);

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'message' => $aiResponse
        ]);
    }
    
}
