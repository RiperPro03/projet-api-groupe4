import type { Request, Response } from "express";
import { registerUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
    try {
        const user = await registerUser({
            email: req.body.email,
            password: req.body.password,
        });

        return res.status(201).json({
            status: "success",
            message: "User registered",
            data: {
                user,
            },
        });
    } catch (error) {

        console.log(error);

        if (error instanceof Error && error.message === "EMAIL_ALREADY_USED") {
            return res.status(409).json({
                status: "error",
                message: "This email is already used",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}