
/** apps/auth-service/jest.config.js */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],

  transform: { '^.+\\.ts$': 'ts-jest' },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html' , 'json-summary'],

  // ➜ 10 minutes pour le TOUT PREMIER download (~509 MB)
  testTimeout: 600_000,

  // ➜ mono‑processus pendant le download initial
  maxWorkers: 1,

  verbose: true,

  // ➜ Config ts-jest (désactiver diagnostics bloquants)
  globals: {
    'ts-jest': {
      // Laisse ts-jest faire la transpilation sans échouer sur ces codes
      diagnostics: {
        warnOnly: true,           // affiche en warning au lieu de bloquer
        ignoreCodes: [6133, 6196] // TS6133: unused locals; TS6196: imports never used
      },
      // (Optionnel) override quelques flags TS pour les tests seulement :
      tsconfig: {
        compilerOptions: {
          noUnusedLocals: false,
          noUnusedParameters: false,
          // évite des surprises sur paths si tu en utilises
          // "esModuleInterop": true
        }
      }
    }
  }
};
