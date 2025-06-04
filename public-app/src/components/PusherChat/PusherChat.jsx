import React, { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import Axios from 'axios';
import './Chat.css';
import DefaultMaleImage from "../../male-default-profile-picture.png";
import DefaultFemaleImage from "../../female-default-profile-picture.png";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2';
import MessageList from './MessageList';
import AudioRecorder from '../AudioRecorder/AudioRecorder';
import { Mic } from 'react-bootstrap-icons';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { API_BASE_URL, API_DOMAIN, API_DEFAULT_LANGUAGE, API_PUSHER_KEY, API_PUSHER_CLUSTER } from "../../constants/apiConstants";
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
  en: {
    send: "Send",
    typing: "is typing...",
    box: "Write a message...",
    browse: "Browse",
    capturePhoto: "Take a Photo",
    upload_image_with_message: "Upload Image with Message",
    capture_image_with_message: "Capture Image with Message",
    capture_video_with_message: "Capture Video with Message",
    ask_from_ai: "Ask from AI",
    close: "Close",
    enter_your_message: "Enter your message here...",
    start_video: "Start Video",
    stop_video: "Stop Video",
    upload: "Upload",
    duration: "Duration",
    upload_successful: "Upload Successful",
    image_upload_successful: "Image upload success",
    capture_successful: "Image capture success",
    video_capture_successful: "Video capture success",
    please_select_file: "Please select a file to upload.",
    failed_to_upload_file: "Failed to upload file. Please try again.",
    your_browser_not_support_video_tag: "Your browser does not support the video tag.",
    aiTypingIndicator: "AI is thinking...",
    record_audio: "Record Audio",
    speech: "is recoding speech...",
    speech_to_text: "Speech to Text",
    generate_image: "Generate Image",
    generate_word: "Generate Word Document",
    generate_ppt: "Generate PowerPoint Presentation",
    // ROHTO engineering form fields
    rohto_role_label: "Role (who am I / who am I asking you to be?)",
    rohto_role_placeholder: "E.g. 'Act as an AI assistant' or 'I am a lawyer...'",
    rohto_problem_label: "Instructions (what are the instructions?)",
    rohto_problem_placeholder: "Describe your instructions or question",
    rohto_history_label: "Notes (what are your observations?)",
    rohto_history_placeholder: "Break the task into clear steps to clarify the answer",
    rohto_goal_label: "Goal (what do you want to achieve?)",
    rohto_goal_placeholder: "Describe what you hope as a result",
    rohto_expectation_label: "Relevance (what kind of answer do you expect?)",
    rohto_expectation_placeholder: "Specify what you want it to address and what to leave out",
    rohto_for_prompt: "My question is",
    rohto_disable: "Disable ROHTO",
    rohto_enable: "Enable ROHTO",
  },
  fi: {
    send: "Lähetä",
    typing: "kirjoittaa...",
    box: "Kirjoita viesti...",
    browse: "Selaa",
    capturePhoto: "Ota Kuva",
    upload_image_with_message: "Lataa kuva viestin kassa",
    capture_image_with_message: "Kaappaa kuva viestin kanssa",
    capture_video_with_message: "Kaappaa video viestin kanssa",
    ask_from_ai: "Kysy tekoälyltä",
    close: "Sulje",
    enter_your_message: "Kirjoita viestisi tähän...",
    start_video: "Aloita Video",
    stop_video: "Lopeta Video",
    upload: "Lataa",
    duration: "Kesto",
    upload_successful: "Lataus onnistui",
    image_upload_successful: "Kuvan lataus onnistui",
    capture_successful: "Kuvan kaappaus onnistui",
    video_capture_successful: "Videon kaappaus onnistui",
    please_select_file: "Olehyvä ja valitse tiedosto minkä haluat ladata.",
    failed_to_upload_file: "Tiedoston lataus epäonnistui. Olehyvä ja yritä uudestaan.",
    your_browser_not_support_video_tag: "Selaimesi ei tue video tagia.",
    aiTypingIndicator: "Tekoäly miettii ...",
    record_audio: "Nauhoita ääni",
    speech: "nauhoittaa puhetta...",
    speech_to_text: "Puhe tekstiksi",
    generate_image: "Luo kuva",
    generate_word: "Luo Word-asiakirja",
    generate_ppt: "Luo PowerPoint-esitys",
    // ROHTO engineering form fields
    rohto_role_label: "Rooli (kuka minä olen / ketä pyydän olemaan?)",
    rohto_role_placeholder: "Esim. 'Toimi tekoälyavustajana' tai 'Olen lakimies...'",
    rohto_problem_label: "Ohjeet (mitkä ovat ohjeet?)",
    rohto_problem_placeholder: "Kuvaa ohjeesi tai kysymyksesi",
    rohto_history_label: "Huomiot (mitkä ovat huomiosi?)",
    rohto_history_placeholder: "Jaa tehtävä selkeisiin vaiheisiin vastauksen selkeyttämiseksi",
    rohto_goal_label: "Tavoite (mitä haluat saavuttaa?)",
    rohto_goal_placeholder: "Kerro mitä toivot tulokseksi",
    rohto_expectation_label: "Osuvuus (millaista vastausta odotat?)",
    rohto_expectation_placeholder: "Tarkenna mitä haluat sen käsittelevän ja jättävän pois",
    rohto_for_prompt: "Kysymykseni on",
    rohto_disable: "Poista ROHTO käytöstä",
    rohto_enable: "Ota ROHTO käyttöön",
  },
  se: {
    send: "Skicka",
    typing: "skriver...",
    box: "Skriv meddelande...",
    browse: "Bläddra",
    capturePhoto: "Ta en bild",
    upload_image_with_message: "Ladda upp bild med meddelande",
    capture_image_with_message: "Fånga bild med meddelande",
    capture_video_with_message: "Fånga video med meddelande",
    ask_from_ai: "Fråga en AI",
    close: "Stäng",
    enter_your_message: "Skriv ditt meddelande här...",
    start_video: "Starta video",
    stop_video: "Stoppa video",
    upload: "Ladda upp",
    duration: "Varaktighet",
    upload_successful: "Uppladdning lyckades",
    image_upload_successful: "Bilduppladdning lyckades",
    capture_successful: "Bildupptagning lyckades",
    video_capture_successful: "Videoupptagning lyckades",
    please_select_file: "Vänligen välj en fil att ladda upp.",
    failed_to_upload_file: "Misslyckades med att ladda upp filen. Försök igen.",
    your_browser_not_support_video_tag: "Din webbläsare stöder inte videomarkeringen.",
    aiTypingIndicator: "AI tänker ...",
    record_audio: "Spela in ljud",
    speech: "spela in tal...",
    speech_to_text: "Tal till text",
    generate_image: "Generera bild",
    generate_word: "Generera Word-dokument",
    generate_ppt: "Generera PowerPoint-presentation",
    // ROHTO engineering form fields
    rohto_role_label: "Roll (vem är jag / vem ber jag dig vara?)",
    rohto_role_placeholder: "T.ex. 'Agera som AI-assistent' eller 'Jag är jurist...'",
    rohto_problem_label: "Instruktioner (vilka är instruktionerna?)",
    rohto_problem_placeholder: "Beskriv dina instruktioner eller din fråga",
    rohto_history_label: "Anteckningar (vilka är dina observationer?)",
    rohto_history_placeholder: "Dela upp uppgiften i tydliga steg för att förtydliga svaret",
    rohto_goal_label: "Mål (vad vill du uppnå?)",
    rohto_goal_placeholder: "Beskriv vad du hoppas som resultat",
    rohto_expectation_label: "Relevans (vilket slags svar förväntar du dig?)",
    rohto_expectation_placeholder: "Specificera vad du vill att det ska ta upp och vad som ska utelämnas",
    rohto_for_prompt: "Min fråga är",
    rohto_disable: "Inaktivera ROHTO",
    rohto_enable: "Aktivera ROHTO",
  }
});

