const OpenAI = require('openai');

class LlmService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze the sentiment of a message
   * @param {string} content - The message text
   * @returns {Promise<{score: number, sentiment: string, alert: boolean}>}
   */
  async analyzeSentiment(content) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set. Skipping analysis.');
      return { score: 0, sentiment: 'neutral', alert: false };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analyzer for a mentorship platform. 
            Analyze the following text message. 
            Return ONLY a JSON object with:
            - score: a number between -1 (very negative) and 1 (very positive).
            - sentiment: 'positive', 'neutral', or 'negative'.
            - alert: true if the text indicates a crisis, dropout, or serious conflict; false otherwise.`
          },
          { role: "user", content }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('LLM Analysis failed:', error);
      return { score: 0, sentiment: 'neutral', alert: false };
    }
  }
}

module.exports = new LlmService();

