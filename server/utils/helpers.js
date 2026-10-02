const { normalizePhone, toE164 } = require('./phone');
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

const UNKNOWN_NUMBER_MSG =
  "We couldn't find your number in Seedling SMS. Please contact your program coordinator so they can update your phone number.";

async function findParticipant(sender) {
  const Mentor = require('../models/Mentor');
  const Student = require('../models/Student');
  const digits = normalizePhone(sender);
  if (!digits) return { digits: null };
  const mentor = await Mentor.findOne({ phone: digits });
  if (mentor) return { digits, mentor };
  const student = await Student.findOne({ phone: digits });
  return { digits, student };
}

async function setOptIn(sender, value) {
  const Match = require('../models/Match');
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const TWILIO_PHONE = process.env.TWILIO_PHONE;

  const { digits, mentor, student } = await findParticipant(sender);
  const to = toE164(sender);

  if (!mentor && !student) {
    console.error(`[opt-${value ? 'in' : 'out'}] No mentor or student found for phone:`, sender, '-> normalized:', digits);
    // Let the sender know instead of silently ignoring them (not on STOP: carriers already confirm that)
    if (value && to) {
      await client.messages.create({ body: UNKNOWN_NUMBER_MSG, from: TWILIO_PHONE, to });
    }
    return { found: false };
  }

  const field = mentor ? 'mentorOptIn' : 'studentOptIn';
  const filter = mentor ? { mentor: mentor._id } : { student: student._id };
  await Match.updateMany(filter, { $set: { [field]: value } });

  // Twilio auto-replies to STOP itself; only confirm opt-ins
  if (value) {
    await client.messages.create({
      body: 'You have successfully opted in to SMS notifications.',
      from: TWILIO_PHONE,
      to,
    });
  }
  return { found: true, role: mentor ? 'mentor' : 'student' };
}

const optInFunc = (sender) => setOptIn(sender, true);
const optOutFunc = (sender) => setOptIn(sender, false);

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
  optOutFunc,
  // add other exports as needed
};
