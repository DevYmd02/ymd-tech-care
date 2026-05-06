import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const replacements = [
    { old: '@utils/cn', new: '@utils' },
    { old: '@utils/logger', new: '@utils' },
    { old: '@utils/numberUtils', new: '@utils' },
    { old: '@utils/errorHandler', new: '@utils' },
    { old: '@utils/formUtils', new: '@utils' },
    // Also handle relative if any
    { old: './cn', new: './common-utils' },
    { old: './logger', new: './common-utils' },
    { old: './numberUtils', new: './common-utils' },
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            replacements.forEach(r => {
                if (content.includes(r.old)) {
                    content = content.split(r.old).join(r.new);
                    changed = true;
                }
            });
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

walk(path.join(process.cwd(), 'src'));
console.log('Deep Clean: All Alias imports updated.');
