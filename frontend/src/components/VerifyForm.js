import React, { useState } from 'react';
import axios from 'axios';

function VerifyForm() {
  const [address, setAddress] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true); // Set loading to true
    setCredentials([]); // Clear previous credentials
    setMessage(''); // Clear previous messages

    try {
      const res = await axios.get(`http://localhost:5000/verify/${address}`);
      if (res.data.credentials && res.data.credentials.length > 0) {
        setCredentials(res.data.credentials);
        setMessage(''); // Clear any previous error message
      } else {
        setCredentials([]);
        setMessage('No credentials found for this address.');
      }
    } catch (err) {
      console.error("Error verifying credentials:", err.response?.data?.message || err.message);
      setMessage(err.response?.data?.message || 'Error verifying credentials. Please check the address.');
      setCredentials([]); // Ensure credentials array is empty on error
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  return (
    <div>
      <h2>✅ Verify Credentials</h2>
      <input
        type="text"
        placeholder="Student Public Key"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <button onClick={handleVerify} disabled={isLoading}>
        {isLoading ? (
          <>Verifying... <span className="spinner"></span></>
        ) : (
          'Verify Credentials'
        )}
      </button>

      {message && <p>{message}</p>} {/* Display general messages */}

      {credentials.length > 0 && (
        <div style={{ background: '#f8f8f8', padding: '1rem', marginTop: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3>Found Credentials:</h3>
          {credentials.map((tx, i) => (
            <div key={i} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px dashed #ddd' }}>
              <p><strong>Credential ID (Amount):</strong> {tx.amount}</p>
              <p><strong>Issued By (From):</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.9em', wordBreak: 'break-all' }}>{tx.fromAddress}</span></p>
              <p><strong>Issued To (To):</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.9em', wordBreak: 'break-all' }}>{tx.toAddress}</span></p>
              <p><strong>Timestamp:</strong> {new Date(tx.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerifyForm;
