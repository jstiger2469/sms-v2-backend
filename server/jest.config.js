module.exports = {
    testEnvironment: 'node',
    transform: {},
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional setup file for globals like DB setup
    testMatch: ['**/tests/**/*.test.js'], // Look for tests in tests directory
  };