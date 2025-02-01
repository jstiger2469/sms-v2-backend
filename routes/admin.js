const express = require('express');
const mongoose = require('mongoose');
const Match = require('../models/Match'); // Ensure this path is correct
const Student = require('../models/Student'); // Import the Student model
const Mentor = require('../models/Mentor'); // Import the Mentor model
const Message = require('../models/Message'); // Import the Mentor model
const Notifications = require('../models/Notifications'); // Import the Mentor model

const { ManagementClient } = require('auth0');

const groupConversations = require('../utils/groupConversations'); // Import the utility
const router = express.Router();
require('dotenv').config();

const managementClient = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN, // Your Auth0 domain
  clientId: process.env.AUTH0_CLIENTID, // Your Client ID
  clientSecret: process.env.AUTH0_CLIENTSECRET, // Your Client Secret
  scope: process.env.AUTH0_SCOPE, // Required scope
});

router.get('/users', async (req, res) => {
  try {
    // Fetch users from Auth0
    const users = await managementClient.users.getAll();
    // Send response
    console.log(users.data);
    res.status(200).json(users.data);
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching users:', error.message);
    // Send error response
    res.status(500).json({ error: error.message });
  }
});

// Route to Create a User
router.post('/create-user', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body); // You can remove this in production

  // Check if the required fields are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Create the user in Auth0
    const user = await managementClient.users.create({
      connection: 'Username-Password-Authentication', // Ensure you're using the correct connection
      email,
      password,
      email_verified: false, // Modify as needed
    });

    // Respond with a success message and the created user details
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res
      .status(500)
      .json({ message: 'Failed to create user', error: error.message });
  }
});

router.delete('/delete-user/:userId', async (req, res) => {
  const { userId } = req.params; // Get userId from request params

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    // Delete the user using Auth0 Management API
    await managementClient.users.delete({ id: userId });

    // Respond with a success message
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res
      .status(500)
      .json({ message: 'Failed to delete user', error: error.message });
  }
});

router.get('/get-notifications', async (req, res) => {
  try {
    // Fetch users from Auth0
    const notifications = await Notifications.find({});
    // Log users for debugging
    console.log('Fetched users:', notifications);

    // Send response
    res.status(200).json({ notifications });
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching users:', error.message);

    // Send error response
    res.status(500).json({ error: error.message });
  }
});

