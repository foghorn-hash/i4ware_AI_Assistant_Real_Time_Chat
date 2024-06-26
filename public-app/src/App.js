import logo from './logo.svg';
import './App.css';
import PusherChat from './components/PusherChat/PusherChat';
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <PusherChat />
      </header>
    </div>
  );
}

export default App;