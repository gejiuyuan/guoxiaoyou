import os from 'os';

const config = {
  useTabs: false,
  tabWidth: 2,
  printWidth: 90,
  semi: true,
  endOfLine: os.platform() === 'win32' ? 'crlf' : 'lf',
  quoteProps: 'as-needed',
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
  htmlWhitespaceSensitivity: 'strict',
};

export default config;
