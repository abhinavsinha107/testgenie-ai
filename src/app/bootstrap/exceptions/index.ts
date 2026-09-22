import type { Request, Response, NextFunction } from "express";

export const handleError = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        error: {
            message: err.message,
            status: statusCode
        }
    })
}