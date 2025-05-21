import React from 'react';
import './DailySummaryCard.css';

const DailySummaryCard = ({ summary }) => {
  const date = new Date(summary.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="daily-summary-card">
      <h3 className="summary-date">{date}</h3>
      <p className="summary-content">{summary.summary}</p>
      <div className="summary-meta">
        <span className="post-count">{summary.postIds.length} posts</span>
        <span className="author-count">{summary.uniqueAuthors.length} authors</span>
      </div>
    </div>
  );
};

export default DailySummaryCard;
