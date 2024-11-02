import React, { useEffect, useState } from 'react';
import './OpenAIResponseReceived.css';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL, API_DOMAIN, API_DEFAULT_LANGUAGE, API_PUSHER_KEY, API_PUSHER_CLUSTER } from "../../constants/apiConstants";

window.Pusher = Pusher;

const OpenAIResponseReceived = () => {
   const [messages, setMessages] = useState([]);

   useEffect(() => {
       const echo = new Echo({
           broadcaster: 'pusher',
           key: API_PUSHER_KEY,
           cluster: API_PUSHER_CLUSTER,
           encrypted: true,
       });

       echo.channel(API_DOMAIN + '-openai-responses')
           .listen('OpenAIResponseReceived', (e) => {
               setMessages(prevMessages => [...prevMessages, e.response]);
           });

       return () => echo.disconnect();
   }, []);

   return (
       <div className='OpenAI-Response-Main'>
           <ul>
               {messages.map((msg, index) => (
                   <li key={index}>{msg.content}</li>
               ))}
           </ul>
       </div>
   );
};

export default OpenAIResponseReceived;
