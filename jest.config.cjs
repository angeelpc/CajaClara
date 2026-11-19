module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/database.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/tests/setup.js']
};
