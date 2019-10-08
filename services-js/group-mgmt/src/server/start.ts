/* eslint no-console: 0 */

import fs = require('fs');

// Entrypoint for our server. Uses require so we can control import order
// and set up error reporting before getting the main server.js file going.

require('dotenv').config();

const start = require('../group-mgmt').default;
console.log('start.server');
console.log('TAIL: START');
fs.watchFile('../../README.md', (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  console.log(`the previous mtime was: ${prev.mtime}`);
});
fs.readFile('../../README.md', function(err, contents) {
  if (err) {
    console.log('Read File Error: ', err);
  }
  console.log('File Contents: ', contents);
});
console.log('TAIL: END');
// console.log('process: ', process);

start().catch(err => {
  console.error('Error starting server', err);
  process.exit(-1);
});
