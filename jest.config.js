const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Chemin vers votre répertoire Next.js
  dir: './',
});

// Configuration Jest personnalisée
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Gérer les alias de modules
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    'pages/api/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).{js,ts}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};

// createJestConfig est exporté de cette manière pour s'assurer que next/jest peut charger la configuration Next.js qui est asynchrone
module.exports = createJestConfig(customJestConfig);