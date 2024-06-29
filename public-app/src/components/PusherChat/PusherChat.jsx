import React, { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import Axios from 'axios';
import './Chat.css';
import DefaultMaleImage from "../../male-default-profile-picture.png";
import DefaultFemaleImage from "../../female-default-profile-picture.png";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Webcam from 'react-webcam';
import Swal from 'sweetalert2';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/default.css';
import MessageList from './MessageList';
import AudioRecorder from '../AudioRecorder/AudioRecorder';
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
        //setMessages((prevMessages) => [newMessage, ...prevMessages]);
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
    sendTypingStatus(false);
    if (isAiEnabled) {
      // Send "AI is thinking" message
      setIsThinking(true);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: true });

      generateResponse(); // Call generateResponse if isAiEnabled is true
    }
    fetchMessages(); // Fetch messages after sending a new message
  };

  const handleAiCheckboxChange = (e) => {
    setIsAiEnabled(e.target.checked);
  };

const generateResponse = async () => {
  try {
    const response = await Axios.post(
      `${API_BASE_URL}/api/guest/generate-response`,
      { prompt: message }
    );

    console.log(response.data.response);

    const messgeForHighliht = response.data.response;

    const highlightedHTML = hljs.highlightAuto(messgeForHighliht).value;

    // Create the AI response message object with highlighted message
    const aiResponseMessage = {
      username: 'AI',
      message: highlightedHTML, // Use the highlighted response
      messagePlain: response.data.response,
      created_at: new Date().toISOString(),
    };

    // Save the AI response message to the database
    await saveMessageToDatabase(aiResponseMessage);

    // Update the messages state
    //setMessages((prevMessages) => [aiResponseMessage, ...prevMessages]);

    // Handle AI response (display in chat, etc.)
    setIsThinking(false);
    await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });

    // Fetch updated messages
    fetchMessages();
  } catch (error) {
    console.error('Error:', error);
  }
};

const saveMessageToDatabase = async (message) => {
  try {
    await Axios.post(`${API_BASE_URL}/api/guest/save-message`, message);
    console.log('Message saved to database successfully:', message);
  } catch (error) {
    console.error('Error saving message to database:', error);
  }
};

  return (
    <>
    <div className="chat-container">
      <Button variant="primary" className='message-record-audio-button' onClick={handleRecordAudioShowModal}>
        {strings.record_audio}
      </Button>
      <MessageList messages={messages} DefaultMaleImage={DefaultMaleImage} DefaultFemaleImage={DefaultFemaleImage} />
      {typingIndicator && <div className="typing-indicator">{typingIndicator}</div>}
      {speechIndicator && <div className="typing-indicator">{speechIndicator}</div>}
      {isThinking && <div className="typing-indicator">{strings.aiTypingIndicator}</div>}
      <form className="message-form">
        <div>
          {strings.ask_from_ai}
          <input
            type="checkbox"
            className="message-ai"
            name="ai"
            checked={isAiEnabled}
            onChange={handleAiCheckboxChange}
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
    <Modal show={showRecordAudioShowModal} onHide={handleRecordAudioCloseModal}>
      <Modal.Header className='message-upload-modal' closeButton>
        <Modal.Title className='massage-upload-title'>{strings.capture_video_with_message}</Modal.Title>
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