import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend the Request interface to include userId
declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeaders = req.headers["authorization"] || "";
    if (!authHeaders) {
      return res.status(403).json({
        message: "Cannot Sign In"
      });
    } else {
      const decoded = jwt.verify(authHeaders, process.env.JWT_SECRET!!) as JwtPayload;
      const userId = decoded.userId;
      req.userId = userId;
      next();
    }
  } catch (error: any) {
    res.status(404).json({
      error: error.message
    });
  }
};
