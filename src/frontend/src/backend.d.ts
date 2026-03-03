import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Account {
    id: string;
    serviceName: string;
    username: string;
    password: string;
    notes: string;
}
export type Time = bigint;
export interface Document {
    id: string;
    createdAt: Time;
    description: string;
    fileSize: bigint;
    fileType: string;
    blobId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAccount(serviceName: string, username: string, password: string, notes: string): Promise<string>;
    createDocument(description: string, blobId: string, fileType: string, fileSize: bigint): Promise<string>;
    deleteAccount(id: string): Promise<void>;
    deleteDocument(id: string): Promise<void>;
    getAccount(id: string): Promise<Account>;
    getAllAccounts(): Promise<Array<Account>>;
    getAllDocuments(): Promise<Array<Document>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDocument(id: string): Promise<Document>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAccount(id: string, serviceName: string, username: string, password: string, notes: string): Promise<Account>;
}
