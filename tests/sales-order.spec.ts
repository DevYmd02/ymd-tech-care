import { test, expect } from '@playwright/test';

test.describe('ระบบใบสั่งขาย (Sales Order E2E Automation Journey)', () => {
  
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
            { branch_id: 1, branch_name: 'ทดสอบBranch1' }
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
            { emp_dept_id: 5, emp_dept_name: 'แผนกการขายและการตลาด' }
          ]),
        });
      });

      await page.route('**/api/tax-code*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { tax_code_id: 1, tax_code: 'VAT 7%' }
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
              { id: 1, uom_id: 1, uom_code: 'PCS', uom_name: 'ชิ้น', is_active: true, created_at: '' }
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

      // Mock คลังสินค้า
      await page.route('**/api/warehouse*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 1, warehouse_id: 1, warehouse_code: 'WH-01', warehouse_name: 'คลังสินค้าหลัก' }
            ],
            total: 1
          }),
        });
      });

      // Mock ที่เก็บสินค้า
      await page.route('**/api/location*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 1, location_id: 1, location_code: 'LOC-01', name_th: 'ชั้นวาง A1' }
            ],
            total: 1
          }),
        });
      });

      // Mock สต็อกคลังสินค้าแยกตามไอเทม (ReservationInventoryService)
      await page.route('**/api/sale-reservation/warehouse-stock/*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, warehouse_id: 1, warehouse_code: 'WH-01', warehouse_name: 'คลังสินค้าหลัก', qty_on_hand: 100, qty_reserved: 0, qty_available: 100 }
          ]),
        });
      });

      // Mock สต็อกที่เก็บแยกตามคลังและไอเทม (ReservationInventoryService)
      await page.route('**/api/sale-reservation/location-in-warehouse-stock/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, location_id: 1, location_code: 'LOC-01', name_th: 'ชั้นวาง A1', qty_on_hand: 100, qty_reserved: 0, qty_available: 100 }
          ]),
        });
      });

      // Mock การบันทึกใบสั่งขาย (POST)
      await page.route('**/api/sale-order*', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, id: 'SO-2026-0001' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
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

  test('จำลองผู้ใช้กรอกฟอร์มสร้างใบสั่งขายจริงและกดยืนยันสำเร็จ (Full E2E Journey)', async ({ page }) => {
    // -----------------------------------------------------
    // STEP 1: เริ่มเดินทางเข้าสู่หน้าหลักและกดสร้างใบสั่งขายใหม่ (เปิด Modal)
    // -----------------------------------------------------
    await page.goto('/sales/order');
    await page.click('button:has-text("สร้างใบสั่งขายใหม่")');

    // -----------------------------------------------------
    // STEP 2: เลือกข้อมูลส่วนหัวเอกสาร (Header Fields)
    // -----------------------------------------------------
    
    // 2.1 เลือกสาขา
    await page.selectOption('select[name="branch_id"]', { label: 'ทดสอบBranch1' });

    // 2.2 ค้นหาและเลือกลูกค้าผ่าน CustomerSearchModal
    // คลิกปุ่มแว่นขยายค้นหาลูกค้า
    await page.click('div:has(> label:has-text("ลูกค้า")) button'); // ปุ่มแว่นขยายในช่องลูกค้า
    // พิมพ์ค้นหาในช่องค้นหาของ Modal
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'สยามทีทีเค');
    await page.keyboard.press('Enter');
    // ดับเบิ้ลคลิกเลือกหรือคลิกเลือกรายการที่พบในตารางค้นหา
    await page.click('text="บริษัท สยามทีทีเค จำกัด"');

    // 2.3 กรอกเงื่อนไขเครดิตเทอมและวันที่ส่งสินค้า
    await page.fill('input[name="payment_term_days"]', '30');
    await page.fill('input[name="ship_days"]', '7');

    // 2.4 เลือกหน่วยงานฝ่ายขายและประเภทภาษี
    await page.selectOption('select[name="emp_dept_id"]', { label: 'แผนกการขายและการตลาด' });
    await page.selectOption('select[name="tax_code_id"]', { label: 'VAT 7%' });

    // 2.5 ระบุหมายเหตุของบิลขายนี้
    await page.fill('textarea[name="remarks"]', 'Automated E2E Test - สั่งซื้อสายไฟด่วน');

    // -----------------------------------------------------
    // STEP 3: กรอกรายละเอียดสินค้าในตาราง (Line Items Table)
    // -----------------------------------------------------
    
    // 3.1 คลิกปุ่มเพิ่มแถวในตารางรายการสินค้า
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#so-form tbody tr', { state: 'visible', timeout: 5000 });

    // 3.2 ค้นหาเลือกสินค้าตัวแรก
    await page.locator('#so-form tbody tr').first().locator('button').first().click(); // ปุ่มค้นหาสินค้าในแถวแรก
    await page.fill('input[placeholder*="ค้นหารหัสสินค้า"]', 'สายเคเบิล');
    await page.keyboard.press('Enter');
    await page.click('text="สายเคเบิลทองแดง TYPE-C"');

    // 3.3 เลือกคลังสินค้าและที่เก็บ (ฟิลด์บังคับใน Schema)
    await page.locator('#so-form tbody tr').first().locator('input').nth(2).click(); // คลิกช่องคลัง
    await page.fill('input[placeholder*="ระบุชื่อ หรือรหัสคลัง"]', 'คลังสินค้าหลัก');
    await page.keyboard.press('Enter');
    await page.locator('button:has-text("เลือก")').first().click();

    await page.locator('#so-form tbody tr').first().locator('input').nth(3).click(); // คลิกช่องที่เก็บ
    await page.fill('input[placeholder*="ระบุชื่อ หรือรหัสที่เก็บ"]', 'ชั้นวาง A1');
    await page.keyboard.press('Enter');
    await page.locator('button:has-text("เลือก")').first().click();

    // 3.4 กรอกจำนวนชิ้นสินค้า
    await page.locator('#so-form tbody tr').first().locator('input').nth(4).fill('10');

    // 3.5 ใส่ส่วนลดประจำแถว
    await page.locator('#so-form tbody tr').first().locator('input').nth(7).fill('5%');

    // -----------------------------------------------------
    // STEP 4: กดยืนยันบันทึกเพื่อตรวจสอบผลลัพธ์การสร้าง
    // -----------------------------------------------------
    
    // 4.1 คลิกปุ่มยืนยันสร้างใบสั่งขายสีเขียวที่ปุ่ม Footer
    await page.click('button:has-text("ยืนยันสร้างใบสั่งขาย")');

    // 4.2 กล่อง Confirmation Dialog จะขึ้นมาถามย้ำ -> คลิก "ตกลง"
    await page.click('button:has-text("ตกลง")');

    // 4.3 ตรวจสอบผลลัพธ์ว่า หน้าฟอร์มถูกปิดลง หรือมีกล่องแจ้งเตือนความสำเร็จ (Toast) แสดงขึ้นมา
    // เช่น เช็คว่าฟอร์มซ่อนตัวไปหลังจากบันทึกเสร็จ
    await expect(page.locator('#so-form')).toBeHidden();
  });
});
