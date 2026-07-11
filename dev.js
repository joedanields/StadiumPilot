const { spawn } = require('child_process');
const path = require('path');

function run(name, cmd, args, cwd) {
  const proc = spawn(cmd, args, { cwd, shell: true, stdio: 'inherit' });
  proc.on('error', (err) => console.error(`[${name}] Error:`, err.message));
  return proc;
}

const server = run('server', 'npm', ['run', 'dev'], path.join(__dirname, 'server'));
const client = run('client', 'npm', ['run', 'dev'], path.join(__dirname, 'client'));

function cleanup() {
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
