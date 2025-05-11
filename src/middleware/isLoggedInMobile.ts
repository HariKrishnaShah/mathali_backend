import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../util/httpError";
import dotenv from "dotenv";
import { hashWithoutSalt } from "../util/functions/hash";
import { AppDataSource } from "../config/database";
import { LoginLog } from "../entities/user/LoginLog";
dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";

interface JwtPayload {
  id: number;
  role: string;
  firstName: string;
}

//Login Repo where tokens are stored
const loginLogRepo = AppDataSource.getRepository(LoginLog);

const isLoggedInMobile = async (req: any, res: any, next: NextFunction) => {
  // Helper function to verify tokens
  const verifyToken = (token: string, secret: string) => {
    return new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as JwtPayload);
      });
    });
  };

  try {
    // Extract tokens from cookies
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return next(
        new HttpError(403, "The login tokens are missing. Please login again.")
      );
    }
    //Hashing the received access token because the access token in database is stored in hashed form, so comparison can be made
    const hashedAccessToken = hashWithoutSalt(accessToken);
    const log = await loginLogRepo.findOne({
      where: { accessToken: hashedAccessToken },
    });

    if (log) {
      if (log.revoked == true) {
        throw next(
          new HttpError(
            403,
            "The login tokens are revoked. Please login again."
          )
        );
      }
    } else {
      throw next(
        new HttpError(403, "The login tokens are missing. Please login again.")
      );
    }

    // Check if access token is valid
    try {
      const user = await verifyToken(accessToken, ACCESS_TOKEN_SECRET);
      if (new Date() > log.accessTokenExpiresAt) {
        throw new Error("The access token has expired. Please login again.");
      }
      req.user = user;
      return next(); // Access token is valid, continue
    } catch (error) {
      return next(new HttpError(403, "Access token expired."));
    }
  } catch (error) {
    console.log(error);
    return next(new HttpError(403, "Access token expired or invalid."));
  }
};

export default isLoggedInMobile;
