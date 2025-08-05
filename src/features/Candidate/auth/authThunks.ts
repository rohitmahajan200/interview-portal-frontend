import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from './authAPI.js';
import type { AxiosError } from 'axios';
import type { LoginData, RegisterData} from '@/types/types'; 

// Thunk for handling user login
export const loginThunk = createAsyncThunk(
  'auth/login', // action type
  async (loginData: LoginData, { rejectWithValue }) => {
    try {
      const data = await loginUser(loginData); // Call API function
      return data; // Fulfill with response data
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string; errors?: unknown }>;
      return rejectWithValue(err?.response?.data?.message || 'Login failed');
    }
  }
);

// Thunk for handling user registration
export const registerThunk = createAsyncThunk(
  'auth/register', // action type
  async (registerData: RegisterData, { rejectWithValue }) => {
    try {
      const data = await registerUser(registerData); // Call API function
      return data; // Fulfill with response data
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string; errors?: unknown }>;
      return rejectWithValue(
        err.response?.data?.errors ||
        err.response?.data?.message ||
        'Registration failed'
      );
    }
  }
);


