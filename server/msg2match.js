const mongoose = require('mongoose');
const Match = require('./models/Match'); // Adjust with the correct path to your models
const Message = require('./models/Message'); // Adjust with the correct path to your models

require('./db/connection'); // MongoDB connection

// Connect to MongoDB (Adjust connection string as needed)

async function addMessagesToMatches() {
  try {
    // Step 1: Retrieve all messages from the 'messages' collection
    const messages = await Message.find();

    // Step 2: Loop over each message and find the corresponding match
    for (const message of messages) {
      // Step 3: Find the match document using the 'match' field in the message
      const match = await Match.findById(message.match); // message.match holds the ObjectId of the match

      // If the match is found, we update its messages array
      if (match) {
        // Step 4: Add the message's _id to the match's messages array
        if (!match.messages.includes(message._id)) {
          match.messages.push(message._id); // Push the message _id into the messages array
        }

        // Save the updated match document
        await match.save();
        console.log(`Added message ${message._id} to match ${match._id}`);
      } else {
        console.log(`Match not found for message ${message._id}`);
      }
    }

    console.log('All messages added to matches.');
  } catch (error) {
    console.error('Error adding messages to matches:', error);
  } finally {
    mongoose.disconnect(); // Close the connection once done
  }
}

// Run the script
addMessagesToMatches();
