import type { IssueRequisitionHeader, IssueRequisitionLine } from '../../requisition/types/requisition.types';

export const RequisitionApprovalHelper = {
    translateHeaderAndLines: (
        header: IssueRequisitionHeader,
        lines: IssueRequisitionLine[],
        branches: unknown[],
        departments: unknown[],
        jobs: unknown[],
        employees: unknown[],
        items: unknown[],
        uoms: unknown[],
        warehouses: unknown[],
        locations: unknown[],
        docLinks: unknown[]
    ) => {
        const rawBranches = branches as Record<string, unknown>[];
        const rawDepartments = departments as Record<string, unknown>[];
        const rawJobs = jobs as Record<string, unknown>[];
        const rawEmployees = employees as Record<string, unknown>[];
        const rawItems = items as Record<string, unknown>[];
        const rawUoms = uoms as Record<string, unknown>[];
        const rawWarehouses = warehouses as Record<string, unknown>[];
        const rawLocations = locations as Record<string, unknown>[];
        const rawDocLinks = docLinks as Record<string, unknown>[];

        const rawHeader = header as unknown as Record<string, unknown>;

        // Resolve names for header
        const docLink = rawDocLinks.find(d => Number(d.docu_type_id) === Number(rawHeader.doc_link_ic_id || header.docu_item_no));
        const docuItemNo = docLink ? (docLink.docu_name_th as string || docLink.docu_name_en as string) : '';

        const branchId = String(rawHeader.branch_id || header.branch_id || '');
        const branch = rawBranches.find(b => String(b.branch_id || b.id) === branchId);
        const branchName = branch ? (branch.branch_name as string || branch.name as string) : '';

        const deptId = String(rawHeader.emp_dept_id || header.emp_dept_id || '');
        const dept = rawDepartments.find(d => String(d.emp_dept_id || d.department_id || d.id) === deptId);
        const deptName = dept ? (dept.emp_dept_name as string || dept.department_name as string || dept.dept_name as string) : '';

        const jobId = String(rawHeader.project_id || header.job_id || '');
        const job = rawJobs.find(j => String(j.job_id || j.id) === jobId);
        const jobName = job ? (job.job_name as string || job.name as string) : '';

        const createdByEmpId = String(rawHeader.created_by_emp_id || header.created_by_emp_id || '');
        const saveEmp = rawEmployees.find(e => String(e.employee_id || e.id) === createdByEmpId);
        const saveEmpName = saveEmp ? (saveEmp.employee_fullname as string || saveEmp.employee_name as string) : '';

        const requestByEmpId = String(rawHeader.request_by_emp_id || header.request_by_emp_id || '');
        const requestEmp = rawEmployees.find(e => String(e.employee_id || e.id) === requestByEmpId);
        const requestEmpName = requestEmp ? (requestEmp.employee_fullname as string || requestEmp.employee_name as string) : '';

        const rawDate = String(rawHeader.issue_req_date || header.docu_date || '');
        const docuDateStr = rawDate ? rawDate.substring(0, 10) : '';

        const remarkStr = String(rawHeader.remarks || header.remark || '');

        // Resolve names for lines
        const resolvedLines = lines.map((l, i) => {
            const rawLine = l as unknown as Record<string, unknown>;
            const item = rawItems.find(itm => String(itm.item_id || itm.id) === String(l.item_id));
            const uom = rawUoms.find(u => String(u.uom_id || u.id) === String(l.uom_id));
            const wh = rawWarehouses.find(w => String(w.warehouse_id || w.id) === String(l.warehouse_id));
            const loc = rawLocations.find(locItem => String(locItem.location_id || locItem.id) === String(l.location_id));
            const lotObj = (rawLine.lot || rawLine.item_lot || rawLine.lot_balance || {}) as Record<string, unknown>;
            const resolvedLotNo = l.lot_no || String(lotObj.lot_no || lotObj.lot_number || lotObj.lot_no_code || lotObj.code || '') || '';

            return {
                docu_item_line_id: l.docu_item_line_id,
                listno: l.listno || i + 1,
                item_id: l.item_id,
                item_code: item ? (item.item_code as string) : (l.item_code || ''),
                item_name: item ? (item.item_name as string) : (l.item_name || ''),
                uom_id: l.uom_id,
                uom_name: (() => {
                    if (rawLine.uom_name) return String(rawLine.uom_name);

                    const uomObj = (rawLine.uom || rawLine.uom_master || rawLine.uom_conversion || rawLine.uomConversion || {}) as Record<string, unknown>;
                    if (uom) {
                        return (uom.uom_name as string || uom.uom_name_en as string || uom.uom_code as string || '');
                    }
                    if (uomObj.uom_name || uomObj.name || uomObj.name_th || uomObj.name_en || uomObj.uom_code || uomObj.code) {
                        return (uomObj.uom_name || uomObj.name || uomObj.name_th || uomObj.name_en || uomObj.uom_code || uomObj.code) as string;
                    }
                    if (item) {
                        const rawItem = item as unknown as Record<string, unknown>;
                        if (String(rawItem.uom_id || rawItem.base_uom_id) === String(l.uom_id)) {
                            return (rawItem.uom_name || rawItem.base_uom_name || '') as string;
                        }
                        const conversions = (rawItem.uom_conversions || rawItem.uomConversions || []) as Record<string, unknown>[];
                        const matchedConv = conversions.find(c => 
                            String(c.from_unit_id || c.from_uom_id) === String(l.uom_id) ||
                            String(c.to_unit_id || c.to_uom_id) === String(l.uom_id)
                        );
                        if (matchedConv) {
                            if (String(matchedConv.from_unit_id || matchedConv.from_uom_id) === String(l.uom_id)) {
                                return (matchedConv.from_unit_name || matchedConv.from_uom_name || '') as string;
                            }
                            return (matchedConv.to_unit_name || matchedConv.to_uom_name || '') as string;
                        }
                    }
                    return String(l.uom_id || '-');
                })(),
                warehouse_id: l.warehouse_id,
                warehouse_name: wh ? (wh.warehouse_name as string || wh.name as string) : String(l.warehouse_id),
                location_id: l.location_id,
                location_name: loc ? (loc.name_th as string || loc.code as string || (loc as unknown as Record<string, unknown>).location_name as string || (loc as unknown as Record<string, unknown>).name as string) : String(l.location_id || ''),
                lot_id: l.lot_id,
                lot_no: resolvedLotNo,
                qty_ic: l.qty_ic || (rawLine.qty as number) || 0,
                qty_approved: typeof rawLine.qty_approved === 'number' ? rawLine.qty_approved : (l.qty_ic || (rawLine.qty as number) || 0),
                is_approved: typeof rawLine.is_approved === 'boolean' ? rawLine.is_approved : true,
                remark: l.remark || '',
                conversion_factor: typeof rawLine.conversion_factor === 'number' ? rawLine.conversion_factor : 1,
                to_uom_name: typeof rawLine.to_uom_name === 'string' ? rawLine.to_uom_name : '',
            };
        });

        return {
            translatedHeader: {
                docu_item_id: header.docu_item_id,
                issue_req_no: header.issue_req_no,
                docu_item_no: docuItemNo,
                docu_date: docuDateStr,
                branch_id: branchId,
                branch_name: branchName,
                emp_dept_id: deptId,
                emp_dept_name: deptName,
                job_id: jobId,
                job_name: jobName,
                created_by_emp_id: createdByEmpId,
                save_emp_name: saveEmpName,
                request_by_emp_id: requestByEmpId,
                request_emp_name: requestEmpName,
                remark: remarkStr,
                qty_total: header.qty_total,
                stock_effect_ic: header.stock_effect_ic,
            },
            translatedLines: resolvedLines,
        };
    }
};
