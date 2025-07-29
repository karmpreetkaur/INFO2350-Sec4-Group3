import React, { useState } from 'react';
import axios from 'axios';

function IssueForm() {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [credential, setCredential] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const handleSubmit = async () => {
    setIsLoading(true); // Set loading to true
    setMessage(''); // Clear previous messages
    setIsError(false);

    try {
      const res = await axios.post('http://localhost:5000/issue', {
        from: fromAddress,
        to: toAddress,
        credential,
      });
      console.log(res.data.message);
      setMessage(res.data.message);
      setIsError(false);
      // Clear form after successful submission
      setFromAddress('');
      setToAddress('');
      setCredential('');
    } catch (err) {
      console.error("Error issuing credential:", err.response?.data?.message || err.message);
      setMessage(err.response?.data?.message || 'Error issuing credential. Please check server logs.');
      setIsError(true);
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  return (
    <div>
      <h2>📨 Issue Credential</h2>
      <input
        type="text"
        placeholder="Institution Public Key (From Address)"
        value={fromAddress}
        onChange={e => setFromAddress(e.target.value)}
      /><br />
      <input
        type="text"
        placeholder="Student Public Key (To Address)"
        value={toAddress}
        onChange={e => setToAddress(e.target.value)}
      /><br />
      <input
        type="text"
        placeholder="Credential Description (e.g., 'Bachelor of Science in CS')"
        value={credential}
        onChange={e => setCredential(e.target.value)}
      /><br />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <>Issuing... <span className="spinner"></span></>
        ) : (
          'Issue Credential'
        )}
      </button>
      {message && (
        <p className={isError ? 'message-error' : 'message-success'}>
          {message}
        </p>
      )}
    </div>
  );
}

export default IssueForm;