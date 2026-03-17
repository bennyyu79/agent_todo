// Jest setup file
import '@jest/globals';

// Set default timeout
jest.setTimeout(10000);

// Global setup
beforeAll(() => {
  console.log('Setting up tests...');
});

afterAll(() => {
  console.log('Tearing down tests...');
});
