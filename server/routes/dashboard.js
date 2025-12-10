const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Match = require('../models/Match');

// 1. Get total messages count
router.get('/total-messages', async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments({});
    res.status(200).json({ data: { totalMessages } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get average response time
router.get('/average-response-time', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });
    if (!messages.length) {
      return res.status(200).json({ data: { averageResponseTime: 0, humanReadable: '0 minutes' } });
    }
    let totalResponseTime = 0;
    let count = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender !== messages[i - 1].sender) {
        const responseTime = new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp);
        totalResponseTime += responseTime;
        count++;
      }
    }
    const averageResponseTimeInMs = totalResponseTime / count || 0;
    const averageResponseTimeInMinutes = averageResponseTimeInMs / (1000 * 60);
    const finalAverageResponseTime = averageResponseTimeInMinutes / 3;
    const seconds = (finalAverageResponseTime * 60).toFixed(2);
    const minutes = finalAverageResponseTime.toFixed(2);
    const hours = (finalAverageResponseTime / 60).toFixed(2);
    const humanReadable = finalAverageResponseTime < 1 ? `${seconds} seconds` : finalAverageResponseTime < 60 ? `${minutes} minutes` : `${hours} hours`;
    res.status(200).json({ data: { averageResponseTime: finalAverageResponseTime, humanReadable } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get messages by month
router.get('/messages-by-month', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const results = await Message.aggregate(pipeline);
    const labels = results.map((r) => r._id);
    const values = results.map((r) => r.count);
    res.status(200).json({ data: { labels, values } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get average messages per day
router.get('/average-messages-per-day', async (req, res) => {
  try {
    // Get all unique days in the data
    const minMsg = await Message.findOne().sort({ timestamp: 1 });
    const maxMsg = await Message.findOne().sort({ timestamp: -1 });
    if (!minMsg || !maxMsg) return res.json({ mentor: { values: [] }, student: { values: [] } });

    function getDateRange(start, end) {
      const arr = [];
      let dt = new Date(start);
      while (dt <= end) {
        arr.push(dt.toISOString().slice(0, 10));
        dt.setDate(dt.getDate() + 1);
      }
      return arr;
    }
    const allDates = getDateRange(new Date(minMsg.timestamp), new Date(maxMsg.timestamp));

    // Aggregate message count per day for each type
    const agg = await Message.aggregate([
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            senderModel: '$senderModel',
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Map to { [date]: count } for each type
    const mentorMap = {};
    const studentMap = {};
    agg.forEach(({ _id, count }) => {
      if (_id.senderModel === 'Mentor') mentorMap[_id.day] = count;
      if (_id.senderModel === 'Student') studentMap[_id.day] = count;
    });

    // Fill missing days with 0
    const mentorValues = allDates.map(date => mentorMap[date] || 0);
    const studentValues = allDates.map(date => studentMap[date] || 0);

    res.json({
      mentor: { values: mentorValues },
      student: { values: studentValues }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Get average daily users
router.get('/average-daily-users', async (req, res) => {
  try {
    // Get all unique days in the data
    const minMsg = await Message.findOne().sort({ timestamp: 1 });
    const maxMsg = await Message.findOne().sort({ timestamp: -1 });
    if (!minMsg || !maxMsg) return res.json({ mentor: { values: [] }, student: { values: [] } });

    function getDateRange(start, end) {
      const arr = [];
      let dt = new Date(start);
      while (dt <= end) {
        arr.push(dt.toISOString().slice(0, 10));
        dt.setDate(dt.getDate() + 1);
      }
      return arr;
    }
    const allDates = getDateRange(new Date(minMsg.timestamp), new Date(maxMsg.timestamp));

    // Aggregate unique senders per day for each type
    const agg = await Message.aggregate([
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            senderModel: '$senderModel',
          },
          uniqueSenders: { $addToSet: '$sender' }
        }
      },
      {
        $project: {
          day: '$_id.day',
          senderModel: '$_id.senderModel',
          count: { $size: '$uniqueSenders' }
        }
      }
    ]);

    // Map to { [date]: count } for each type
    const mentorMap = {};
    const studentMap = {};
    agg.forEach(({ day, senderModel, count }) => {
      if (senderModel === 'Mentor') mentorMap[day] = count;
      if (senderModel === 'Student') studentMap[day] = count;
    });

    // Fill missing days with 0
    const mentorValues = allDates.map(date => mentorMap[date] || 0);
    const studentValues = allDates.map(date => studentMap[date] || 0);

    res.json({
      mentor: { values: mentorValues },
      student: { values: studentValues }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Get response rate by sender type (within 12 hours)
router.get('/response-rate-by-sender-type', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 }).lean();

    // Build a map: { recipientId: [messages sent to them] }
    const messagesByRecipient = {};
    messages.forEach(msg => {
      const key = msg.recipient.toString();
      if (!messagesByRecipient[key]) messagesByRecipient[key] = [];
      messagesByRecipient[key].push(msg);
    });

    let mentorTotal = 0, mentorReplied = 0;
    let studentTotal = 0, studentReplied = 0;

    for (const msg of messages) {
      if (msg.senderModel !== 'Mentor' && msg.senderModel !== 'Student') continue;
      const isMentor = msg.senderModel === 'Mentor';
      if (isMentor) mentorTotal++;
      else studentTotal++;

      // Look for a reply from recipient to sender within 12 hours
      const possibleReplies = messagesByRecipient[msg.sender.toString()] || [];
      const replied = possibleReplies.some(reply =>
        reply.sender.toString() === msg.recipient.toString() &&
        reply.recipient.toString() === msg.sender.toString() &&
        new Date(reply.timestamp) > new Date(msg.timestamp) &&
        new Date(reply.timestamp) <= new Date(msg.timestamp).getTime() + 12 * 60 * 60 * 1000
      );
      if (replied) {
        if (isMentor) mentorReplied++;
        else studentReplied++;
      }
    }

    const rates = [
      {
        senderType: 'Mentor',
        responseRate: mentorTotal ? Math.round((mentorReplied / mentorTotal) * 100) : 0
      },
      {
        senderType: 'Student',
        responseRate: studentTotal ? Math.round((studentReplied / studentTotal) * 100) : 0
      }
    ];

    res.status(200).json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get messages by sender type
router.get('/messages-by-sender-type', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$senderModel',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const results = await Message.aggregate(pipeline);
    // Only return Mentor and Student, as array of objects
    const filtered = results
      .filter(r => r._id === 'Mentor' || r._id === 'Student')
      .map(r => ({ _id: r._id, count: r.count }));
    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get top users
router.get('/top-users', async (req, res) => {
  try {
    const topUsers = await Message.aggregate([
      {
        $group: {
          _id: { sender: '$sender', senderModel: '$senderModel' },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { messageCount: -1 } },
      { $limit: 10 },
    ]);
    const studentIds = topUsers.filter((user) => user._id.senderModel === 'Student').map((user) => user._id.sender);
    const mentorIds = topUsers.filter((user) => user._id.senderModel === 'Mentor').map((user) => user._id.sender);
    const students = await Student.find({ _id: { $in: studentIds } }, 'firstName lastName');
    const mentors = await Mentor.find({ _id: { $in: mentorIds } }, 'firstName lastName');
    const enrichedTopUsers = topUsers.map((user) => {
      const userDetails = user._id.senderModel === 'Student'
        ? students.find((student) => student._id.equals(user._id.sender))
        : mentors.find((mentor) => mentor._id.equals(user._id.sender));
      return {
        userId: user._id.sender,
        senderType: user._id.senderModel,
        messageCount: user.messageCount,
        firstName: userDetails?.firstName || 'Unknown',
        lastName: userDetails?.lastName || 'Unknown',
      };
    });
    res.status(200).json({ data: { users: enrichedTopUsers } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 