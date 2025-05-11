import { NextFunction } from "express";
import HttpError from "../util/httpError";
export const isAdmin = async (req: any, res: any, next: NextFunction) => {
  const role = req.user.role;
  try {
    if (role == 444 || role === 555) {
      next();
    } else {
      throw new HttpError(
        403,
        "Only Admin and Super Admin can access this route"
      );
    }
  } catch (error) {
    next(error);
  }
};
