import React, {useEffect} from "react";
import {withRouter} from "react-router-dom";
import 'video-react/dist/video-react.css';
import "./PublicHome.css";
import { Player } from 'video-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import LOGO_COPY from "../../PoweredBy_TES_DarkWhite.png";
import LocalizedStrings from 'react-localization';
import { API_DEFAULT_LANGUAGE } from "../../constants/apiConstants";

// LocalizedStrings
let strings = new LocalizedStrings({
  en: {
    video: "To view this video please enable JavaScript, and consider upgrading to a",
    web: "web browser that",
    support: "supports HTML5 video",
    copyright: "| i4ware AI Assistant Real-Time Chat | Copyright © i4ware Software 2004-2024, all rights reserved. | Version 1.0.0"
  },
  fi: {
    video: "Katsoaksesi tämän videon ota JavaScript käyttöön, ja harkitse päivittämistä",
    web: "verkkoselaimeen, joka",
    support: "tukee HTML5-videota",
    copyright: "| i4ware AI Assistant Real-Time Chat | Tekijänoikeudet © i4ware Software 2004-2024, kaikki oikeudet pidätetään. | Versio 1.0.0"
  },
  se: {
    video: "För att se den här videon, aktivera JavaScript och överväg att uppgradera",
    web: "din webbläsare till en som",
    support: "stöder HTML5-video",
    copyright: "| i4ware AI Assistant Real-Time Chat | Upphovsrätt © i4ware Software 2004-2024, alla rättigheter förbehållna. | Version 1.0.0"
  }
});

// We need to get the language from the URL
var query = window.location.search.substring(1);
// We need to get the language from the URL
var urlParams = new URLSearchParams(query);
// We need to get the language from the URL
var localization = urlParams.get('lang');

// Set default language
if (localization == null) {
  strings.setLanguage(API_DEFAULT_LANGUAGE);
} else {
  strings.setLanguage(localization);
}

function PublicHome() {

  return (
    <div className="PublicHomePlayer">
        <video
            id="my-player"
            class="video-js PublicHomePlayer"
            preload="auto"
            autoplay="true"
            loop="true"
            responsive="true"
            fill="true"
            disableProgress="true"
            controls=""
            data-setup='{}'>
        <source src="../../blexsus-basic.mp4" type="video/mp4"></source>
        <p class="vjs-no-js">
            {strings.video}
            {strings.web}
            <a href="https://videojs.com/html5-video-support/" target="_blank">
            {strings.support}
            </a>
        </p>
      </video>
      <div className="App-copyright">
        <img src={LOGO_COPY} alt="logo" className="App-logo-copyright" /> {strings.copyright}
      </div>
    </div>
  );
}

// export default withRouter(PublicHome);
export default withRouter(PublicHome);
