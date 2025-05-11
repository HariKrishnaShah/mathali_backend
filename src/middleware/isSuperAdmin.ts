import { NextFunction } from "express";
import HttpError from "../util/httpError";
export const isSuperAdmin = async (req: any, res: any, next: NextFunction) => {
  const role = req.user.role;
  try {
    if (role == 555) {
      next();
    } else {
      throw new HttpError(403, "Only Super Admin can access this route");
    }
  } catch (error) {
    next(error);
  }
};
