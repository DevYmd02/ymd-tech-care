const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, 'src', 'modules', 'master-data', 'inventory', 'hooks');

const files = [
    'useBrandForm.ts',
    'useColorForm.ts',
    'useSizeForm.ts',
    'useModelForm.ts',
    'useGradeForm.ts',
    'usePatternForm.ts',
    'useDesignForm.ts',
    'useShelfForm.ts'
];

files.forEach(filename => {
    const filepath = path.join(hooksDir, filename);
    if (!fs.existsSync(filepath)) {
        console.log(`File not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Add useDebounce import after react-hook-form or near top
    if (!content.includes('useDebounce')) {
        content = content.replace(
            "import { useCallback, useEffect } from 'react';",
            "import { useCallback, useEffect } from 'react';\nimport { useDebounce } from '@/shared/hooks/useDebounce';"
        );
    }

    // 2. Add useWatch to react-hook-form
    content = content.replace(
        "import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';",
        "import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';"
    );

    // 3. Find Service name
    const serviceMatch = content.match(/import { (\w+Service) }/);
    if (!serviceMatch) {
        console.log(`Could not find Service in ${filename}`);
        return;
    }
    const serviceName = serviceMatch[1];
    
    // Find Query Key (e.g. invalidateQueries({ queryKey: ['brands'] }))
    const queryKeyMatch = content.match(/queryKey: \[\'(\w+)\'\]/);
    const queryKey = queryKeyMatch ? queryKeyMatch[1] : 'unknown';

    // 4. Update useForm destructuring
    content = content.replace(
        /const {\s*register,\s*handleSubmit: rhfHandleSubmit,\s*reset,\s*formState: { errors }\s*} = useForm<(\w+)>\({/g,
        `const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm<$1>({`
    );

    // 5. Update resolver inside useForm if needed (usually isResolver/zodResolver)
    // 6. Insert Validation logic right after useForm declaration
    const useFormRegex = /defaultValues: initialFormData\s*}\);/g;
    
    const duplicateValidationBlock = `defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['${serviceName.toLowerCase()}-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return ${serviceName}.getAll({ code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.id !== editId
            );

            if (isDuplicate) {
                setError('code', { type: 'manual', message: 'รหัสซ้ำในระบบ' });
            } else if (errors.code?.message === 'รหัสซ้ำในระบบ') {
                clearErrors('code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.code?.message]);`;

    // Replace useForm edge and append block
    if (content.match(useFormRegex)) {
         content = content.replace(useFormRegex, duplicateValidationBlock);
    } else {
        console.log(`Could not match useForm edge in ${filename}`);
        return;
    }

    // 7. Add useQuery import if not present
    if (!content.includes('useQuery }') && !content.includes(', useQuery }')) {
        content = content.replace(
            "import { useMutation, useQueryClient } from '@tanstack/react-query';",
            "import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';"
        );
    }

    // 8. Update onError handler
    const onErrorRegex = /onError: async \(error: Error\) => {[\s\S]*?logger\.error\('Save \w+ error:', error\);([\s\S]*?)await confirm\({ title: 'เกิดข้อผิดพลาด'[\s\S]*?}\);/g;
    
    // Let's make it simpler, replace the whole onError block
    content = content.replace(
        /onError: async \(error: Error\) => {([\s\S]*?)await confirm\({ title: 'เกิดข้อผิดพลาด', description: error\.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true }\);/g,
        `onError: async (error: Error) => {
            logger.error('Save error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('code', { message: 'รหัสซ้ำในระบบ' });
                return;
            }

            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });`
    );

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Processed: ${filename}`);
});
