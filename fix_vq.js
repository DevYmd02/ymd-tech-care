const { execSync } = require('child_process');
try {
    const output = execSync('git checkout src/modules/procurement/pages/vq/VQListPage.tsx');
    console.log('Success:', output.toString());
} catch (err) {
    console.error('Error:', err.message);
}
