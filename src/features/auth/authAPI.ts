import axios from 'axios';
import type { LoginData, LoginResponse, RegisterData, RegisterResponse } from '@/types/types'; 




// Function to send login request
export const loginUser = async (loginData: LoginData): Promise<LoginResponse> => {
  const response = await axios.post(
    `http://localhost:8080/api/candidates/login`,
    loginData,
    {
      withCredentials: true, // Include cookies (for JWT tokens etc.)
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'web', // Custom header to identify client
      },
    }
  );
  return response.data;
};

// Function to send registration request
export const registerUser = async (registerData: RegisterData): Promise<RegisterResponse> => {
  const response = await axios.post(
    `http://localhost:8080/api/candidates/register`,
    registerData,
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'web',
      },
    }
  );
  return response.data;
};
