import {z} from 'zod';

export const userNameValidation = z
    .string()
    .min(2, "Username must be atleast 2 characters long")
    .max(30, "Username must be atmost 30 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain special characters")

export const signUpSchema = z.object({
    username: userNameValidation,
    email: z.string().email({message: "Invalid email address"}),
    password: z
        .string()
        .min(8, {message: "Password must be at least 8 characters long"}),
})