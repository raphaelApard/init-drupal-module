#!/usr/bin/env node
// Usage: npx create-ovh-module my_module_name

import chalk from 'chalk';
import path from 'node:path';
import uniqid from 'uniqid';
import { readFileSync, renameSync, rmSync } from 'fs';
import { copySync } from 'fs-extra/esm';
import { input, select } from '@inquirer/prompts';
import { parse as parseYml } from 'yaml'
import { glob } from 'glob'
import { toCamelCase, executeCommand, exitOnError, replaceInFile } from './lib.mjs';

let templateRepository;
let moduleName;
const placeholder = 'MODULE_NAME';
const placeholderLowerCamelCase = toCamelCase(placeholder.toLowerCase());
const placeholderCamelCase = placeholderLowerCamelCase.charAt(0).toUpperCase() + placeholderLowerCamelCase.slice(1);
const projectDir = path.resolve();
const tempFolder = path.resolve(projectDir, uniqid());

// Available templates
const templates = [
  {
    name: 'Drupal default (js/css)',
    value: 'git@github.com:raphaelApard/drupal-module-tpl-default-js.git',
    description: 'Basic eslint drupal configuration',
  },
  {
    name: 'Drupal js/scss',
    value: 'git@github.com:raphaelApard/drupal-module-tpl-js-scss.git',
    description: 'Eslint drupal configuration with sass and livereload',
  },
  {
    name: 'Custom repository',
    value: 'custom-repository',
    description: 'Specify a custom repository',
  },
];

// Retrieve module informations
const infoFiles = await glob('./*.info.yml');
if (infoFiles.length !== 1) {
  exitOnError('You must run this command inside a drupal module or theme.');
}
const moduleInfo = parseYml(readFileSync(infoFiles[0], 'utf8'));
moduleName = moduleInfo.project ? moduleInfo.project : path.basename(process.cwd());

// Custom template is set as argument
const customTemplateRepositoryUrl = process.argv[2];
if (customTemplateRepositoryUrl) {
  templateRepository = customTemplateRepositoryUrl;
}
else {
  // Ask for template to use
  templateRepository = await select({
    name: 'module_name',
    message: `Wich template do you want to use to initialize ${chalk.green.bold(moduleInfo.name)} module?`,
    choices: templates,
  });

  // If template is set to custom-repository, ask for the repository url
  if (templateRepository === 'custom-repository') {
    templateRepository = await input({ message: 'Enter your repository template url:' });
  }
}

// Download selected template
executeCommand(`git clone --depth 1 ${templateRepository} ${tempFolder}`);

// Rename template filename and content placeholders
let templateFiles = await glob(`${tempFolder}/**/*`, { nodir: true });
templateFiles = templateFiles
  .map(filename => {
    if (!filename.includes(placeholder)) {
      return filename;
    }
    const newFilename = filename.replace(placeholder, moduleName);
    renameSync(filename, newFilename);
    return newFilename;
  });

templateFiles
  .forEach(filename => {
    replaceInFile(filename, placeholder, moduleName);
    const lowerCamelCase = toCamelCase(moduleName);
    const camelCase = lowerCamelCase.charAt(0).toUpperCase() + lowerCamelCase.slice(1);
    replaceInFile(filename, placeholderLowerCamelCase, lowerCamelCase);
    replaceInFile(filename, placeholderCamelCase, camelCase);
  });

// Move template file to module folder
rmSync(path.resolve(tempFolder, '.git'), { recursive: true, force: true });
copySync(tempFolder, projectDir);

// Delete temp folder
executeCommand(`rm -rf ${tempFolder}`);

console.log(chalk.green(`Your module ${moduleInfo.name} was initialized successfully!`));