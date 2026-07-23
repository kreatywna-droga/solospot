const { exec } = require('child_process');
const fs = require('fs');

console.log('Running next build to capture exact error...');
exec('npm run build', (error, stdout, stderr) => {
  const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error ? error.message : 'None'}`;
  fs.writeFileSync('build-error-log.txt', output);
  console.log('Done! Output written to build-error-log.txt');
});
