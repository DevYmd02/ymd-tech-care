import { test, expect } from '@playwright/test';

test.describe('ระบบใบเสนอราคา (Sales Quotation E2E Automation Journey)', () => {
  
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

      // 1. Mock API ข้อมูลมาสเตอร์ดาต้า (Master Data) ทั้งหมด
      await page.route('**/api/customer-master*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, customer_id: 1, customer_code: 'CUST-001', customer_name_th: 'บริษัท สยามทีทีเค จำกัด' }
          ]),
        });
      });

      await page.route('**/api/org-branches*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { branch_id: 1, branch_name: 'สำนักงานใหญ่' }
          ]),
        });
      });

      await page.route('**/api/currency*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { currency_id: 1, currency_code: 'THB', name_th: 'บาท' }
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

      await page.route('**/api/tax-code*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { tax_code_id: 1, tax_code: 'VAT 7%', tax_rate: 7 }
          ]),
        });
      });

      await page.route('**/api/project*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { project_id: 8, project_name: 'โครงการขยายศูนย์คอมพิวเตอร์' }
          ]),
        });
      });

      await page.route('**/api/employee-sale-area*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { sale_area_id: 1, sale_area_code: 'BKK', sale_area_name: 'กรุงเทพและปริมณฑล' }
          ]),
        });
      });

      await page.route('**/api/employees*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { employee_id: 1, employee_code: 'EMP-001', employee_fullname: 'สมชาย ขายดี', emp_type: 'S' }
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

      // Mock รายการสินค้าสำหรับ ProductSearchModal
      await page.route('**/api/item-master*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 101, item_id: 101, item_code: 'ITEM-A', item_name: 'สายเคเบิลทองแดง TYPE-C', standard_cost: 150, uom_id: 1, uom_name: 'ชิ้น' }
            ],
            total: 1
          }),
        });
      });

      // Mock หน่วยนับ (UOM)
      await page.route('**/api/uom*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 1, uom_id: 1, uom_code: 'PCS', uom_name: 'ชิ้น', is_active: true }
            ],
            total: 1
          }),
        });
      });

      // Mock UOM Conversion
      await page.route('**/api/item-uom/item/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              item_uom_id: 1,
              item_id: 101,
              from_uom_id: 1,
              to_uom_id: 1,
              factor: 1,
              is_purchase_uom: false,
              is_active: true,
              created_at: '',
              from_uom: { uom_name: 'ชิ้น', uom_code: 'PCS' },
              to_uom: { uom_name: 'ชิ้น', uom_code: 'PCS' }
            }
          ]),
        });
      });

      // Mock Item Barcode
      await page.route('**/api/item-barcode*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                barcode_id: 1,
                barcode: '8850000000010',
                uom_id: 1
              }
            ],
            total: 1
          }),
        });
      });

      // Mock การคำนวณราคา (Pricing Engine)
      await page.route('**/api/pricing-engine/calculate*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            itemId: '101',
            qty: 10,
            unitPrice: 150,
            total: 1500,
            source: 2,
            sourceName: 'PRICE_LEVEL',
            priority: 1
          }),
        });
      });

      // Mock การบันทึกใบเสนอราคา (POST)
      await page.route('**/api/sale-quotation*', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, id: 'SQ-2026-0001' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [],
              total: 0
            }),
          });
        }
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

  test('จำลองผู้ใช้กรอกฟอร์มสร้างใบเสนอราคาจริงและกดยืนยันสำเร็จ (Full E2E Journey)', async ({ page }) => {
    // -----------------------------------------------------
    // STEP 1: เริ่มเดินทางเข้าสู่หน้าหลักและกดสร้างใบเสนอราคาใหม่ (เปิด Modal)
    // -----------------------------------------------------
    await page.goto('/sales/quotation');
    await page.click('button:has-text("สร้างใบเสนอราคาใหม่")');

    // -----------------------------------------------------
    // STEP 2: เลือกข้อมูลส่วนหัวเอกสาร (Header Fields)
    // -----------------------------------------------------
    
    // 2.1 เลือกสาขา
    await page.selectOption('select[name="branch_id"]', { label: 'สำนักงานใหญ่' });

    // 2.2 ค้นหาและเลือกลูกค้าผ่าน CustomerSearchModal
    // คลิกปุ่มแว่นขยายค้นหาลูกค้า
    await page.click('div:has(> label:has-text("ลูกค้า")) button'); // ปุ่มแว่นขยายในช่องลูกค้า
    // พิมพ์ค้นหาในช่องค้นหาของ Modal
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'สยามทีทีเค');
    await page.keyboard.press('Enter');
    // ดับเบิ้ลคลิกเลือกหรือคลิกเลือกรายการที่พบในตารางค้นหา
    await page.click('text="บริษัท สยามทีทีเค จำกัด"');

    // 2.3 กรอกเงื่อนไขเครดิตเทอม
    await page.fill('input[name="payment_term_days"]', '30');

    // 2.4 เลือกหน่วยงาน แผนก ประเภทภาษี เขตการขาย พนักงานขาย และโครงการ
    await page.selectOption('select[name="emp_dept_id"]', { label: 'MKT - แผนกการขายและการตลาด' });
    await page.selectOption('select[name="tax_code_id"]', { label: 'VAT 7%' });
    await page.selectOption('select[name="sale_area_id"]', { label: 'BKK - กรุงเทพและปริมณฑล' });
    await page.selectOption('select[name="emp_sale_id"]', { label: 'EMP-001 - สมชาย ขายดี' });
    await page.selectOption('select[name="project_id"]', { label: 'โครงการขยายศูนย์คอมพิวเตอร์' });

    // 2.5 ระบุหมายเหตุของบิลขายนี้
    await page.fill('textarea[name="remarks"]', 'Automated E2E Test - เสนอราคาสายเคเบิล');

    // -----------------------------------------------------
    // STEP 3: กรอกรายละเอียดสินค้าในตาราง (Line Items Table)
    // -----------------------------------------------------
    
    // 3.1 คลิกปุ่มเพิ่มแถวในตารางรายการสินค้า
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#quotation-form table tbody tr', { state: 'visible', timeout: 5000 });

    // 3.2 ค้นหาเลือกสินค้าตัวแรก
    await page.locator('#quotation-form table tbody tr').first().locator('button').first().click(); // ปุ่มค้นหาสินค้าในแถวแรก
    await page.fill('input[placeholder*="ค้นหารหัสสินค้า"]', 'สายเคเบิล');
    await page.keyboard.press('Enter');
    await page.click('text="สายเคเบิลทองแดง TYPE-C"');

    // 3.3 กรอกจำนวนสินค้า
    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(2).fill('10'); // qty (ลำดับ input ที่ 3 ในแถว)

    // 3.4 กรอกราคาสินค้า
    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(3).fill('150.00'); // unit_price

    // -----------------------------------------------------
    // STEP 4: กดยืนยันบันทึกเพื่อตรวจสอบผลลัพธ์การสร้าง
    // -----------------------------------------------------
    
    // 4.1 คลิกปุ่มยืนยันสร้างใบเสนอราคา
    await page.click('button:has-text("บันทึกข้อมูล")');

    // 4.2 กล่อง Confirmation Dialog จะขึ้นมาถามย้ำ -> คลิก "ยืนยันการบันทึก"
    await page.click('button:has-text("ยืนยันการบันทึก")');

    // 4.3 ตรวจสอบผลลัพธ์ว่าหน้าฟอร์มถูกปิดลงสำเร็จ
    await expect(page.locator('form#quotation-form')).toBeHidden();
  });

  test('Negative Test - จำลองการส่งฟอร์มเปล่าเพื่อยืนยันว่าการตรวจสอบข้อมูล (Validation) ทำงานถูกต้อง', async ({ page }) => {
    await page.goto('/sales/quotation');
    await page.click('button:has-text("สร้างใบเสนอราคาใหม่")');

    // ไม่กรอกข้อมูลและกดบันทึกทันที
    await page.click('button:has-text("บันทึกข้อมูล")');

    // ยืนยันว่าหน้าฟอร์มยังคงเปิดอยู่ ไม่มีการนำทางหรือส่งข้อมูลสำเร็จ
    await expect(page.locator('form#quotation-form')).toBeVisible();
    
    // ตรวจสอบว่าไม่มีกล่อง Confirmation Dialog โผล่ขึ้นมาเพราะติด Validation
    await expect(page.locator('button:has-text("ยืนยันการบันทึก")')).toBeHidden();
  });

  test('Network Interruption Test - จำลองสถานการณ์อินเทอร์เน็ตหลุดขณะกดบันทึกข้อมูล', async ({ page, context }) => {
    await page.goto('/sales/quotation');
    await page.click('button:has-text("สร้างใบเสนอราคาใหม่")');

    // กรอกข้อมูลให้ครบเพื่อเตรียมเซฟ (Happy Path)
    await page.selectOption('select[name="branch_id"]', { label: 'สำนักงานใหญ่' });
    await page.click('div:has(> label:has-text("ลูกค้า")) button');
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'สยามทีทีเค');
    await page.keyboard.press('Enter');
    await page.click('text="บริษัท สยามทีทีเค จำกัด"');

    await page.fill('input[name="payment_term_days"]', '30');
    await page.selectOption('select[name="emp_dept_id"]', { label: 'MKT - แผนกการขายและการตลาด' });
    await page.selectOption('select[name="tax_code_id"]', { label: 'VAT 7%' });
    await page.selectOption('select[name="sale_area_id"]', { label: 'BKK - กรุงเทพและปริมณฑล' });
    await page.selectOption('select[name="emp_sale_id"]', { label: 'EMP-001 - สมชาย ขายดี' });
    await page.selectOption('select[name="project_id"]', { label: 'โครงการขยายศูนย์คอมพิวเตอร์' });
    
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#quotation-form table tbody tr', { state: 'visible', timeout: 5000 });

    await page.locator('#quotation-form table tbody tr').first().locator('button').first().click();
    await page.fill('input[placeholder*="ค้นหารหัสสินค้า"]', 'สายเคเบิล');
    await page.keyboard.press('Enter');
    await page.click('text="สายเคเบิลทองแดง TYPE-C"');

    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(2).fill('10');
    await page.locator('#quotation-form table tbody tr').first().locator('input').nth(3).fill('150.00');

    // --- จำลองอินเทอร์เน็ตหลุดกะทันหันก่อนกดยืนยันเซฟ ---
    await context.setOffline(true);

    try {
      await page.click('button:has-text("บันทึกข้อมูล")');
      await page.click('button:has-text("ยืนยันการบันทึก")');
      
      // ตรวจสอบว่าระบบไม่ปล่อยให้ทำรายการเสร็จสิ้นอย่างผิดปกติ
      // (หน้าจอต้องไม่ซ่อนและยังแสดงการแจ้งเตือนเน็ตขัดข้อง/บันทึกล้มเหลว)
      await expect(page.locator('form#quotation-form')).toBeVisible();
    } finally {
      // คืนค่าอินเทอร์เน็ตกลับมาออนไลน์เพื่อให้บราวเซอร์สามารถรันเคสถัดไปได้เป็นปกติ
      await context.setOffline(false);
    }
  });
});
