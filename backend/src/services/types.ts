import { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}