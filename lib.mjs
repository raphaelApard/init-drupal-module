import chalk from 'chalk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Convert snake case to camel case
export const toCamelCase = (s) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

// Execute command function
export const executeCommand = (command) => {
  try {
    execSync(`${command}`, {stdio: 'inherit'});
  }
  catch(error) {
    exitOnError(error);
  }
}

// Exit on error function
export const exitOnError = (error) => {
  if (error) {
    console.log(chalk.bgRed(error));
    process.exit(-1);
  }
}

// Replace in file function
export const replaceInFile = (file, search, replace) => {
  const content = readFileSync(file, 'utf-8');
  const replaced = content.replace(new RegExp(search, 'g'), replace);
  writeFileSync(file, replaced, 'utf-8');
}