function matchPush(match, obj) {
  console.log(match);
  console.log(obj);
  match.messages.push(obj); //should just be the id
  match.markModified('messages');
  console.log(match);
  console.log(obj);
  return match.save();
}

//Add message to match based on Mentor being sender
function addMessageToMatch(obj) {
  Match.findOne({ mentorphone: obj.sender }, function (err, match) {
    if (err) {
      return err;
    }
    return matchPush(match, obj);
  });
}
//Add message to match based on Mentee being sender
function addSMSToMatch(obj) {
  Match.findOne({ studentphone: obj.sender }, function (err, match) {
    if (err) {
      return err;
    }
    return matchPush(match, obj);
  });
}

function MentorSmsOptIn(x, y, z) {
  console.log('mentor');

  const messageBody = `${y} you can get in touch with your student ${z} by replying to this number`;
  const to = '1' + x;
  const from = process.env.TWILIO_PHONE;
  console.log(to);
  console.log(messageBody);
  console.log(from);
  client.messages
    .create({
      body: messageBody,
      from: from,
      to: to,
    })
    .then((message) => {
      console.log('Message sent successfully from sms.', message.sid);
      return message.sid;
    });
}

function StudentSmsOptIn(x, y, z) {
  const messageBody = `${y} You can get in touch with your mentor ${z} by replying to this number`;
  const to = '1' + x;
  const from = process.env.TWILIO_PHONE;

  if (x !== undefined) {
    console.log(to);
    console.log(messageBody);
    console.log(from);
  }

  client.messages
    .create({
      body: messageBody,
      from: from,
      to: to,
    })
    .then((message) => {
      console.log('Message sent successfully from sms.', message.sid);
      return message.sid;
    });
}

async function optInFunc(sender) {
  const Mentor = require('../models/Mentor');
  const Student = require('../models/Student');
  const Match = require('../models/Match');
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const TWILIO_PHONE = process.env.TWILIO_PHONE;

  // Try to find mentor by phone
  const mentor = await Mentor.findOne({ phone: sender });
  if (mentor) {
    await Match.updateMany(
      { mentor: mentor._id },
      { $set: { mentorOptIn: true } }
    );
    // Send confirmation SMS
    await client.messages.create({
      body: 'You have successfully opted in to SMS notifications.',
      from: TWILIO_PHONE,
      to: sender.length === 10 ? `+1${sender}` : `+${sender}`
    });
    return;
  }
  // Try to find student by phone
  const student = await Student.findOne({ phone: sender });
  if (student) {
    await Match.updateMany(
      { student: student._id },
      { $set: { studentOptIn: true } }
    );
    // Send confirmation SMS
    await client.messages.create({
      body: 'You have successfully opted in to SMS notifications.',
      from: TWILIO_PHONE,
      to: sender.length === 10 ? `+1${sender}` : `+${sender}`
    });
    return;
  }
  // If neither found, log error
  console.error('No mentor or student found for phone:', sender);
}

async function optStatus(body, sender) {
  console.log(body, sender);
  //Step one find matches
  const fromMentor = await Match.find({ mentorphone: sender });
  const fromStudent = await Match.find({ studentphone: sender });
  //Step Two pass onto function
  if (fromMentor.length) {
    console.log('mentor', fromMentor);
    const recipient = fromMentor[0].studentphone;
    processResult(fromMentor, body, sender, recipient, addMessageToMatch);
  } else {
    console.log('student', fromStudent, sender);
    const recipient = fromStudent[0].mentorphone;
    processResult(fromStudent, body, sender, recipient, addSMSToMatch);
  }
}

function processResult(result, body, sender, receiver, func) {
  console.log('res', result);
  console.log('body', body);
  console.log('sender', sender);
  console.log('receiver', receiver);
  let msgObj = {
    message: body,
    sender: sender,
    recipient: receiver,
  };
  if (result[0].mentorOptIn && result[0].studentOptIn) {
    console.log('both true');
    return sendSMS(sender, receiver, body, func, msgObj);
  }
  // return sendSMS(sender, receiver, body, addMessageToMatch, msgObj)
}

module.exports = {
  optInFunc,
  // add other exports as needed
};
