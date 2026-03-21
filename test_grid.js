const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Project ERP', 'ymd-tech-care', 'src', 'modules', 'procurement', 'pages', 'qc', 'components', 'QCFormModal.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

for (let i = 810; i <= 840; i++) {
    console.log(`${i}: [${lines[i-1]}]`);
}
console.log("Done");
