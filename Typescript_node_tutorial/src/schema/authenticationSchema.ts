import mongoose from "mongoose";
import { Authentication } from "../interfaces/authenticationInterface";

export const AuthenticationSchema = new mongoose.Schema<Authentication>({
    password: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    sessionToken: { type: String, select: false },
  });
  