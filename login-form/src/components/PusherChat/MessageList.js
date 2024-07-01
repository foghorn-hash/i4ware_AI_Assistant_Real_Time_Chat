import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL, ACCESS_TOKEN_NAME, API_DEFAULT_LANGUAGE } from "../../constants/apiConstants";
import Axios from 'axios';
import HighlightedResponse from './HighlightedResponse';
import { PlayFill, StopFill } from 'react-bootstrap-icons';
import CustomModal from './CustomModal'; // Import the custom modal component
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
  en: {
    your_browser_not_support_video_tag: "Your browser does not support the video tag.",
    generateSpeech: "Generate Speech",
    stopSpeech: "Stop Speech"
  },
  fi: {
    your_browser_not_support_video_tag: "Selaimesi ei tue video tagia.",
    generateSpeech: "Luo puhe",
    stopSpeech: "Pysäytä puhe"
  },
  se: {
    your_browser_not_support_video_tag: "Din webbläsare stöder inte videomarkeringen.",
    generateSpeech: "Generera tal",
    stopSpeech: "Stoppa tal"
  }
});

const MessageList = ({ messages, DefaultMaleImage, DefaultFemaleImage }) => {
  const messagesEndRef = useRef(null);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(<></>); // Initialize to an empty React fragment
  const [isVideo, setIsVideo] = useState(false); // Track if the modal content is a video

  var query = window.location.search.substring(1);
  var urlParams = new URLSearchParams(query);
  var localization = urlParams.get('lang');

  if (localization == null) {
    strings.setLanguage(API_DEFAULT_LANGUAGE);
  } else {
    strings.setLanguage(localization);
  }

  const processedMessages = Array.isArray(messages)
  ? [...messages].map((msg) => { 
    const profilePicUrl = msg.profile_picture_path
    ? `${API_BASE_URL}${msg.profile_picture_path.replace('public/uploads', '/storage/uploads')}`
    : null;
  const defaultImg = msg.gender === 'male' ? DefaultMaleImage : DefaultFemaleImage;

  return {
    ...msg,
    profilePicUrl,
    defaultImg
  }; })
  : [];

  const handleImageClick = (content, isVideoContent) => {
    setModalContent(content);
    setIsVideo(isVideoContent);
    setIsModalOpen(true);
  };

  const renderMessageImageOrVideo = (msg) => {
    if (msg.image_path) {
      const imageUrl = API_BASE_URL + '/' + msg.image_path;
      if (msg.type === 'image') {
        return (
          <>
            <br /><br />
            <img src={imageUrl} className="message-image" alt="Uploaded" onClick={() => handleImageClick(<img src={imageUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />, false)} />
          </>
        );
      } else {
        return (
          <>
            <br /><br />
            <video
              className='Webcam-video'
              style={{ cursor: 'pointer' }}
              onClick={() => handleImageClick(
                <video style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls={false}>
                  <source src={imageUrl} type="video/mp4" />
                  {strings.your_browser_does_not_support_video_tag}
                </video>,
                true
              )}
            >
              <source src={imageUrl} type="video/mp4" />
              {strings.your_browser_does_not_support_video_tag}
            </video>
          </>
        );
      }
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [currentAudioUrl]);

  const handleToggleSpeech = async (text, gender, messageId) => {
    if (currentMessageId === messageId) {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentMessageId(null);
        setCurrentAudio(null);
      }
      return;
    }
  
    if (currentAudio) {
      currentAudio.pause();
      setCurrentMessageId(null);
      setCurrentAudio(null);
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        setCurrentAudioUrl(null);
      }
    }
  
    let voice;
    switch (gender) {
      case 'male':
        voice = 'onyx';
        break;
      case 'female':
        voice = 'shimmer';
        break;
      default:
        voice = 'nova';
    }
  
    try {
      const response = await Axios.post(API_BASE_URL + '/api/chat/tts', { text, voice, message_id: messageId }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem(ACCESS_TOKEN_NAME)}` },
        });
  
      if (response.status !== 200) {
        throw new Error('Failed to fetch audio data');
      }
  
      const audioUrl = API_BASE_URL + '/' + response.data.url;
      const audio = new Audio(audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setCurrentMessageId(messageId);
      setCurrentAudioUrl(audioUrl);
  
      audio.onended = () => {
        setCurrentMessageId(null);
        setCurrentAudio(null);
        setCurrentAudioUrl(null);
      };
    } catch (error) {
      console.error('Error generating speech:', error);
    }
  };

  return (
    <div className="messages-list">
      {[...processedMessages].reverse().map((msg, index) => (
        <div key={index} className="message">
          <div className='message-date'>
            <strong>{msg.username}: </strong>
            <i>{msg.formatted_created_at}</i>
            <button className="message-TTS" onClick={() => handleToggleSpeech(msg.message, msg.gender, msg.id)}>
              {currentMessageId === msg.id ? <StopFill /> : <PlayFill />}
            </button>
          </div>
          <div className='massage-container'>
            <img src={msg.profilePicUrl || msg.defaultImg} className='message-avatar' alt={`Profile of ${msg.username}`} />
            <span>
              <HighlightedResponse markdown={msg.message} />
            </span>
            {/* Render image if image_path is not null */}
            {renderMessageImageOrVideo(msg)}
            <div className='message-clear' />
          </div>
        </div>
      ))}
      {/* Scroll to this ref to show the latest message */}
      <div ref={messagesEndRef} />
      
      <CustomModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        content={modalContent}
        isVideo={isVideo}
      />
    </div>
  );
};

export default MessageList;