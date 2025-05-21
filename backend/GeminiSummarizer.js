const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiSummarizer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateEli5Summary(content) {
    try {
      const cleanContent = content.replace(/<[^>]*>/g, '').substring(0, 3000);
      
      const prompt = `Please provide an ELI5 (Explain Like I'm 5) summary of this technical post from the Anoma Research Forum. Make it simple and easy to understand for non-technical people:

${cleanContent}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error generating summary with Gemini:', error);
      return "This post discusses technical aspects of Anoma's research. Check the original post for details.";
    }
  }
}

module.exports = GeminiSummarizer;
