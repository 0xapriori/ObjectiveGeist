import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DailySummaryCard from '../components/DailySummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './DailySummaries.css';

const DailySummaries = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/daily-summaries`);
        setSummaries(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch daily summaries. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSummaries();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="daily-summaries-page">
      <header className="page-header">
        <h1>Daily Summaries</h1>
        <p>A daily overview of all posts on the Anoma Research Forum</p>
      </header>
      
      {summaries.length === 0 ? (
        <div className="no-summaries-message">
          No daily summaries available yet.
        </div>
      ) : (
        <div className="summaries-list">
          {summaries.map(summary => (
            <DailySummaryCard key={summary.date} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DailySummaries;
