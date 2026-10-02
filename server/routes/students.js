const express = require('express');
const { normalizePhone, toE164 } = require('../utils/phone');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const router = express.Router();

// Update a student (currently supports phone updates)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }

    if (typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    const numericDigits = normalizePhone(phone);
    if (!numericDigits) {
      return res.status(400).json({ error: 'Phone must be a valid 10-digit US number' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { phone: numericDigits },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Reset opt-in for any matches tied to this student
    const Match = require('../models/Match');
    await Match.updateMany({ student: updatedStudent._id }, { $set: { studentOptIn: false } });

    return res.json(updatedStudent);
  } catch (err) {
    console.error('Error updating student:', err);
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

module.exports = router;
