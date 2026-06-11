export interface DocLinkLike {
    docu_type_id?: string | number;
    docu_item_no?: string | number;
    docu_name_th?: string;
    docu_name_en?: string;
    stock_effect_ic?: number;
    [key: string]: unknown;
}

/**
 * Gets the resolved document name based on the status of the requisition.
 * - If PENDING, uses the original ISSUE_REQ document name.
 * - If APPROVED or REJECTED, uses the mapped APPV_ISSUE document name.
 * 
 * @param status The final status of the requisition (PENDING, APPROVED, REJECTED)
 * @param docLinkId The doc_link_ic_id from the requisition header
 * @param docLinks The list of ISSUE_REQ document links
 * @param appvDocLinks The list of APPV_ISSUE document links
 * @returns The resolved document name to display
 */
export const getResolvedDocName = (
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    docLinkId: string | number | undefined,
    docLinks: DocLinkLike[],
    appvDocLinks: DocLinkLike[]
): string => {
    const docLink = docLinks.find(d => String(Number(d.docu_item_no) - 1) === String(docLinkId) || String(d.docu_type_id) === String(docLinkId));
    const docTypeNo = docLink ? Number(docLink.docu_item_no || 0) : 0;
    const appvDocLink = appvDocLinks.find(d => Number(d.docu_item_no) === docTypeNo);

    if (status === 'APPROVED' || status === 'REJECTED') {
        return appvDocLink
            ? (appvDocLink.docu_name_th || appvDocLink.docu_name_en || '')
            : (docLink ? (docLink.docu_name_th || docLink.docu_name_en || '') : '');
    }

    return docLink
        ? (docLink.docu_name_th || docLink.docu_name_en || '')
        : '';
};
