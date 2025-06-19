const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index'); // Import your app setup directly

const Match = require('../models/Match');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');

let mongoServer;
let server;

beforeAll(async () => {
  process.env.NODE_ENV = 'test'; // Ensure we're in test mode

  // Start the in-memory MongoDB server once
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory MongoDB once (only here, before all tests)
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create the HTTP server
  server = app.listen(4001, () => console.log('Server running on port 4001'));
}, 15000); // Increased timeout for beforeAll hook

// Ensure the MongoDB data is cleaned up between tests
afterEach(async () => {
  await Match.deleteMany();
  await Student.deleteMany();
  await Mentor.deleteMany();
}, 5000); // Increased timeout for afterEach hook

// After all tests, clean up resources
afterAll(async () => {
  // Close the Mongoose connection and stop the in-memory server
  await mongoose.disconnect();
  await mongoServer.stop();

  // Close the server to ensure no hanging connections
  if (server) {
    await new Promise(resolve => server.close(resolve)); // Ensure the server closes
  }
}, 15000); // Increased timeout for afterAll hook

describe('Match Routes', () => {
  let student, mentor, match;

  beforeEach(async () => {
    // Setup fresh data before each test
    student = new Student({ firstName: 'John', lastName: 'Doe', phone: '1234567890' });
    mentor = new Mentor({ firstName: 'Jane', lastName: 'Smith', phone: '0987654321' });

    await student.save();
    await mentor.save();

    match = new Match({ student: student._id, mentor: mentor._id });
    await match.save();
  });

  test('GET /api/matches - should return all matches', async () => {
    const res = await request(server).get('/api/matches');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].student.firstName).toBe('John');
    expect(res.body[0].mentor.firstName).toBe('Jane');
  });

  test('GET /api/matches/:id - should return a single match', async () => {
    const res = await request(server).get(`/api/matches/${match._id}`);
    expect(res.status).toBe(200);
    expect(res.body.student.firstName).toBe('John');
    expect(res.body.mentor.firstName).toBe('Jane');
  });

  test('POST /api/matches/create-match - should create a match', async () => {
    const newStudent = { firstName: 'Alice', lastName: 'Brown', phone: '1111111111' };
    const newMentor = { firstName: 'Bob', lastName: 'Johnson', phone: '2222222222' };

    const res = await request(server)
      .post('/api/matches/create-match')
      .send({ studentData: newStudent, mentorData: newMentor });

    expect(res.status).toBe(201);
    expect(res.body.match).toBeDefined();
    expect(res.body.student.firstName).toBe('Alice');
    expect(res.body.mentor.firstName).toBe('Bob');
  });

  test('DELETE /api/matches/delete-match/:id - should delete a match', async () => {
    const res = await request(server).delete(`/api/matches/delete-match/${match._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Match, student, and mentor deleted successfully');

    const deletedMatch = await Match.findById(match._id);
    expect(deletedMatch).toBeNull();
  });
});
