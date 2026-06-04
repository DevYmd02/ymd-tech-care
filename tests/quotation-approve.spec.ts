import { test, expect } from '@playwright/test';

test.describe('ระบบอนุมัติใบเสนอราคา (Sales Quotation Approval E2E Automation Journey)', () => {
  
  test.beforeEach(async ({ page }) => {
    const useRealBackend = process.env.USE_REAL_BACKEND === 'true';

    if (!useRealBackend) {
      // Mock Auth endpoints
      await page.route('**/api/auth/login*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_signature_for_dev",
            user: {
              id: 2,
              username: "admin",
              employee_id: 2,
              employee: {
                employee_id: 2,
                branch_id: 1,
                employee_code: "EMP0003",
                employee_fullname: "นาย สมชาย ใจดี",
                position_id: 1,
                department_id: 1
              }
            }
          }),
        });
      });

      await page.route('**/api/auth/me*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2,
            username: "admin",
            employee_id: 2,
            employee: {
              employee_id: 2,
              branch_id: 1,
              employee_code: "EMP0003",
              employee_fullname: "นาย สมชาย ใจดี",
              position_id: 1,
              department_id: 1
            }
          }),
        });
      });

      // 1. Mock API ข้อมูลรายการรออนุมัติ (Pending Approval SQs)
      await page.route('**/api/sale-quotation-approval/pending-approval*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              aq_id: 0,
              sq_id: 1001,
              sq_no: 'SQ-2026-0001',
              sq_date: '2026-06-02',
              customer_id: 1,
              customer_name: 'บริษัท ทดสอบ จำกัด',
              customer_code: 'CUST-001',
              status: 'PENDING',
              quote_total_amount: 1500,
              base_total_amount: 1500,
              currency: 'THB',
              exchange_rate: 1,
            }
          ]),
        });
      });

      // 2. Mock API ดึงรายละเอียด SQ รายตัวเพื่อมาแสดงใน Modal
      await page.route('**/api/sale-quotation/1001', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sq_id: 1001,
            sq_no: 'SQ-2026-0001',
            sq_date: '2026-06-02',
            customer_id: 1,
            customer_name: 'บริษัท ทดสอบ จำกัด',
            customer_code: 'CUST-001',
            branch_id: 1,
            currency_code: 'THB',
            isMulticurrency: false,
            exchange_rate: 1,
            exchange_rate_date: '2026-06-02',
            status: 'PENDING',
            sub_total: 1500,
            vat_amount: 105,
            total_amount: 1605,
            tax_code_id: 1,
            payment_term_days: 30,
            sale_area_id: 1,
            emp_sale_id: 1,
            emp_dept_id: 5,
            project_id: 8,
            lines: [
              {
                sq_line_id: 2001,
                item_id: 101,
                item_code: 'ITEM-A',
                item_name: 'สายเคเบิลทองแดง TYPE-C',
                qty: 10,
                uom_id: 1,
                uom_name: 'ชิ้น',
                unit_price: 150,
                discount_expression: '',
                discount_amount: 0,
                net_amount: 1500,
                line_total: 1500,
              }
            ]
          }),
        });
      });

      // 3. Mock API อนุมัติใบเสนอราคา (POST /sale-quotation-approval)
      await page.route('**/api/sale-quotation-approval*', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, aq_no: 'AQ-2026-0001' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        }
      });

      // Mock ดึงรายชื่อพนักงานผู้อนุมัติ
      await page.route('**/api/employees*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { employee_id: 1, employee_code: 'EMP-001', employee_fullname: 'สมชาย ขายดี', emp_type: 'S' }
          ]),
        });
      });

      // Mock รายการสกุลเงินและข้อมูลมาสเตอร์อื่นๆ
      await page.route('**/api/currency*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { currency_id: 1, currency_code: 'THB', name_th: 'บาท' }
          ]),
        });
      });

      await page.route('**/api/price-level*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, code: 'LV1', name: 'ราคาขายส่ง', level_no: 1 }
          ]),
        });
      });

      await page.route('**/api/org-branches*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { branch_id: 1, branch_name: 'ทดสอบBranch1' }
          ]),
        });
      });

      await page.route('**/api/department*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { emp_dept_id: 5, emp_dept_name: 'แผนกการขายและการตลาด', emp_dept_code: 'MKT' }
          ]),
        });
      });
    }

    // เปิดหน้าแรกของแอปและทำ Login เข้าสู่ระบบ
    await page.goto('/auth/login');
    
    // กรอกข้อมูลล็อกอินและทำ Login เข้าสู่ระบบ
    await page.fill('input[placeholder="กรอกชื่อผู้ใช้งานของคุณ"]', 'admin');
    await page.fill('input[placeholder="กรอกรหัสผ่านของคุณ"]', '123456');
    await page.click('button:has-text("เข้าสู่ระบบ")');
    
    // รอให้หน้าจอเปลี่ยนไปที่ Dashboard
    await page.waitForTimeout(2000);
  });

  test('จำลองผู้ใช้สร้างใบเสนอราคาใหม่และอนุมัติสำเร็จ (Approve Journey)', async ({ page }) => {
    // -----------------------------------------------------
    // STEP 1: สร้างใบเสนอราคาตัวใหม่ขึ้นมาเพื่อทำรายการอนุมัติ
    // -----------------------------------------------------
    await page.goto('/sales/quotation');
    await page.click('button:has-text("สร้างใบเสนอราคาใหม่")');

    // เลือกข้อมูลหัวเอกสารด้วย index เพื่อรองรับ DB dev
    await page.selectOption('select[name="branch_id"]', { index: 1 });
    await page.click('div:has(> label:has-text("ลูกค้า")) button');
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'ทดสอบ');
    await page.keyboard.press('Enter');
    await page.locator('div[role="dialog"] tr:has-text("บริษัท ทดสอบ จำกัด")').locator('button:has-text("เลือก")').click();

    await page.fill('input[name="payment_term_days"]', '30');
    await page.selectOption('select[name="emp_dept_id"]', { index: 1 });
    await page.selectOption('select[name="tax_code_id"]', { index: 1 });
    await page.selectOption('select[name="sale_area_id"]', { index: 1 });
    await page.selectOption('select[name="emp_sale_id"]', { index: 1 });
    await page.selectOption('select[name="project_id"]', { index: 1 });
    await page.fill('textarea[name="remarks"]', 'Automated E2E Test - เอกสารเพื่อรออนุมัติ');

    // เพิ่มรายการสินค้าตัวแรกแบบ dynamic
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#quotation-form table tbody tr', { state: 'visible', timeout: 5000 });
    await page.locator('#quotation-form table tbody tr').first().locator('button').first().click();
    await page.locator('div[role="dialog"] input[placeholder*="ค้นหารหัสสินค้า"]').press('Enter');
    await page.waitForTimeout(800);
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(2).fill('1');
    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(3).fill('100.00');

    // ยืนยันบันทึกเอกสาร
    await page.click('button:has-text("บันทึกข้อมูล")');
    await page.click('button:has-text("ยืนยันการบันทึก")');
    await expect(page.locator('form#quotation-form')).toBeHidden();

    // กรองประเภทเฉพาะสถานะ "แบบร่าง" (DRAFT) เพื่อหาใบเสนอราคาใบที่เพิ่งสร้างได้ถูกต้อง
    await page.locator('div:has(> label:has-text("สถานะ")) select').selectOption('DRAFT');
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1500); // รอให้ตารางฟิลเตอร์อัปเดตข้อมูลล่าสุด

    // ดึงเลขที่ใบเสนอราคาจากแถวสุดท้ายของสถานะแบบร่าง (เนื่องจากระบบเรียงลำดับจากเก่าไปใหม่ล่าสุดจึงอยู่ล่างสุด)
    const targetRow = page.locator('table tbody tr').last();
    const sqNo = await targetRow.locator('td').nth(1).innerText(); // ดึง text จากคอลัมน์เลขที่เอกสาร
    console.log(`✨ เอกสารที่สร้างสำเร็จเพื่อนำไปอนุมัติ: ${sqNo}`);

    // คลิกปุ่มส่งอนุมัติ (Send Approval) เพื่อเปลี่ยนสถานะเป็น รออนุมัติ (PENDING)
    await targetRow.locator('button:has-text("ส่งอนุมัติ")').click();
    await page.click('button:has-text("ยืนยันส่งอนุมัติ")');
    await page.waitForTimeout(1500); // รอให้สถานะอัปเดตและบันทึกใน DB สำเร็จ

    // -----------------------------------------------------
    // STEP 2: เดินทางเข้าสู่หน้าจออนุมัติเพื่ออนุมัติใบเสนอราคาใบนี้
    // -----------------------------------------------------
    await page.goto('/sales/quotation-approval');
    
    // พิมพ์รหัสเอกสารลงในช่องค้นหาเพื่อเจาะจงใบที่เราเพิ่งสร้าง
    await page.locator('input[placeholder="SQ-xxxx"]').fill(sqNo);
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่าตารางเรนเดอร์เอกสารที่เราสร้างขึ้นมาสำเร็จ
    await expect(page.locator(`table >> text="${sqNo}"`)).toBeVisible();

    // คลิกพิจารณาอนุมัติ เพื่อเปิด Modal
    await page.locator(`tr:has-text("${sqNo}")`).locator('button:has-text("พิจารณาอนุมัติ")').click();
    
    // รอให้ Modal เปิดขึ้นมา
    await page.waitForSelector('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"', { state: 'visible', timeout: 5000 });

    // -----------------------------------------------------
    // STEP 3: คลิกยืนยันการอนุมัติ
    // -----------------------------------------------------
    await page.locator('div[role="dialog"]').first().getByRole('button', { name: 'อนุมัติ', exact: true }).click();
    await page.locator('div').filter({ has: page.locator('h3:has-text("ยืนยันการอนุมัติใบเสนอราคา")') }).getByRole('button', { name: 'อนุมัติ', exact: true }).click();

    // -----------------------------------------------------
    // STEP 4: ตรวจสอบความสำเร็จ
    // -----------------------------------------------------
    await expect(page.locator('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"')).toBeHidden();
  });

  test('จำลองผู้ใช้สร้างใบเสนอราคาใหม่และกดไม่อนุมัติสำเร็จ (Reject Journey)', async ({ page }) => {
    // =============================================================
    // STEP 1: สร้างใบเสนอราคาตัวใหม่ขึ้นมาเพื่อทำรายการไม่อนุมัติ
    // =============================================================
    await page.goto('/sales/quotation');
    await page.click('button:has-text("สร้างใบเสนอราคาใหม่")');

    // เลือกข้อมูลหัวเอกสารด้วย index เพื่อรองรับ DB dev
    await page.selectOption('select[name="branch_id"]', { index: 1 });
    await page.click('div:has(> label:has-text("ลูกค้า")) button');
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'ทดสอบ');
    await page.keyboard.press('Enter');
    await page.locator('div[role="dialog"] tr:has-text("บริษัท ทดสอบ จำกัด")').locator('button:has-text("เลือก")').click();

    await page.fill('input[name="payment_term_days"]', '30');
    await page.selectOption('select[name="emp_dept_id"]', { index: 1 });
    await page.selectOption('select[name="tax_code_id"]', { index: 1 });
    await page.selectOption('select[name="sale_area_id"]', { index: 1 });
    await page.selectOption('select[name="emp_sale_id"]', { index: 1 });
    await page.selectOption('select[name="project_id"]', { index: 1 });
    await page.fill('textarea[name="remarks"]', 'Automated E2E Test - เอกสารเพื่อทดสอบการไม่อนุมัติ');

    // เพิ่มรายการสินค้าตัวแรกแบบ dynamic
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#quotation-form table tbody tr', { state: 'visible', timeout: 5000 });
    await page.locator('#quotation-form table tbody tr').first().locator('button').first().click();
    await page.locator('div[role="dialog"] input[placeholder*="ค้นหารหัสสินค้า"]').press('Enter');
    await page.waitForTimeout(800);
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(2).fill('1');
    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(3).fill('100.00');

    // ยืนยันบันทึกเอกสาร
    await page.click('button:has-text("บันทึกข้อมูล")');
    await page.click('button:has-text("ยืนยันการบันทึก")');
    await expect(page.locator('form#quotation-form')).toBeHidden();

    // กรองสถานะ "แบบร่าง" (DRAFT) เพื่อหาใบที่เพิ่งสร้าง
    await page.locator('div:has(> label:has-text("สถานะ")) select').selectOption('DRAFT');
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1500);

    const targetRow = page.locator('table tbody tr').last();
    const sqNo = await targetRow.locator('td').nth(1).innerText();
    console.log(`🚫 เอกสารที่สร้างสำเร็จเพื่อทดสอบการไม่อนุมัติ: ${sqNo}`);

    // คลิกส่งอนุมัติ เพื่อเปลี่ยนสถานะเป็น PENDING
    await targetRow.locator('button:has-text("ส่งอนุมัติ")').click();
    await page.click('button:has-text("ยืนยันส่งอนุมัติ")');
    await page.waitForTimeout(1500);

    // =============================================================
    // STEP 2: เดินทางเข้าสู่หน้าจออนุมัติ
    // =============================================================
    await page.goto('/sales/quotation-approval');

    await page.locator('input[placeholder="SQ-xxxx"]').fill(sqNo);
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1000);

    // ตรวจสอบว่าเอกสารแสดงในตาราง
    await expect(page.locator(`table >> text="${sqNo}"`)).toBeVisible();

    // คลิกพิจารณาอนุมัติ เพื่อเปิด Modal
    await page.locator(`tr:has-text("${sqNo}")`).locator('button:has-text("พิจารณาอนุมัติ")').click();
    await page.waitForSelector('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"', { state: 'visible', timeout: 5000 });

    // =============================================================
    // STEP 3: ทดสอบกดไม่อนุมัติโดยไม่กรอกเหตุผล (ต้องแสดง Validation Error)
    // =============================================================
    await page.locator('div[role="dialog"]').first().getByRole('button', { name: 'ไม่อนุมัติ', exact: true }).click();
    
    // ระบบต้องแสดงข้อความแจ้งเตือน "กรุณาระบุเหตุผลที่ไม่อนุมัติ" 
    // และ Modal ยืนยันต้องไม่ขึ้นมา
    await page.waitForTimeout(500);
    await expect(page.locator('text="ยืนยันการไม่อนุมัติใบเสนอราคา"')).toBeHidden();

    // =============================================================
    // STEP 4: กรอกเหตุผลที่ไม่อนุมัติ แล้วกดไม่อนุมัติอีกครั้ง
    // =============================================================
    await page.locator('input[placeholder="ระบุเหตุผล..."]').fill('E2E Test - ราคาไม่เหมาะสม ต้องปรับปรุงใหม่');

    await page.locator('div[role="dialog"]').first().getByRole('button', { name: 'ไม่อนุมัติ', exact: true }).click();

    // รอ Confirmation Modal ขึ้นมา
    await page.waitForSelector('text="ยืนยันการไม่อนุมัติใบเสนอราคา"', { state: 'visible', timeout: 5000 });

    // คลิกยืนยันไม่อนุมัติ
    await page.locator('div').filter({ has: page.locator('h3:has-text("ยืนยันการไม่อนุมัติใบเสนอราคา")') }).getByRole('button', { name: 'ยืนยันไม่อนุมัติ', exact: true }).click();

    // =============================================================
    // STEP 5: ตรวจสอบความสำเร็จ — Modal ต้องปิดลง
    // =============================================================
    await expect(page.locator('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"')).toBeHidden();
  });
});
