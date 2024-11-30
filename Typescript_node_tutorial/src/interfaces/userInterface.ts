import { Document } from 'mongoose';
import { Authentication } from './authenticationInterface';

export interface User {
  username: string;
  email: string;
  authentication: Authentication;
}

export interface UserDocument extends User, Document {}