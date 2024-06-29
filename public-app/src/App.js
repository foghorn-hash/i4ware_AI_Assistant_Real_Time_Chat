import './App.css';
import PusherChat from './components/PusherChat/PusherChat';
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "./5-1.png";
import LOGO_COPY from "./PoweredBy_TES_DarkWhite.png";
import LocalizedStrings from 'react-localization';
import { API_DEFAULT_LANGUAGE } from "./constants/apiConstants";

// LocalizedStrings
let strings = new LocalizedStrings({
  en: {
    copyright: "| i4ware AI Assistant Real-Time Chat | Copyright © i4ware Software 2004-2024, all rights reserved. | Version 1.0.0"
  },
  fi: {
    copyright: "| i4ware AI Assistant Real-Time Chat | Tekijänoikeudet © i4ware Software 2004-2024, kaikki oikeudet pidätetään. | Versio 1.0.0"
  },
  se: {
    copyright: "| i4ware AI Assistant Real-Time Chat | Upphovsrätt © i4ware Software 2004-2024, alla rättigheter förbehållna. | Version 1.0.0"
  }
});

function App() {

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

  const handleLocalization = () => {
    const e = document.getElementById("language-selector");
    const value = e.value;
    const currentHash = window.location.hash;
  
    // Check if there's already a language parameter in the URL
    const hasLangParam = window.location.search.includes("lang=");
  
    // Build the new URL with the updated language parameter
    let newUrl;
    if (hasLangParam) {
      // Replace the existing language parameter value
      newUrl = window.location.search.replace(/lang=[^&]*/, "lang=" + value);
    } else {
      // Add the new language parameter
      newUrl = window.location.search + (window.location.search ? "&" : "?") + "lang=" + value;
    }
  
    // Combine the new URL with the current hash
    const finalUrl = newUrl + currentHash;
  
    // Update the window location
    window.location.href = finalUrl;
  };

  if (localization===null) {
    var language = API_DEFAULT_LANGUAGE;
  } else {
    var language = localization;
  }

  return (
    <div className="App">
      <header className='App-header'>
        <img src={logo} className='App-logo' alt="i4ware Software" />
        <select id="language-selector" className="language-selector" onChange={handleLocalization}>
          <option value="fi" selected={language === 'fi'}>Finnish</option>
          <option value="en" selected={language === 'en'}>English</option>
          <option value="se" selected={language === 'se'}>Swedish</option>
        </select>
      </header>
      <main className='App-main'>
        <PusherChat />
      </main>
      <footer className='App-footer'>
      </footer>
    </div>
  );
}

export default App;
