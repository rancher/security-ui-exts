import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  setupFilesAfterEnv:     ['./jest.setup.ts'],
  testEnvironment:        'jest-environment-jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  modulePaths:            ['<rootDir>'],
  moduleFileExtensions:   ['js', 'mjs', 'json', 'vue', 'ts', 'tsx'],
  moduleNameMapper:       {
    '^clipboard-polyfill$': '<rootDir>/node_modules/clipboard-polyfill/dist/es6/clipboard-polyfill.es6.js',
    '^~/(.*)$':    '<rootDir>/$1',
    '^~~/(.*)$':   '<rootDir>/$1',
    '^@/(.*)$':    '<rootDir>/$1',
    '@shell/(.*)': '<rootDir>/node_modules/@rancher/shell/$1',
    '@components/(.*)':
      '<rootDir>/node_modules/@rancher/components/dist/@rancher/components.common.js',
    '@vulnerability-scanner/(.*)':      '<rootDir>/pkg/vulnerability-scanner/$1',
    '@network/(.*)':                 '<rootDir>/pkg/network/$1',
    '@runtime-enforcer/(.*)': '<rootDir>/pkg/runtime-enforcer/$1',
    '@common/(.*)':                   '<rootDir>/pkg/common/$1',
    '@kubewarden/(.*)':               '<rootDir>/pkg/kubewarden/$1',
    '@tests/(.*)':                   '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    '^.+\\.mjs$':  '<rootDir>/node_modules/babel-jest',
    '.*\\.vue$':   '<rootDir>/node_modules/@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    '^.+\\.svg$':  '<rootDir>/tests/unit/config/svgTransform.ts' // to mock `*.svg` files
  },
  transformIgnorePatterns:  ['/node_modules/(?!(@vue|@rancher|jsonpath-plus|color|color-string|color-convert|color-name|vee-validate|@vee-validate|clipboard-polyfill|intl-messageformat|@formatjs|@replit/codemirror-vim-core)/)'],
  modulePathIgnorePatterns: [
    '<rootDir>/scripts/',
    '<rootDir>/assets/',
    '<rootDir>/charts/',
    '<rootDir>/extensions/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/kubewarden/',
  ],
  coverageDirectory:   '<rootDir>/coverage/unit',
  collectCoverage:     true,
  collectCoverageFrom: [
    'pkg/vulnerability-scanner/**/*.{js,vue}',
    'pkg/common/**/*.{js,vue}',
    'pkg/kubewarden/**/*.{js,ts,vue}',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageReporters: ['text', 'cobertura'],
  // coverageReporters: ['json', 'text-summary'],
  coverageProvider:  'v8',
  preset:            'ts-jest',
};

export default config;
