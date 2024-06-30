import React, { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';
import RecordRTC from 'recordrtc';
import Axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { Circle, Mic } from 'react-bootstrap-icons';
import { API_BASE_URL, API_DEFAULT_LANGUAGE } from "../../constants/apiConstants";
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
  en: { 
    ask_from_ai: "Ask from AI",
    waveform: "Waveform",
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

const AudioRecorder = ({ fetchMessages, setSpeechIndicator, sendSpeechStatus, setIsThinking }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [gender, setGender] = useState('male');
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search.substring(1));
  const localization = urlParams.get('lang') || API_DEFAULT_LANGUAGE;
  strings.setLanguage(localization);

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
      wavesurfer.current.load(URL.createObjectURL(audioBlob));
    }
  }, [audioBlob]);

  const handleAiCheckboxChange = (e) => {
    setIsAiEnabled(e.target.checked);
  };

  const handleChatGPTResponse = async (responseText) => {
    console.log('Received response from ChatGPT:', responseText);
    if (isAiEnabled) {
      sendSpeechStatus(false);
      setSpeechIndicator('');
      setIsThinking(true);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: true });
      await generateResponse(responseText);
    }
    fetchMessages();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newRecorder = RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/mp3',
      });
      newRecorder.startRecording();
      setRecorder(newRecorder);
      setIsRecording(true);
      mediaStreamRef.current = stream;
      setupAudioLevelMeter(stream);
      sendSpeechStatus(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
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
      const response = await Axios.post(`${API_BASE_URL}/api/guest/generate-response`, { prompt: message });
      const aiResponseMessage = {
        username: 'AI',
        message: response.data.response,
        gender,
        created_at: new Date().toISOString(),
      };
      await saveMessageToDatabase(aiResponseMessage);
      setIsThinking(false);
      await Axios.post(`${API_BASE_URL}/api/guest/thinking`, { username: "AI", isThinking: false });
      fetchMessages();
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  };

  const saveMessageToDatabase = async (message) => {
    try {
      await Axios.post(`${API_BASE_URL}/api/guest/save-message`, message);
      console.log('Message saved to database successfully:', message);
      fetchMessages();
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const stopRecording = () => {
    recorder.stopRecording(async () => {
      const blob = recorder.getBlob();
      audioRef.current.src = URL.createObjectURL(blob);
      setAudioBlob(blob);

      const formData = new FormData();
      formData.append('audio', blob, 'recording.mp3');
      formData.append('gender', gender);

      try {
        const response = await Axios.post(`${API_BASE_URL}/api/guest/stt`, formData);
        console.log('Transcription result:', response.data.transcription);
        await handleChatGPTResponse(response.data.transcription);
      } catch (error) {
        console.error('Error uploading audio file:', error);
      }

      setIsRecording(false);
      cancelAnimationFrame(animationFrameIdRef.current);
      audioContextRef.current.close();
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    });
  };

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
        {isRecording ? <Circle /> : <Mic />}
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
      <select className='select-gender' id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="male">{strings.male}</option>
        <option value="female">{strings.female}</option>
      </select>
    </div>
  );
};

export default AudioRecorder;
