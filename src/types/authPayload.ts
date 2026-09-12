import { JWTPayload, jwtVerify, SignJWT } from 'jose';

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
  deviceId?: string;
  fcmToken?: string;
  role: string;
}
