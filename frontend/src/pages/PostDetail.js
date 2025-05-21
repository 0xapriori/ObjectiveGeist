import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/posts/${id}`);
        setPost(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch post. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!post) {
    return <div className="error-message">Post not found</div>;
  }

  const createdDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="post-detail-page">
      <div className="post-navigation">
        <Link to="/" className="back-link">← Back to Home</Link>
        <Link to={`/thread/${post.threadId}`} className="thread-link">View Full Thread</Link>
      </div>
      
      <article className="post-detail">
        <header className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span className="post-category">{post.category}</span>
            <span className="post-date">{createdDate}</span>
            <span className="post-author">Posted by {post.authorUsername}</span>
          </div>
        </header>
        
        <section className="post-summary-section">
          <h2>ELI5 Summary</h2>
          <div className="post-eli5-summary">
            {post.eli5Summary}
          </div>
        </section>
        
        <section className="post-content-section">
          <h2>Original Content</h2>
          <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </section>
        
        <footer className="post-footer">
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="original-link">
            View original post on Anoma Research Forum
          </a>
        </footer>
      </article>
    </div>
  );
};

export default PostDetail;
