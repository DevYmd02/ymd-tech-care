// src/modules/procurement/mocks/data/warehouseData.ts

export const MOCK_WAREHOUSES = [
  { warehouse_id: 1, warehouse_name: 'คลังสำนักงานใหญ่' },
  { warehouse_id: 2, warehouse_name: 'คลังกรุงเทพ 1' },
  { warehouse_id: 3, warehouse_name: 'คลังเชียงใหม่' },
  { warehouse_id: 4, warehouse_name: 'คลังวัตถุดิบหลัก' },
];

export const MOCK_LOCATIONS = [
  { warehouse_id: 1, location_id: 1, location_name: 'โซน A (ปกติ)' },
  { warehouse_id: 1, location_id: 2, location_name: 'โซน B (สำรอง)' },
  { warehouse_id: 2, location_id: 3, location_name: 'ชั้น 1 กรุงเทพ' },
  { warehouse_id: 3, location_id: 4, location_name: 'Main Storage เชียงใหม่' },
  { warehouse_id: 4, location_id: 5, location_name: 'ห้องวัตถุดิบ 1' },
];
