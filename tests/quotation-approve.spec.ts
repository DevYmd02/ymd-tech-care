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
              customer_name: 'บริษัท สยามทีทีเค จำกัด',
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
            customer_name: 'บริษัท สยามทีทีเค จำกัด',
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

  test('จำลองผู้ใช้อนุมัติใบเสนอราคาสำเร็จ (Approve Journey)', async ({ page }) => {
    // -----------------------------------------------------
    // STEP 1: เดินทางเข้าสู่หน้าจอการอนุมัติใบเสนอราคา
    // -----------------------------------------------------
    await page.goto('/sales/quotation-approval');
    
    // ตรวจสอบว่าตารางเรนเดอร์เอกสาร SQ-2026-0001 สำเร็จ
    await expect(page.locator('table >> text="SQ-2026-0001"')).toBeVisible();

    // -----------------------------------------------------
    // STEP 2: คลิกพิจารณาอนุมัติ เพื่อเปิด Modal
    // -----------------------------------------------------
    await page.click('table button:has-text("พิจารณาอนุมัติ")');
    
    // รอให้ Modal เปิดขึ้นมา
    await page.waitForSelector('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"', { state: 'visible', timeout: 5000 });

    // -----------------------------------------------------
    // STEP 3: คลิกยืนยันการอนุมัติ
    // -----------------------------------------------------
    // คลิกปุ่ม "อนุมัติ" สีเขียวที่ footer ของ Modal พิจารณาอนุมัติ
    await page.locator('div[role="dialog"]').first().getByRole('button', { name: 'อนุมัติ', exact: true }).click();

    // ยืนยันในกล่อง Confirmation Dialog
    await page.locator('div').filter({ has: page.locator('h3:has-text("ยืนยันการอนุมัติใบเสนอราคา")') }).getByRole('button', { name: 'อนุมัติ', exact: true }).click();

    // -----------------------------------------------------
    // STEP 4: ตรวจสอบความสำเร็จ
    // -----------------------------------------------------
    // ตรวจสอบว่า Modal พิจารณาอนุมัติถูกปิดลงเรียบร้อย
    await expect(page.locator('text="พิจารณาอนุมัติใบเสนอราคา (Quotation Approval)"')).toBeHidden();
  });
});
