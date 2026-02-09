/**
 * @file index.ts
 * @description Auth Module - Public API exports
 * @module auth
 */

// Pages
export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Services
export { AuthService } from './services/auth.service';
export type { 
    LoginPayload, 
    LoginResponse, 
    RegisterPayload, 
    RegisterResponse, 
    UserProfile 
} from './services/auth.service';
