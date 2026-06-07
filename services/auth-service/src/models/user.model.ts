export type RegisterInput = {
    email: string;
    password: string;
};

export type SafeUser = {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
};