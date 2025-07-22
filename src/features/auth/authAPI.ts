import axios from 'axios';

// Payload structure for login
interface LoginData {
  email: string;
  password: string;
}

// Payload structure for registration
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

// Function to send login request
export const loginUser = async (loginData: LoginData): Promise<any> => {
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
export const registerUser = async (registerData: RegisterData): Promise<any> => {
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
