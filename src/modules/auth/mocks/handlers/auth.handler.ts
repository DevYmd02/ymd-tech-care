import type MockAdapter from 'axios-mock-adapter';

export const setupAuthHandlers = (mock: MockAdapter) => {
  mock.onPost('/auth/login').reply(200, {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJqb2huLmRvZTEiLCJpYXQiOjE3MzgzMjAwMDAsImV4cCI6MTczODQwNjQwMH0.mock_signature_for_dev",
    user: {
      id: '2', // Sanitized to string
      username: "john.doe1",
      employee_id: '2', // Sanitized to string
      employee: {
        employee_id: '2', // Sanitized to string
        branch_id: '1',  // Sanitized to string
        employee_code: "EMP0003",
        employee_fullname: "นาย สมชาย ใจดี",
        position_id: '1', // Sanitized to string
        department_id: '1' // Sanitized to string
      }
    }
  });
};
