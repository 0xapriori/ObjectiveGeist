// This script is run by GitHub Actions to update the database with new posts
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI);

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Models (same as in server.js)
const Post = mongoose.model('Post', {
  id: Number,
  title: String,
  content: String,
  summary: String,
  eli5Summary: String,
  url: String,
  category: String,
  threadId: Number,
  createdAt: Date,
  authorUsername: String,
  authorId: Number,
});

const DailySummary = mongoose.model('DailySummary', {
  date: Date,
  summary: String,
  postIds: [Number],
  uniqueAuthors: [String],
});

// Functions for fetching and processing
async function fetchLatestPosts() {
  try {
    const response = await axios.get('https://research.anoma.net/latest.json');
    return response.data.topic_list.topics;
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
}

async function fetchPost(postId) {
  try {
    const response = await axios.get(`https://research.anoma.net/t/${postId}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}

async function generateEli5Summary(content) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that explains complex topics in simple terms. Provide an ELI5 (Explain Like I'm 5) summary that a non-technical person would understand."
        },
        {
          role: "user",
          content: `Please provide an ELI5 summary of the following text from the Anoma Research Forum:\n\n${content}`
        }
      ],
      max_tokens: 300,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating ELI5 summary:', error);
    return "Unable to generate summary at this time.";
  }
}

async function generateDailySummary(date) {
  try {
    // Find all posts from the given date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const posts = await Post.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    if (posts.length === 0) {
      return null;
    }
    
    // Extract post contents
    const postContents = posts.map(post => post.title + ": " + post.eli5Summary).join("\n\n");
    
    // Generate summary using OpenAI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise and informative daily summaries."
        },
        {
          role: "user",
          content: `Create a one-paragraph summary of all the following Anoma research posts from ${date.toDateString()}:\n\n${postContents}`
        }
      ],
      max_tokens: 250,
    });
    
    // Get unique authors
    const uniqueAuthors = [...new Set(posts.map(post => post.authorUsername))];
    
    // Create and save the daily summary
    const dailySummary = new DailySummary({
      date: startDate,
      summary: response.data.choices[0].message.content,
      postIds: posts.map(post => post.id),
      uniqueAuthors: uniqueAuthors,
    });
    
    await dailySummary.save();
    return dailySummary;
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return null;
  }
}

// Main update function
async function updatePosts() {
  try {
    const latestPosts = await fetchLatestPosts();
    
    for (const topicInfo of latestPosts) {
      // Check if post already exists
      const existingPost = await Post.findOne({ id: topicInfo.id });
      if (existingPost) {
        continue;
      }
      
      // Fetch full post data
      const postData = await fetchPost(topicInfo.id);
      if (!postData) {
        continue;
      }
      
      // Process post content (first post in the thread)
      const firstPost = postData.post_stream.posts[0];
      const content = firstPost.cooked; // HTML content
      
      // Generate ELI5 summary
      const eli5Summary = await generateEli5Summary(content);
      
      // Save to database
      const post = new Post({
        id: topicInfo.id,
        title: topicInfo.title,
        content: content,
        summary: topicInfo.excerpt,
        eli5Summary: eli5Summary,
        url: `https://research.anoma.net/t/${topicInfo.slug}/${topicInfo.id}`,
        category: postData.category_name,
        threadId: topicInfo.id,
        createdAt: new Date(topicInfo.created_at),
        authorUsername: firstPost.username,
        authorId: firstPost.user_id,
      });
      
      await post.save();
      console.log(`Added post: ${topicInfo.title}`);
    }
    
    // Generate daily summary for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSummary = await DailySummary.findOne({ date: today });
    if (!existingSummary) {
      await generateDailySummary(today);
    }
    
    console.log('Update completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error in updatePosts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update
updatePosts();
