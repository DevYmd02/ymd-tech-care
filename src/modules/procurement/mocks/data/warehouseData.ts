// src/modules/procurement/mocks/data/warehouseData.ts

export const MOCK_WAREHOUSES = [
  { warehouse_id: 'WH001', warehouse_name: 'คลังสำนักงานใหญ่' },
  { warehouse_id: 'WH002', warehouse_name: 'คลังกรุงเทพ 1' },
  { warehouse_id: 'WH003', warehouse_name: 'คลังเชียงใหม่' },
  { warehouse_id: 'WH004', warehouse_name: 'คลังวัตถุดิบหลัก' },
];

export const MOCK_LOCATIONS = [
  { warehouse_id: 'WH001', location_id: 'LOC-A', location_name: 'โซน A (ปกติ)' },
  { warehouse_id: 'WH001', location_id: 'LOC-B', location_name: 'โซน B (สำรอง)' },
  { warehouse_id: 'WH002', location_id: 'BKK-01', location_name: 'ชั้น 1 กรุงเทพ' },
  { warehouse_id: 'WH003', location_id: 'CNX-M', location_name: 'Main Storage เชียงใหม่' },
  { warehouse_id: 'WH004', location_id: 'RM-01', location_name: 'ห้องวัตถุดิบ 1' },
];
