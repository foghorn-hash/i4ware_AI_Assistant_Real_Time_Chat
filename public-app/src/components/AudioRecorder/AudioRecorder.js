import React, { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';
import RecordRTC from 'recordrtc';
import Axios from 'axios';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/default.css';
import WaveSurfer from 'wavesurfer.js';
import { API_BASE_URL, API_DEFAULT_LANGUAGE } from "../../constants/apiConstants";
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
  en: { 
    ask_from_ai: "Ask from AI",
    waveform: "Wavefrom",
    volume: "Volume Level Meter",
    male: "Male",
    female: "Female",
   },
  fi: { 
    ask_from_ai: "Kysy tekoälyltä",
    waveform: "Ääniraita",
    volume: "Äänenvoimakkuusmittari",
    male: "Mies",
    female: "Nainen",
  },
  se: { 
    ask_from_ai: "Fråga en AI",
    waveform: "ljudspår",
    volume: "ljudvolym",
    male: "Man",
    female: "Kvinna",
  }
});

const AudioRecorder = (props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const [gender, setGender] = useState('male');

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
      mediaStreamRef.current = stream;
      setupAudioLevelMeter(stream);
    }).catch(err => {
      console.error('Error accessing microphone', err);
    });
  };

  const setupAudioLevelMeter = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const drawMeter = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      if (meterRef.current) {
        meterRef.current.value = average;
      }
      animationFrameIdRef.current = requestAnimationFrame(drawMeter);
    };

    drawMeter();
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

      const aiResponseMessage = {
        username: 'AI',
        message: highlightedHTML,
        messagePlain: response.data.response,
        gender: gender,
        created_at: new Date().toISOString(),
      };

      await saveMessageToDatabase(aiResponseMessage);
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
      setAudioBlob(blob);

      const formData = new FormData();
      formData.append('audio', blob, 'recording.mp3');
      formData.append('gender', gender); // Append gender to the form data

      Axios.post(`${API_BASE_URL}/api/guest/stt`, formData).then(response => {
        console.log('Transcription result:', response.data.transcription);
        handleChatGPTResponse(response.data.transcription);
        props.fetchMessages();
      }).catch(error => {
        console.error('Error uploading audio file:', error);
      });

      setIsRecording(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    });
  };

  const handleChange = (event) => {
    setGender(event.target.value);
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
      <strong>{strings.waveform}</strong>
      <div ref={waveformRef} className='audio-waveform' />
      <div className='audio-recorder-clear' />
      <strong>{strings.volume}</strong>
      <progress ref={meterRef} max="255" value="0" className='audio-meter' />
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
      <div className='audio-recorder-clear' />
      <select className='select-gender' id="gender" value={gender} onChange={handleChange}>
        <option value="male">{strings.male}</option>
        <option value="female">{strings.female}</option>
      </select>
    </div>
  );
};

export default AudioRecorder;
