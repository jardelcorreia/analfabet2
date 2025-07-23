import bcrypt from 'bcryptjs';
import { dbHelpers } from './database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Function to decode JWT tokens
export const decodeToken = (token: string): AuthUser | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const decoded = JSON.parse(atob(payload));
    return decoded as AuthUser;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signIn = async (email: string, password: string): Promise<AuthUser | null> => {
  const user = await dbHelpers.getUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const isValid = await comparePassword(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
};