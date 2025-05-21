import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import DailySummaryCard from '../components/DailySummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [latestSummary, setLatestSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent posts
        const postsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/posts`);
        setRecentPosts(postsResponse.data);
        
        // Fetch latest daily summary
        const summariesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/daily-summaries`);
        if (summariesResponse.data.length > 0) {
          setLatestSummary(summariesResponse.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Anoma Research Forum Summarizer</h1>
        <p>ELI5 summaries of research.anoma.net content</p>
      </section>

      {latestSummary && (
        <section className="latest-summary">
          <h2>Today's Summary</h2>
          <DailySummaryCard summary={latestSummary} />
          <div className="view-all-link">
            <Link to="/daily-summaries">View all daily summaries</Link>
          </div>
        </section>
      )}

      <section className="recent-posts">
        <h2>Recent Posts</h2>
        <div className="post-grid">
          {recentPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="quick-links">
        <h2>Quick Links</h2>
        <div className="links-grid">
          <Link to="/categories" className="quick-link">
            <h3>Categories</h3>
            <p>Browse posts by category</p>
          </Link>
          <Link to="/daily-summaries" className="quick-link">
            <h3>Daily Summaries</h3>
            <p>View summaries of each day's posts</p>
          </Link>
          <Link to="/stats/users" className="quick-link">
            <h3>User Stats</h3>
            <p>See which users are most active</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
