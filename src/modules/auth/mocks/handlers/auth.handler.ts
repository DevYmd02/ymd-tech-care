import type MockAdapter from 'axios-mock-adapter';

export const setupAuthHandlers = (mock: MockAdapter) => {
  mock.onPost('/auth/login').reply((config) => {
    const { username, password } = JSON.parse(config.data);

    if (username === 'admin' && password === '123456') {
      return [200, {
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
      }];
    }

    return [401, { message: "ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" }];
  });

  mock.onGet('/auth/me').reply((config) => {
    const authHeader = config.headers?.Authorization;
    if (authHeader === 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_signature_for_dev') {
      return [200, {
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
      }];
    }
    return [401, { message: "Invalid session" }];
  });
};
