import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from './authAPI.js';

// Type for login payload
interface LoginData {
  email: string;
  password: string;
}

// Type for registration payload
interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  profile_photo_url: string; // Cloudinary URL
  resume_url: string;        // Cloudinary URL
  password: string;
}

// Thunk for handling user login
export const loginThunk = createAsyncThunk(
  'auth/login', // action type
  async (loginData: LoginData, { rejectWithValue }) => {
    try {
      const data = await loginUser(loginData); // Call API function
      return data; // Fulfill with response data
    } catch (error: any) {
      // Reject with custom error message (e.g., invalid credentials)
      return rejectWithValue(error.response?.data?.message || 'Login failed');
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
    } catch (error: any) {
      // Reject with validation errors or generic message
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message ||'Registration failed');
    }
  }
);


