import React, { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import Axios from 'axios';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/default.css';
import WaveSurfer from 'wavesurfer.js';
import { API_BASE_URL, API_DEFAULT_LANGUAGE } from "../../constants/apiConstants"; // Assuming you have ACCESS_TOKEN_NAME defined
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
    en: {
        ask_from_ai: "Ask from AI",
    },
    fi: {
        ask_from_ai: "Kysy tekoälyltä",
    },
    se: {
        ask_from_ai: "Fråga en AI",
    }
  });

const AudioRecorder = (props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null); // State to store audio blob
  const audioRef = useRef(null);
  const [isAiEnabled, setIsAiEnabled] = useState(false); // State to track AI checkbox
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  var query = window.location.search.substring(1);
  var urlParams = new URLSearchParams(query);
  var localization = urlParams.get('lang');

  if (localization == null) {
    strings.setLanguage(API_DEFAULT_LANGUAGE);
  } else {
    strings.setLanguage(localization);
  }

  const handleAiCheckboxChange = (e) => {
    setIsAiEnabled(e.target.checked);
  };

  const handleChatGPTResponse = (responseText) => {
    console.log('Received response from ChatGPT:', responseText);
    if (isAiEnabled) {
        generateResponse(responseText);
    }
    props.fetchMessages();
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const newRecorder = RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/mp3',
      });
      newRecorder.startRecording();
      setRecorder(newRecorder);
      setIsRecording(true);
    }).catch(err => {
      console.error('Error accessing microphone', err);
    });
  };

  const generateResponse = async (message) => {
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
  
      // Handle AI response (display in chat, etc.)
      //props.setIsThinking(true);

      props.fetchMessages();

    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const saveMessageToDatabase = async (message) => {
    try {
      await Axios.post(`${API_BASE_URL}/api/guest/save-message`, message);
      console.log('Message saved to database successfully:', message);
      props.fetchMessages();
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const stopRecording = () => {
    recorder.stopRecording(() => {
      const blob = recorder.getBlob();
      const audioUrl = URL.createObjectURL(blob);
      audioRef.current.src = audioUrl;
      setAudioBlob(blob); // Update the state with the audio blob

      // Send the audio file to the backend
      const formData = new FormData();
      formData.append('audio', blob, 'recording.mp3');

      Axios.post(`${API_BASE_URL}/api/guest/stt`, formData).then(response => {
        console.log('Transcription result:', response.data.transcription);
        handleChatGPTResponse(response.data.transcription);
      }).catch(error => {
        console.error('Error uploading audio file:', error);
      });

      setIsRecording(false);
    });
  };

  useEffect(() => {
    if (audioBlob && waveformRef.current) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#ddd',
        progressColor: '#ff5500',
        responsive: true,
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      wavesurfer.current.load(audioUrl);
    }
  }, [audioBlob]);

  return (
    <div>
      <audio className='audio-recorded' ref={audioRef} controls />
      <div className='audio-recorder-clear' />
      <strong>Waveform</strong>
      <div ref={waveformRef} className='audio-waveform' />
      <div className='audio-recorder-clear' />
      <button className='audio-recorder-button' onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div className='audio-recorder-clear' />
      {strings.ask_from_ai}
          <input
            type="checkbox"
            className="message-ai"
            name="ai"
            checked={isAiEnabled}
            onChange={handleAiCheckboxChange}
          />
    </div>
  );
};

export default AudioRecorder;
