import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import './ThreadDetail.css';

const ThreadDetail = () => {
  const { id } = useParams();
  const [threadData, setThreadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/threads/${id}`);
        setThreadData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch thread. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchThread();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!threadData || threadData.posts.length === 0) {
    return <div className="error-message">Thread not found</div>;
  }

  const { posts, threadSummary } = threadData;
  const firstPost = posts[0];

  return (
    <div className="thread-detail-page">
      <div className="thread-navigation">
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
      
      <header className="thread-header">
        <h1>{firstPost.title}</h1>
        <div className="thread-meta">
          <span className="thread-category">{firstPost.category}</span>
          <span className="thread-posts-count">{posts.length} posts</span>
        </div>
      </header>
      
      {threadSummary && (
        <section className="thread-summary-section">
          <h2>Thread Summary</h2>
          <div className="thread-summary">
            {threadSummary}
          </div>
        </section>
      )}
      
      <section className="thread-posts-section">
        <h2>All Posts</h2>
        <div className="thread-posts">
          {posts.map((post, index) => {
            const createdDate = new Date(post.createdAt).toLocaleDateString();
            
            return (
              <article key={post.id} className="thread-post">
                {index > 0 && <div className="post-divider"></div>}
                <div className="post-author-info">
                  <span className="post-author">{post.authorUsername}</span>
                  <span className="post-date">{createdDate}</span>
                </div>
                <div className="post-content">
                  <h3>ELI5 Summary</h3>
                  <p>{post.eli5Summary}</p>
                  <Link to={`/post/${post.id}`} className="view-full-post">
                    View full post
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ThreadDetail;
