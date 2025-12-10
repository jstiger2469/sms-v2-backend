const express = require('express');
const pulseService = require('../services/pulse.service');
const router = express.Router();

// GET /api/pulse/stale?days=7
router.get('/stale', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const staleMatches = await pulseService.getStaleMatches(days);
    res.json({
      count: staleMatches.length,
      thresholdDays: days,
      matches: staleMatches
    });
  } catch (error) {
    console.error('Error fetching stale matches:', error);
    res.status(500).json({ error: 'Failed to fetch stale matches' });
  }
});

// POST /api/pulse/update-scores
router.post('/update-scores', async (req, res) => {
  try {
    const updates = await pulseService.updateHealthScores();
    res.json({
      message: 'Health scores updated',
      updatedCount: updates.length,
      details: updates
    });
  } catch (error) {
    console.error('Error updating health scores:', error);
    res.status(500).json({ error: 'Failed to update health scores' });
  }
});

module.exports = router;

