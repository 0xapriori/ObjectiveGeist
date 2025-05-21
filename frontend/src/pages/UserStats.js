import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';
import './UserStats.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const UserStats = () => {
  const [users, setUsers] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user stats
        const usersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/users`);
        setUsers(usersResponse.data);
        
        // Fetch daily stats
        const dailyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/daily`);
        setDailyStats(dailyResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch statistics. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Prepare data for charts
  const dailyPostsData = {
    labels: dailyStats.slice(0, 30).map(stat => stat.date).reverse(),
    datasets: [
      {
        label: 'Posts per Day',
        data: dailyStats.slice(0, 30).map(stat => stat.postCount).reverse(),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        tension: 0.1,
      },
    ],
  };

  const userPostsData = {
    labels: users.slice(0, 10).map(user => user.username),
    datasets: [
      {
        label: 'Posts per User',
        data: users.slice(0, 10).map(user => user.postCount),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="user-stats-page">
      <header className="page-header">
        <h1>User Statistics</h1>
        <p>Activity analysis for Anoma Research Forum users</p>
      </header>
      
      <section className="chart-section">
        <h2>Daily Activity</h2>
        <div className="chart-container">
          <Line 
            data={dailyPostsData} 
            options={{ 
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Posts per Day',
                },
              },
            }} 
          />
        </div>
