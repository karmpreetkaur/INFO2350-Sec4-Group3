import React from 'react';
import IssueForm from './components/IssueForm';
import VerifyForm from './components/VerifyForm';
import './App.css'; // Import the new App.css

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Academic Credentialing System</h1>
      </header>
      <div className="App-container">
        <div className="section-container">
          <IssueForm />
        </div>
        {/* <hr /> Removed hr as gap handles spacing */}
        <div className="section-container">
          <VerifyForm />
        </div>
      </div>
    </div>
  );
}

export default App;