const express = require('express');
const mongoose = require('mongoose');
const Mentor = require('../models/Mentor');

const router = express.Router();

// Update a mentor (phone, specialties, availability)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, specialties, isAvailable } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mentor ID format' });
    }

    const updateData = {};

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone must be a string' });
      }
      const numericDigits = phone.replace(/\D/g, '');
      if (numericDigits.length < 10) {
        return res.status(400).json({ error: 'Phone number must have at least 10 digits' });
      }
      updateData.phone = numericDigits;
    }

    if (specialties !== undefined) {
      if (!Array.isArray(specialties)) {
        return res.status(400).json({ error: 'Specialties must be an array of strings' });
      }
      updateData.specialties = specialties;
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    const updatedMentor = await Mentor.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedMentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Reset opt-in if phone changed
    if (updateData.phone) {
      const Match = require('../models/Match');
      await Match.updateMany({ mentor: updatedMentor._id }, { $set: { mentorOptIn: false } });
    }

    return res.json(updatedMentor);
  } catch (err) {
    console.error('Error updating mentor:', err);
    return res.status(500).json({ error: 'Failed to update mentor' });
  }
});

module.exports = router;
