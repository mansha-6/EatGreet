const execSync = require('child_process').execSync;
try {
    const out = execSync('node test_onboard.js', { encoding: 'utf-8' });
    console.log(out);
} catch (e) {
    console.log(e.stdout);
    console.log(e.stderr);
}
