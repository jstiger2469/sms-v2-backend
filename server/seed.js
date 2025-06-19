const mongoose = require('mongoose');
const fs = require('fs');
const { Types } = mongoose;
// Import models from the 'models' folder
const Student = require('./models/Student');
const Mentor = require('./models/Mentor');
const Match = require('./models/Match');
const Message = require('./models/Message');

mongoose
  .connect(
    'mongodb+srv://jarredmstiger:deeznutztoledo@testclustersms.51hca.mongodb.net/sms',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Connection error', err);
  });

// Read old data from JSON file
const oldData = JSON.parse(fs.readFileSync('outputFile.json', 'utf8'));

// Ensure recipient is an ObjectId

async function migrateOldData() {
  for (let oldMatch of oldData) {
    try {
      // Step 1: Find or create Student and Mentor based on phone number
      const student = await Student.findOne({ phone: oldMatch.studentphone });
      const mentor = await Mentor.findOne({ phone: oldMatch.mentorphone });

      let studentDoc;
      if (!student) {
        studentDoc = await Student.create({
          firstName: oldMatch.studentfirst,
          lastName: oldMatch.studentlast,
          email: oldMatch.studentemail,
          phone: oldMatch.studentphone || '',
        });
      } else {
        studentDoc = student;
      }

      let mentorDoc;
      if (!mentor) {
        mentorDoc = await Mentor.create({
          firstName: oldMatch.mentorfirst,
          lastName: oldMatch.mentorlast,
          email: oldMatch.mentoremail,
          phone: oldMatch.mentorphone || '',
        });
      } else {
        mentorDoc = mentor;
      }

      // Step 2: Create the match document
      const newMatch = await Match.create({
        student: studentDoc._id,
        mentor: mentorDoc._id,
        status: 'active', // Default status
      });

      // Step 3: Migrate messages
      for (let oldMessage of oldMatch.messages) {
        // Step 4: Look up recipient and sender by phone number
        let senderDoc;
        let recipientDoc;
        if (oldMessage.sender === oldMatch.studentphone) {
          senderDoc = studentDoc; // sender is the student
        } else if (oldMessage.sender === oldMatch.mentorphone) {
          senderDoc = mentorDoc; // sender is the mentor
        }

        if (oldMessage.recipient === oldMatch.studentphone) {
          recipientDoc = studentDoc; // recipient is the student
        } else if (oldMessage.recipient === oldMatch.mentorphone) {
          recipientDoc = mentorDoc; // recipient is the mentor
        }

        // Step 5: Ensure sender and recipient are valid
        if (!senderDoc || !recipientDoc) {
          //   console.warn(`Invalid sender or recipient phone number for message: ${oldMessage._id}`);
          continue; // Skip this message if sender or recipient is invalid
        }

        // Step 6: Handle invalid date or empty created_at value

        // This will output the ISO string format of the date
        let stamp = new Date(oldMessage.created_at.$date);
        console.log('stamp', stamp);

        const isoString = stamp.toISOString();

        // Print the ISO string
        console.log('isoString', isoString);

        //    if (isoString && !isNaN(new Date(isoString).getTime())) {
        //      // Create a valid Date object

        //    } else {
        //      console.warn(`Invalid or missing date for message: ${oldMessage._id}. Using current date.`);
        //      timestamp = new Date();  // Default to current date if invalid
        //    }

        // Ensure the timestamp is in the proper ISO format like { "$date": "2022-11-10T16:19:42.96Z" }
        // MongoDB will automatically store the Date object in this format

        // Step 7: Create the Message document with ObjectIds for sender and recipient
        await Message.create({
          content: oldMessage.message,
          sender: senderDoc._id, // Use ObjectId for sender
          recipient: recipientDoc._id, // Use ObjectId for recipient
          senderModel:
            oldMessage.sender === oldMatch.studentphone ? 'Student' : 'Mentor',
          recipientModel:
            oldMessage.recipient === oldMatch.studentphone
              ? 'Student'
              : 'Mentor',
          match: newMatch._id,
          timestamp: isoString, // Use the validated timestamp (MongoDB will format this automatically)
        });
      }

      console.log(
        `Migrated Match for ${oldMatch.studentemail} and ${oldMatch.mentoremail}`
      );
    } catch (err) {
      console.error('Error migrating match:', err);
    }
  }

  console.log('Data migration complete.');
}

// Run migration
migrateOldData()
  .then(() => {
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Migration failed', err);
    mongoose.disconnect();
  });
