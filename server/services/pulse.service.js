const Match = require('../models/Match');
const llmService = require('./llm.service');

class PulseService {
  /**
   * Find matches that are considered "stale" (no activity for X days)
   * @param {number} daysThreshold - Days of inactivity to consider stale
   */
  async getStaleMatches(daysThreshold = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return Match.find({
      status: 'active',
      $or: [
        { lastMessageAt: { $lt: thresholdDate } },
        { lastMessageAt: { $exists: false } } // Include matches that never messaged
      ]
    })
    .populate('student', 'firstName lastName phone')
    .populate('mentor', 'firstName lastName phone')
    .sort({ lastMessageAt: 1 }); // Oldest activity first
  }

  /**
   * Calculate and update health scores for all active matches
   * Decay logic + Sentiment impact
   */
  async updateHealthScores() {
    const matches = await Match.find({ status: 'active' });
    const results = [];

    for (const match of matches) {
      let score = match.healthScore || 100;
      const lastActivity = match.lastMessageAt || match.createdAt;
      const daysSinceActivity = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);

      // Decay: -2 points per day of silence after day 3
      if (daysSinceActivity > 3) {
        score -= 2;
      } else {
        // Recovery: +1 point per day if active recently (capped at 100)
        score += 1;
      }

      score = Math.max(0, Math.min(100, score));

      if (match.healthScore !== score) {
        match.healthScore = score;
        await match.save();
        results.push({ id: match._id, oldScore: match.healthScore, newScore: score });
      }
    }
    return results;
  }

  /**
   * Analyze message sentiment and update match health immediately
   * @param {string} matchId
   * @param {string} content
   */
  async processMessageSentiment(matchId, content) {
    try {
      const match = await Match.findById(matchId);
      if (!match) return;

      const analysis = await llmService.analyzeSentiment(content);
      
      let impact = 0;
      if (analysis.sentiment === 'positive') impact = 5;
      if (analysis.sentiment === 'negative') impact = -10;
      if (analysis.alert) impact = -50; // Major drop for alerts

      let newScore = (match.healthScore || 100) + impact;
      newScore = Math.max(0, Math.min(100, newScore));

      match.healthScore = newScore;
      await match.save();

      return { matchId, sentiment: analysis.sentiment, newScore, alert: analysis.alert };
    } catch (err) {
      console.error('Pulse sentiment processing failed:', err);
    }
  }
}

module.exports = new PulseService();
