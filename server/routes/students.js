const express = require('express');
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

    const numericDigits = phone.replace(/\D/g, '');
    if (numericDigits.length < 10) {
      return res.status(400).json({ error: 'Phone number must have at least 10 digits' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { phone },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(updatedStudent);
  } catch (err) {
    console.error('Error updating student:', err);
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

module.exports = router;
