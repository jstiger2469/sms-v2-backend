const express = require('express');
const mongoose = require('mongoose');
const Mentor = require('../models/Mentor');

const router = express.Router();

// Update a mentor (currently supports phone updates)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mentor ID format' });
    }

    if (typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    const numericDigits = phone.replace(/\D/g, '');
    if (numericDigits.length < 10) {
      return res.status(400).json({ error: 'Phone number must have at least 10 digits' });
    }

    const updatedMentor = await Mentor.findByIdAndUpdate(
      id,
      { phone: numericDigits },
      { new: true }
    );

    if (!updatedMentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    return res.json(updatedMentor);
  } catch (err) {
    console.error('Error updating mentor:', err);
    return res.status(500).json({ error: 'Failed to update mentor' });
  }
});

module.exports = router;
