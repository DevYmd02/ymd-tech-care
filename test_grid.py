import os

file_path = r'd:\Project ERP\ymd-tech-care\src\modules\procurement\pages\qc\components\QCFormModal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for i, line in enumerate(lines):
    if 740 <= i+1 <= 840:
        if '{' in line or '}' in line:
            output_lines.append(f"{i+1}: {line.strip()}")

output_path = r'd:\Project ERP\ymd-tech-care\output_grid_py.txt'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print("Done python script")
