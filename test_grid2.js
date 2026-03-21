const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Project ERP', 'ymd-tech-care', 'src', 'modules', 'procurement', 'pages', 'qc', 'components', 'QCFormModal.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let output = '';
let insideGrid = false;

lines.forEach((line, index) => {
    const i = index + 1;
    if (line.includes('<div className="grid') && i > 770) {
        insideGrid = true;
    }
    if (insideGrid && line.includes('}')) {
        output += `${i}: ${line.trim()}\n`;
    }
    if (insideGrid && line.includes('</div>') && (line.includes(')') || lines[index+1]?.includes(')'))) {
        insideGrid = false;
    }
});

fs.writeFileSync(path.join('d:', 'Project ERP', 'ymd-tech-care', 'output_grid2.txt'), output);
console.log("Done");
