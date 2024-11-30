import mongoose, { Model,Query } from "mongoose";
import { UserDocument } from "../interfaces/userInterface";
import { UserSchema } from "../schema/usersSchema";

export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);

// Define funções utilitárias com tipos específicos
export const getUsers = (): Query<UserDocument[] | null, UserDocument> => UserModel.find();

export const getUserByEmail = (email: string): Query<UserDocument | null, UserDocument> => UserModel.findOne({ email });

export const getUserBySessionToken = (sessionToken: string): Promise<UserDocument | null> => UserModel.findOne({ "authentication.sessionToken": sessionToken }).exec();

export const getUserById = (id: string): Promise<UserDocument | null> => UserModel.findById(id).exec();

export const createUser = (user: Partial<UserDocument>): Promise<UserDocument> => UserModel.create(user);

export const deleteUserById = (id: string): Promise<UserDocument | null> => UserModel.findByIdAndDelete(id).exec();

export const updateUserById = (id: string, update: Partial<UserDocument>): Promise<UserDocument | null> => UserModel.findByIdAndUpdate(id, update, { new: true }).exec();