const PusherChat = () => {
  const [username, setUsername] = useState('Guest');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingIndicator, setTypingIndicator] = useState('');
  const [speechIndicator, setSpeechIndicator] = useState('');
  const [aiTypingIndicator, setAiTypingIndicator] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(false); // State to track AI checkbox
  const [isGenerateEnabled, setIsGenerateEnabled] = useState(false); // State to track AI checkbox
  const [isGenerateWordEnabled, setIsGenerateWordEnabled] = useState(false);
  const [isGeneratePPTEnabled, setIsGeneratePPTEnabled] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showRecordAudioShowModal, setRecordAudioShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isCapturingVideo, setIsCapturingVideo] = useState(false);
  const [videoUploading, setvideoUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [role, setRole] = useState('');
  const [problem, setProblem] = useState('');
  const [history, setHistory] = useState('');
  const [goal, setGoal] = useState('');
  const [expectation, setExpectation] = useState('');
  const [showPromptOverlay, setShowPromptOverlay] = useState(false);
  const [isRohtoEnabled, setIsRohtoEnabled] = useState(true); // Add this state

  const enableRohto = () => setIsRohtoEnabled(true);
  const disableRohto = () => setIsRohtoEnabled(false);
  const toggleRohto = () => setIsRohtoEnabled((prev) => !prev);

  const handleRecordAudioShowModal = () => setRecordAudioShowModal(true);
  const handleRecordAudioCloseModal = () => setRecordAudioShowModal(false);

  var query = window.location.search.substring(1);
  var urlParams = new URLSearchParams(query);
  var localization = urlParams.get('lang');

  if (localization == null) {
    strings.setLanguage(API_DEFAULT_LANGUAGE);
  } else {
    strings.setLanguage(localization);
  }

  // Initialize Pusher and fetch initial messages
  useEffect(() => {
    const cleanup = initializePusher();
    fetchMessages(); // Fetch messages on component mount
    return cleanup;
  }, []);

  const initializePusher = () => {
    const pusher = new Pusher(API_PUSHER_KEY, { cluster: API_PUSHER_CLUSTER });
    const channel = pusher.subscribe(API_DOMAIN + '_chat');

    channel.bind('message', (newMessage) => {
        fetchMessages();
    });

    channel.bind('user-typing', ({ username: typingUsername, isTyping }) => {
        if (isTyping) {
            setTypingIndicator(`${typingUsername} ${strings.typing}`);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTypingIndicator('');
            }, 1000);
        }
    });

    channel.bind('user-speech', ({ username: speechUsername, isSpeech }) => {
      if (isSpeech) {
        setSpeechIndicator(`${speechUsername} ${strings.speech}`);
      } else {
        setSpeechIndicator('');
      }
    });

    channel.bind('ai-thinking', function (data) {
      setIsThinking(data.isThinking);
    });    

    return () => {
        channel.unbind_all();
        channel.unsubscribe();
        clearTimeout(typingTimeoutRef.current);
    };
  };

  const fetchMessages = () => {
    Axios.get(`${API_BASE_URL}/api/guest/messages`)
      .then((response) => {
        setMessages(response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch messages', error);
      });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 500);
    sendTypingStatus(true);
  };

  const sendTypingStatus = async (isTyping) => {
    await Axios.post(`${API_BASE_URL}/api/guest/typing`, { username, isTyping }).catch((error) => console.error('Error sending typing status', error));
  };

  const sendSpeechStatus = async (isSpeech) => {
    await Axios.post(`${API_BASE_URL}/api/guest/speech`, { username, isSpeech }).catch((error) => console.error('Error sending speech status', error));
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    await Axios.post(`${API_BASE_URL}/api/guest/messages`, { username, message });
    setMessage('');
    try {
      sendTypingStatus(false);
      if (isAiEnabled) {
        setIsThinking(true);
        await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: true });
        await generateResponse();
      } else if (isGenerateEnabled) {
        setIsThinking(true);
        await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: true });
        await generateImage();
      } else if (isGenerateWordEnabled) {
        await generateAndDownloadWord();
      } else if (isGeneratePPTEnabled) {
        await generateAndDownloadPPT();
      } else {
        await Axios.post(`${API_BASE_URL}/api/guest/messages`, { username, message });
        setMessage('');
        fetchMessages(); // Fetch messages after sending user message
      }
      setMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleAiCheckboxChange = (e) => {
    setIsAiEnabled(e.target.checked);
    if (e.target.checked) {
      setIsGenerateEnabled(false);
      setIsGenerateWordEnabled(false);
      setIsGeneratePPTEnabled(false);
    }
  };

  const handleGenerateCheckboxChange = (e) => {
    setIsGenerateEnabled(e.target.checked);
    if (e.target.checked) {
      setIsAiEnabled(false);
      setIsGenerateWordEnabled(false);
      setIsGeneratePPTEnabled(false);
    }
  };

  const handleGenerateCheckboxWordChange = (e) => {
    setIsGenerateWordEnabled(e.target.checked);
    if (e.target.checked) {
      setIsAiEnabled(false);
      setIsGenerateEnabled(false);
      setIsGeneratePPTEnabled(false);
    }
  };

  const handleGenerateCheckboxPPTChange = (e) => {
    setIsGeneratePPTEnabled(e.target.checked);
    if (e.target.checked) {
      setIsAiEnabled(false);
      setIsGenerateEnabled(false);
      setIsGenerateWordEnabled(false);
    }
  };

  const generateResponse = async () => {
    let fullPrompt;
    if (isRohtoEnabled) {
      fullPrompt = `
        ${strings.rohto_role_label}: ${role}
        ${strings.rohto_problem_label}: ${problem}
        ${strings.rohto_history_label}: ${history}
        ${strings.rohto_goal_label}: ${goal}
        ${strings.rohto_expectation_label}: ${expectation}
        ${strings.rohto_for_prompt}: ${message}
      `.trim();
    } else {
      // If ROHTO is disabled, just send the message as the prompt
      fullPrompt = message;
    }
    try {
      const response = await Axios.post(`${API_BASE_URL}/api/guest/generate-response`, { prompt: fullPrompt });
      const highlightedHTML = response.data.response;
      const aiResponseMessage = {
        username: 'AI',
        message: highlightedHTML,
        generate: false,
        created_at: new Date().toISOString(),
      };
      await saveMessageToDatabase(aiResponseMessage);
      setIsThinking(false);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });
      fetchMessages(); // Fetch messages after generating AI response
    } catch (error) {
      console.error('Error:', error);
      setIsThinking(false);
    }
  };

  const generateImage = async () => {
    try {
      const response = await Axios.post(`${API_BASE_URL}/api/guest/generate-image`, { prompt: message, generate: true });
      const highlightedHTML = response.data.response;
      const aiResponseMessage = {
        username: 'AI',
        generate: true,
        message: highlightedHTML,
        created_at: new Date().toISOString(),
      };
      await saveMessageToDatabase(aiResponseMessage, 'image');
      setIsThinking(false);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });
      fetchMessages(); // Fetch messages after generating AI response
    } catch (error) {
      console.error('Error:', error);
      setIsThinking(false);
    }
  };

  const generateAndDownloadWord = async () => {
    let fullPrompt;
    if (isRohtoEnabled) {
      fullPrompt = `
        ${strings.rohto_role_label}: ${role}
        ${strings.rohto_problem_label}: ${problem}
        ${strings.rohto_history_label}: ${history}
        ${strings.rohto_goal_label}: ${goal}
        ${strings.rohto_expectation_label}: ${expectation}
        ${strings.rohto_for_prompt}: ${message}
      `.trim();
    } else {
      // If ROHTO is disabled, just send the message as the prompt
      fullPrompt = message;
    }
    try {
      await Axios.post(`${API_BASE_URL}/api/guest/messages`, { username, fullPrompt });
      fetchMessages(); // Fetch messages after sending user message
      setIsThinking(true);
      // 1. Generate the Word file in backend
      const response = await Axios.post(`${API_BASE_URL}/api/chatgpt/word/send`, { prompt: fullPrompt, generate: false });
      // Optionally, save the message to DB as before
      const highlightedHTML = response.data.message;
      const aiResponseMessage = {
        username: 'AI',
        generate: false,
        message: highlightedHTML,
        created_at: new Date().toISOString(),
        filename: response.data.filename || 'generated.docx', // Assuming backend returns a filename
        type: 'docx',
      };
      await saveMessageToDatabase(aiResponseMessage, 'docx');

      setIsThinking(false);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
      setIsThinking(false);
    }
  };

  const generateAndDownloadPPT = async () => {
    try {
      await Axios.post(`${API_BASE_URL}/api/guest/messages`, { username, message });
      fetchMessages(); // Fetch messages after sending user message
      setIsThinking(true);
      // 1. Generate the Word file in backend
      const response = await Axios.post(`${API_BASE_URL}/api/chatgpt/powerpoint/send`, { prompt: message, generate: false });
      // Optionally, save the message to DB as before
      const highlightedHTML = response.data.message;
      const aiResponseMessage = {
        username: 'AI',
        generate: false,
        message: highlightedHTML,
        created_at: new Date().toISOString(),
        filename: response.data.filename || 'generated.pptx', // Assuming backend returns a filename
        type: 'pptx',
      };
      await saveMessageToDatabase(aiResponseMessage, 'pptx');

      setIsThinking(false);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
      setIsThinking(false);
    }
  };

  const saveMessageToDatabase = async (message, type) => {
    try {
      await Axios.post(`${API_BASE_URL}/api/guest/save-message`, message, type);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  return (
    <>
    <div className="chat-container">
      <Button variant="primary" className='message-record-audio-button' onClick={handleRecordAudioShowModal}>
        <Mic />
      </Button>
      <MessageList messages={messages} DefaultMaleImage={DefaultMaleImage} DefaultFemaleImage={DefaultFemaleImage} />
      {typingIndicator && <div className="typing-indicator">{typingIndicator}</div>}
      {speechIndicator && <div className="typing-indicator">{speechIndicator}</div>}
      {isThinking && <div className="typing-indicator">{strings.aiTypingIndicator}</div>}
      <form className="message-form">
        <div className='message-ask-from-ai'>
          <Form.Check // prettier-ignore
            type="radio"
            className="message-ai"
            name="ai-options"
            label={strings.ask_from_ai}
            checked={isAiEnabled}
            onChange={handleAiCheckboxChange}
            value="ai"
          />
          <Form.Check // prettier-ignore
            type="radio"
            className="generate-image-ai"
            name="ai-options"
            label={strings.generate_image}
            checked={isGenerateEnabled}
            onChange={handleGenerateCheckboxChange}
            value="generate-image"
          />
          <Form.Check // prettier-ignore
            type="radio"
            className="generate-word-ai"
            name="ai-options"
            label={strings.generate_word}
            checked={isGenerateWordEnabled}
            onChange={handleGenerateCheckboxWordChange}
            value="generate-word"
          />
        </div>
        <textarea
          className="message-input"
          placeholder={strings.box}
          value={message}
          onChange={handleTyping}
          style={{ height: 'auto', minHeight: '50px' }}
        />
        <button className="send-button" onClick={submitMessage}>{strings.send}</button>
      </form>
    </div>
    <Button
        className='rohto-button'
        variant="outline-secondary"
        style={{ float: 'right', marginBottom: 10 }}
        onClick={() => setShowPromptOverlay(true)}
        disabled={!isRohtoEnabled}
      >
        ROHTO
      </Button>
      <Form.Check
        className='rohto-checkbox'
        type="checkbox"
        label={isRohtoEnabled ? strings.rohto_disable : strings.rohto_enable}
        checked={isRohtoEnabled}
        onChange={toggleRohto}
        style={{ float: 'right', marginRight: 10, marginBottom: 10, color: 'white' }}
      />
    {/* ROHTO Prompt Overlay */}
    <Offcanvas
      show={showPromptOverlay}
      onHide={() => setShowPromptOverlay(false)}
      placement="end"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>ROHTO AI Prompt</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>{strings.rohto_role_label}</Form.Label>
            <Form.Control
              className='prompt-textarea'
              as="textarea"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={strings.rohto_role_placeholder}
              disabled={!isRohtoEnabled}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{strings.rohto_problem_label}</Form.Label>
            <Form.Control
              className='prompt-textarea'
              as="textarea"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={strings.rohto_problem_placeholder}
              disabled={!isRohtoEnabled}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{strings.rohto_history_label}</Form.Label>
            <Form.Control
              className='prompt-textarea'
              as="textarea"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder={strings.rohto_history_placeholder}
              disabled={!isRohtoEnabled}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{strings.rohto_goal_label}</Form.Label>
            <Form.Control
              className='prompt-textarea'
              as="textarea"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={strings.rohto_goal_placeholder}
              disabled={!isRohtoEnabled}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{strings.rohto_expectation_label}</Form.Label>
            <Form.Control
              className='prompt-textarea'
              as="textarea"
              value={expectation}
              onChange={(e) => setExpectation(e.target.value)}
              placeholder={strings.rohto_expectation_placeholder}
              disabled={!isRohtoEnabled}
            />
          </Form.Group>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
    <Modal show={showRecordAudioShowModal} onHide={handleRecordAudioCloseModal}>
      <Modal.Header className='message-upload-modal' closeButton>
        <Modal.Title className='massage-upload-title'>{strings.speech_to_text}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='message-upload-modal'>
        <AudioRecorder fetchMessages={fetchMessages} isThinking={isThinking} setIsThinking={setIsThinking} setSpeechIndicator={setSpeechIndicator} sendSpeechStatus={sendSpeechStatus} />
      </Modal.Body>
      <Modal.Footer className='message-upload-modal'>
        <Button variant="secondary" onClick={handleRecordAudioCloseModal}>
          {strings.close}
        </Button>
      </Modal.Footer>
    </Modal>
  </>
  );
};

export default PusherChat;