// 1. Get total messages count
router.get('/total-messages', async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments({});
    console.log(totalMessages, 'totalMessages');
    res.status(200).json({ totalMessages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get messages count by time period
router.get('/messages-by-time-period', async (req, res) => {
  try {
    const { period } = req.query; // e.g., 'week', 'month'
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      return res.status(400).json({ error: 'Invalid time period' });
    }

    const messages = await Message.find({ timestamp: { $gte: startDate } });
    res.status(200).json({ count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get average response time
router.get('/average-response-time', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });

    if (!messages.length) {
      return res.status(200).json({
        averageResponseTime: 0,
        humanReadable: '0 minutes',
      });
    }

    let totalResponseTime = 0;
    let count = 0;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender !== messages[i - 1].sender) {
        const responseTime =
          new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp);
        totalResponseTime += responseTime;
        count++;
      }
    }

    // Calculate the average response time in minutes, then divide by 3
    const averageResponseTimeInMs = totalResponseTime / count || 0;
    const averageResponseTimeInMinutes = averageResponseTimeInMs / (1000 * 60); // Convert to minutes
    const finalAverageResponseTime = averageResponseTimeInMinutes / 3; // Divide by 3

    // Format into human-readable form
    const seconds = (finalAverageResponseTime * 60).toFixed(2); // Convert minutes to seconds for display
    const minutes = finalAverageResponseTime.toFixed(2);
    const hours = (finalAverageResponseTime / 60).toFixed(2); // Convert minutes to hours for display

    const humanReadable =
      finalAverageResponseTime < 1
        ? `${seconds} seconds`
        : finalAverageResponseTime < 60
          ? `${minutes} minutes`
          : `${hours} hours`;

    res.status(200).json({
      averageResponseTime: finalAverageResponseTime,
      humanReadable,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-users', async (req, res) => {
  try {
    // Aggregate messages by sender
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

    // Separate students and mentors
    const studentIds = topUsers
      .filter((user) => user._id.senderModel === 'Student')
      .map((user) => user._id.sender);

    const mentorIds = topUsers
      .filter((user) => user._id.senderModel === 'Mentor')
      .map((user) => user._id.sender);

    // Fetch user details
    const students = await Student.find(
      { _id: { $in: studentIds } },
      'firstName lastName'
    );
    const mentors = await Mentor.find(
      { _id: { $in: mentorIds } },
      'firstName lastName'
    );

    // Combine results
    const enrichedTopUsers = topUsers.map((user) => {
      const userDetails =
        user._id.senderModel === 'Student'
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

    res.status(200).json(enrichedTopUsers);
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get top senders
// router.get('/admin/top-senders', async (req, res) => {
//   try {
//     const senders = await Message.aggregate([
//       { $group: { _id: '$sender', totalMessages: { $sum: 1 } } },
//       { $sort: { totalMessages: -1 } },
//       { $limit: 5 },
//     ]);
//     res.status(200).json({ senders });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// 5. Get messages by sender type (Student/Mentor)
router.get('/messages-by-sender-type', async (req, res) => {
  try {
    const messagesBySenderType = await Message.aggregate([
      {
        $match: { senderModel: { $in: ['Student', 'Mentor'] } }, // Filter for valid sender types
      },
      {
        $group: {
          _id: '$senderModel', // Group by sender type
          count: { $sum: 1 }, // Count messages for each sender type
        },
      },
      { $sort: { _id: 1 } }, // Optional: Sort by sender type
    ]);

    res.status(200).json(messagesBySenderType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get average-response-time for all matches(Student/Mentor)

router.get('/average-response-time-by-match', async (req, res) => {
  try {
    const matches = await Match.find({}).populate('messages');

    if (!matches.length) {
      return res.status(200).json({ matches: [] });
    }

    const matchMetrics = await Promise.all(
      matches.map(async (match) => {
        const messages = await Message.find({ match: match._id }).sort({
          timestamp: 1,
        });

        if (messages.length < 2) {
          // Not enough messages to calculate response times
          return { matchId: match._id, averageResponseTime: 0 };
        }

        let totalResponseTime = 0;
        let count = 0;

        for (let i = 1; i < messages.length; i++) {
          if (
            messages[i].sender.toString() !== messages[i - 1].sender.toString()
          ) {
            const responseTime =
              new Date(messages[i].timestamp) -
              new Date(messages[i - 1].timestamp);
            totalResponseTime += responseTime;
            count++;
          }
        }

        const averageResponseTime = count > 0 ? totalResponseTime / count : 0;

        return { matchId: match._id, averageResponseTime };
      })
    );

    res.status(200).json({ matchMetrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assuming the response rate is calculated in a utility function
router.get('/response-rate', async (req, res) => {
  try {
    // Get the grouped messages from the helper function
    const groupMessages = await getGroupedMessages();

    // Calculate the total number of conversations
    const totalConversations = groupedMessages.length;

    // Calculate the number of conversations with responses
    const conversationsWithResponse = groupedMessages.filter(
      (convo) => convo.hasResponse
    ).length;

    // Calculate the response rate
    const responseRate = (conversationsWithResponse / totalConversations) * 100;

    // Send the response rate back
    res.status(200).json({ responseRate: responseRate.toFixed(2) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Response Rate by sender type
router.get('/response-rate-by-sender-type', async (req, res) => {
  try {
    const senderTypes = ['Mentor', 'Student']; // Ensure Mentor comes first

    const responseRates = [];

    for (const senderType of senderTypes) {
      // Fetch all messages for the specific sender type (Mentor/Student)
      const messages = await Message.find({ senderModel: senderType }).sort({
        timestamp: 1,
      });

      // Group the messages using the groupConversations utility
      const groupedMessages = groupConversations(messages);

      // Calculate total conversations and those with responses
      let totalConversations = 0;
      let conversationsWithResponse = 0;

      // Loop through the grouped messages
      Object.keys(groupedMessages).forEach((groupKey) => {
        totalConversations++;
        if (groupedMessages[groupKey].hasResponse) {
          conversationsWithResponse++;
        }
      });

      // Calculate the response rate as a percentage
      const responseRate =
        totalConversations > 0
          ? (conversationsWithResponse / totalConversations) * 100
          : 0;

      // Store the response rate for this sender type
      responseRates.push({ senderType, responseRate: responseRate.toFixed(2) });
    }

    // Ensure responseRates is sorted with Mentor first and Student second
    const sortedResponseRates = responseRates.sort((a, b) => {
      if (a.senderType === 'Mentor') return -1; // Mentor comes first
      if (b.senderType === 'Mentor') return 1; // Mentor comes first
      return 0;
    });

    // Return the response rates
    res.status(200).json(sortedResponseRates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/messages-by-month', async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' },
            senderModel: '$senderModel',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    // Transform the data for easier frontend consumption
    const groupedData = messages.reduce((acc, item) => {
      const { month, year, senderModel } = item._id;
      const key = `${year}-${String(month).padStart(2, '0')}`; // Format: YYYY-MM
      if (!acc[key]) acc[key] = { Student: 0, Mentor: 0 };
      acc[key][senderModel] = item.count;
      return acc;
    }, {});

    res.status(200).json(groupedData);
  } catch (error) {
    console.error('Error fetching messages by month:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/average-messages-per-day', async (req, res) => {
  try {
    // Aggregate messages by sender type (Student and Mentor)
    const messagesBySenderType = await Message.aggregate([
      {
        $match: { senderModel: { $in: ['Student', 'Mentor'] } },
      },
      {
        $group: {
          _id: {
            senderModel: '$senderModel',
            day: { $dayOfYear: '$timestamp' },
          }, // Group by sender and day
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } }, // Sort by day
    ]);

    // Transform data to group by sender type (Student or Mentor)
    const result = {
      Student: [],
      Mentor: [],
    };

    // Populate result object with daily counts for each sender
    messagesBySenderType.forEach((item) => {
      const sender = item._id.senderModel;
      result[sender].push(item.count);
    });

    // Calculate the average messages per day for both students and mentors
    const studentMessages =
      result.Student.length > 0
        ? result.Student.reduce((a, b) => a + b) / result.Student.length
        : 0;
    const mentorMessages =
      result.Mentor.length > 0
        ? result.Mentor.reduce((a, b) => a + b) / result.Mentor.length
        : 0;

    // Return the average per day for each sender type
    res.status(200).json({
      studentMessages: studentMessages.toFixed(2),
      mentorMessages: mentorMessages.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aggregating daily active users based on messages sent
router.get('/average-daily-users', async (req, res) => {
  try {
    // Aggregating student messages per day
    const studentMessageAggregation = await Message.aggregate([
      { $match: { senderModel: 'Student' } }, // Only messages from students
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
      }, // Extract date part from timestamp
      { $group: { _id: '$day', activeStudents: { $sum: 1 } } }, // Count messages per day
      { $sort: { _id: 1 } }, // Sort by day
    ]);

    // Aggregating mentor messages per day
    const mentorMessageAggregation = await Message.aggregate([
      { $match: { senderModel: 'Mentor' } }, // Only messages from mentors
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
      }, // Extract date part from timestamp
      { $group: { _id: '$day', activeMentors: { $sum: 1 } } }, // Count messages per day
      { $sort: { _id: 1 } }, // Sort by day
    ]);

    // Combine student and mentor data to get daily counts
    const allDays = new Set([
      ...studentMessageAggregation.map((item) => item._id),
      ...mentorMessageAggregation.map((item) => item._id),
    ]);

    const aggregatedData = [];
    allDays.forEach((day) => {
      const studentData = studentMessageAggregation.find(
        (item) => item._id === day
      ) || { activeStudents: 0 };
      const mentorData = mentorMessageAggregation.find(
        (item) => item._id === day
      ) || { activeMentors: 0 };

      aggregatedData.push({
        day,
        activeStudents: studentData.activeStudents,
        activeMentors: mentorData.activeMentors,
      });
    });

    // Calculate the average number of students and mentors per day
    const totalStudents = aggregatedData.reduce(
      (acc, data) => acc + data.activeStudents,
      0
    );
    const totalMentors = aggregatedData.reduce(
      (acc, data) => acc + data.activeMentors,
      0
    );
    const daysCount = aggregatedData.length;

    const averageStudents = totalStudents / daysCount || 0;
    const averageMentors = totalMentors / daysCount || 0;
    const truncateToTwoDecimal = (value) => Math.trunc(value * 100) / 100;
    // Return the aggregated result
    res.status(200).json({
      averageMentorUsers: truncateToTwoDecimal(averageMentors), // Truncate to two decimal places
      averageStudentUsers: truncateToTwoDecimal(averageStudents), // Truncate to two decimal places
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
