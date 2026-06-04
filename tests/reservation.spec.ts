import { test, expect } from '@playwright/test';

test.describe('ระบบใบสั่งจองสินค้า (Sales Reservation E2E Automation Journey)', () => {
  
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

      // Mock item-lot
      await page.route('**/api/item-lot*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { lot_id: 10, lot_no: 'LOT-2026-0001', supplier_name: 'Vendor A', status: 'ACTIVE', qty_stock: 500 }
          ]),
        });
      });
    }

    // Mock item-lot-balance (getAvailableLots) - Unconditional to support both real & mock runs
    await page.route('**/api/item-lot-balance*', async (route) => {
      const url = new URL(route.request().url());
      const itemId = url.searchParams.get('item_id') || '101';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              lot_balance_id: 1,
              lot_id: 10,
              item_id: Number(itemId),
              warehouse_id: 1,
              location_id: 1,
              qty_on_hand: 100,
              qty_reserved: 0,
              qty_available: 100,
              code: 'LOT-2026-0001',
              name_th: 'Vendor A',
              warehouse_name: 'คลังสินค้าหลัก',
              location_name: 'ชั้นวาง A1'
            }
          ],
          total: 1
        }),
      });
    });

    // Mock option validation for stock checks - Unconditional
    await page.route('**/api/option/validate*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          is_valid: true,
          errors: [],
          warnings: []
        }),
      });
    });

    // Mock สต็อกคลังสินค้าแยกตามไอเทม (ReservationInventoryService) - Unconditional
    await page.route('**/api/sale-reservation/warehouse-stock/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, warehouse_id: 1, warehouse_code: 'WH-01', warehouse_name: 'คลังสินค้าหลัก', qty_on_hand: 100, qty_reserved: 0, qty_available: 100 }
        ]),
      });
    });

    // Mock สต็อกที่เก็บแยกตามคลังและไอเทม (ReservationInventoryService) - Unconditional
    await page.route('**/api/sale-reservation/location-in-warehouse-stock/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, location_id: 1, location_code: 'LOC-01', name_th: 'ชั้นวาง A1', qty_on_hand: 100, qty_reserved: 0, qty_available: 100 }
        ]),
      });
    });

    // Mock การบันทึกใบสั่งจองสินค้า (POST / GET) - Unconditional
    await page.route('**/api/sale-reservation*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 'RS-2026-0001' }),
        });
      } else {
        if (useRealBackend) {
          await route.continue();
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        }
      }
    });

    // เปิดหน้าแรกของแอปและทำ Login เข้าสู่ระบบ
    await page.goto('/auth/login');
    
    // กรอกข้อมูลล็อกอินและทำ Login เข้าสู่ระบบ
    await page.fill('input[placeholder="กรอกชื่อผู้ใช้งานของคุณ"]', 'admin');
    await page.fill('input[placeholder="กรอกรหัสผ่านของคุณ"]', '123456');
    await page.click('button:has-text("เข้าสู่ระบบ")');
    
    // รอให้หน้าจอเปลี่ยนไปที่ Dashboard
    await page.waitForTimeout(2000);
  });

  test('จำลองผู้ใช้กรอกฟอร์มสร้างใบสั่งจองจริงและกดยืนยันสำเร็จ (Full E2E Journey)', async ({ page }) => {
    // -----------------------------------------------------
    // STEP 1: เริ่มเดินทางเข้าสู่หน้าหลักและกดสร้างใบสั่งจองใหม่ (เปิด Modal)
    // -----------------------------------------------------
    await page.goto('/sales/reservation');
    await page.click('button:has-text("สร้างใบสั่งจองใหม่")');

    // -----------------------------------------------------
    // STEP 2: เลือกข้อมูลส่วนหัวเอกสาร (Header Fields)
    // -----------------------------------------------------
    // 2.1 เลือกสาขา (ใช้ index 1 แทนเพื่อความยืดหยุ่น)
    await page.selectOption('select[name="branch_id"]', { index: 1 });

    // 2.2 ค้นหาและเลือกลูกค้าผ่าน CustomerSearchModal
    await page.click('div:has(> label:has-text("ลูกค้า")) button'); // ปุ่มแว่นขยายในช่องลูกค้า
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'ทดสอบ');
    await page.keyboard.press('Enter');
    await page.locator('div[role="dialog"] tr:has-text("บริษัท ทดสอบ จำกัด")').locator('button:has-text("เลือก")').click();

    // 2.3 กรอกเงื่อนไขเครดิตเทอมและวันที่ส่งสินค้า
    await page.fill('input[name="payment_term_days"]', '30');
    await page.fill('input[name="ship_days"]', '7');

    // 2.4 เลือกหน่วยงานฝ่ายขายและประเภทภาษี
    await page.selectOption('select[name="emp_dept_id"]', { index: 1 });
    await page.selectOption('select[name="tax_code_id"]', { index: 1 });

    // 2.5 ระบุหมายเหตุของบิลขายนี้
    await page.fill('textarea[name="remarks"]', 'Automated E2E Test - สั่งจองสินค้าสายเคเบิล');

    // -----------------------------------------------------
    // STEP 3: กรอกรายละเอียดสินค้าในตาราง (Line Items Table)
    // -----------------------------------------------------
    
    // 3.1 คลิกปุ่มเพิ่มแถวในตารางรายการสินค้า
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#reservation-form tbody tr', { state: 'visible', timeout: 5000 });

    // 3.2 ค้นหาเลือกสินค้าตัวแรก
    await page.locator('#reservation-form tbody tr').first().locator('button').first().click(); // ปุ่มค้นหาสินค้าในแถวแรก
    await page.locator('div[role="dialog"] input[placeholder*="ค้นหารหัสสินค้า"]').press('Enter');
    await page.waitForTimeout(800); // รอให้ตารางโหลดรายการเล็กน้อย
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    // 3.3 เลือกคลังสินค้าและที่เก็บ (ฟิลด์บังคับใน Schema)
    await page.locator('#reservation-form tbody tr').first().locator('input').nth(2).click(); // คลิกช่องคลัง
    await page.locator('div[role="dialog"] input[placeholder*="ระบุชื่อ หรือรหัสคลัง"]').press('Enter');
    await page.waitForTimeout(800); // รอโหลดข้อมูลคลังสินค้า
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#reservation-form tbody tr').first().locator('input').nth(3).click(); // คลิกช่องที่เก็บ
    await page.locator('div[role="dialog"] input[placeholder*="ระบุชื่อ หรือรหัสที่เก็บ"]').press('Enter');
    await page.waitForTimeout(800); // รอโหลดข้อมูลที่เก็บสินค้า
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    // 3.4 กรอกจำนวนชิ้นสินค้า
    await page.locator('#reservation-form tbody tr').first().locator('input').nth(4).fill('10');

    // 3.5 เลือกล็อตสินค้า
    await page.locator('#reservation-form tbody tr').first().locator('input').nth(5).click(); // คลิกช่องล็อต
    await page.waitForTimeout(1000); // รอโหลดข้อมูลล็อตสินค้า
    const showAllBtn1 = page.locator('div[role="dialog"] button:has-text("แสดงสต็อกทั้งหมด")');
    if (await showAllBtn1.isVisible()) {
      await showAllBtn1.click();
      await page.waitForTimeout(500);
    }
    await page.locator('div[role="dialog"] button:has-text("เลือก")').first().click({ force: true });

    // 3.6 ใส่ส่วนลดประจำแถว
    await page.locator('#reservation-form tbody tr').first().locator('input').nth(7).fill('5%');

    // -----------------------------------------------------
    // STEP 4: กดยืนยันบันทึกเพื่อตรวจสอบผลลัพธ์การสร้าง
    // -----------------------------------------------------
    
    // 4.1 คลิกปุ่มยืนยันสร้างใบจองสินค้าสีม่วงที่ปุ่ม Footer
    await page.click('button:has-text("ยืนยันสร้างใบจอง")');

    // 4.2 กล่อง Confirmation Dialog จะขึ้นมาถามย้ำ -> คลิก "ยืนยันการบันทึก"
    await page.click('button:has-text("ยืนยันการบันทึก")');

    // 4.3 ตรวจสอบผลลัพธ์ว่า หน้าฟอร์มถูกปิดลง หรือมีกล่องแจ้งเตือนความสำเร็จ (Toast) แสดงขึ้นมา
    await expect(page.locator('#reservation-form')).toBeHidden();
  });

  test('Negative Test - จำลองการส่งฟอร์มเปล่าเพื่อยืนยันว่าการตรวจสอบข้อมูล (Validation) ทำงานถูกต้อง', async ({ page }) => {
    await page.goto('/sales/reservation');
    await page.click('button:has-text("สร้างใบสั่งจองใหม่")');

    // ไม่กรอกข้อมูลและกดบันทึกทันที
    await page.click('button:has-text("ยืนยันสร้างใบจอง")');

    // ยืนยันว่าหน้าฟอร์มยังคงเปิดอยู่ ไม่มีการนำทางหรือส่งข้อมูลสำเร็จ
    await expect(page.locator('form#reservation-form')).toBeVisible();
    
    // ตรวจสอบว่าไม่มีกล่อง Confirmation Dialog โผล่ขึ้นมาเพราะติด Validation
    await expect(page.locator('button:has-text("ยืนยันการบันทึก")')).toBeHidden();
  });

  test('Network Interruption Test - จำลองสถานการณ์อินเทอร์เน็ตหลุดขณะกดบันทึกข้อมูล', async ({ page, context }) => {
    await page.goto('/sales/reservation');
    await page.click('button:has-text("สร้างใบสั่งจองใหม่")');

    // กรอกข้อมูลให้ครบเพื่อเตรียมเซฟ (Happy Path)
    await page.selectOption('select[name="branch_id"]', { index: 1 });
    await page.click('div:has(> label:has-text("ลูกค้า")) button');
    await page.fill('input[placeholder*="ค้นหารหัสลูกค้า"]', 'ทดสอบ');
    await page.keyboard.press('Enter');
    await page.locator('div[role="dialog"] tr:has-text("บริษัท ทดสอบ จำกัด")').locator('button:has-text("เลือก")').click();

    await page.fill('input[name="payment_term_days"]', '30');
    await page.fill('input[name="ship_days"]', '7');
    await page.selectOption('select[name="emp_dept_id"]', { index: 1 });
    await page.selectOption('select[name="tax_code_id"]', { index: 1 });
    
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.waitForSelector('#reservation-form tbody tr', { state: 'visible', timeout: 5000 });

    await page.locator('#reservation-form tbody tr').first().locator('button').first().click();
    await page.locator('div[role="dialog"] input[placeholder*="ค้นหารหัสสินค้า"]').press('Enter');
    await page.waitForTimeout(800);
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#reservation-form tbody tr').first().locator('input').nth(2).click();
    await page.locator('div[role="dialog"] input[placeholder*="ระบุชื่อ หรือรหัสคลัง"]').press('Enter');
    await page.waitForTimeout(800);
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#reservation-form tbody tr').first().locator('input').nth(3).click();
    await page.locator('div[role="dialog"] input[placeholder*="ระบุชื่อ หรือรหัสที่เก็บ"]').press('Enter');
    await page.waitForTimeout(800);
    await page.locator('div[role="dialog"] table tbody tr').first().click({ force: true });

    await page.locator('#reservation-form tbody tr').first().locator('input').nth(4).fill('10');

    await page.locator('#reservation-form tbody tr').first().locator('input').nth(5).click(); // คลิกล็อต
    await page.waitForTimeout(1000);
    const showAllBtn2 = page.locator('div[role="dialog"] button:has-text("แสดงสต็อกทั้งหมด")');
    if (await showAllBtn2.isVisible()) {
      await showAllBtn2.click();
      await page.waitForTimeout(500);
    }
    await page.locator('div[role="dialog"] button:has-text("เลือก")').first().click({ force: true });

    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    try {
      await page.click('button:has-text("ยืนยันสร้างใบจอง")');
      await page.click('button:has-text("ยืนยันการบันทึก")');
      
      await expect(page.locator('form#reservation-form')).toBeVisible();
    } finally {
      try {
        await context.setOffline(false);
      } catch {
        // ignore
      }
    }
  });
});
