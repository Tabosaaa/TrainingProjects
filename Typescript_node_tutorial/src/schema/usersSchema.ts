import mongoose from "mongoose";
import { User } from "../interfaces/userInterface";
import { AuthenticationSchema } from './authenticationSchema';


export const UserSchema = new mongoose.Schema<User>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  authentication: { type: AuthenticationSchema, required: true },
});
