import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../util/httpError";
import dotenv from "dotenv";
import { hashWithoutSalt } from "../util/functions/hash";
import { AppDataSource } from "../config/database";
import { LoginLog } from "../entities/user/LoginLog";
import { Role } from "../types/common";
dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret";
const ACCESS_TOKEN_EXPIRES_IN = "1h"; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = "1d"; // 1 day

interface JwtPayload {
  id: number;
  role: string;
  firstName: string;
}

const loginLogRepo = AppDataSource.getRepository(LoginLog);
const isLoggedIn = async (req: any, res: any, next: NextFunction) => {
  // Helper function to verify tokens
  const verifyToken = (token: string, secret: string) => {
    return new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as JwtPayload);
      });
    });
  };

  // Function to generate new access token
  const generateNewAccessToken = (user: JwtPayload) => {
    return jwt.sign(
      { id: user.id, role: user.role, firstName: user.firstName },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
  };
  try {
    // Extract tokens from cookies
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new HttpError(
        401,
        "The login tokens are missing. Please login again."
      );
    }
    const hashedRefreshToken = hashWithoutSalt(refreshToken);
    const log = await loginLogRepo.findOne({
      where: { refreshToken: hashedRefreshToken },
    });

    if (log) {
      if (log.revoked == true) {
        // Clear the cookies by setting them with expired dates

        throw new HttpError(
          401,
          "The login tokens are revoked. Please login again."
        );
      }
      if (new Date() > log.refreshTokenExpiresAt) {
        // Clear the cookies by setting them with expired dates

        // If current time is greater than the expiration time
        throw new HttpError(
          401,
          "The session has expired. Please login again."
        );
      }
    } else {
      throw new HttpError(
        401,
        "The login tokens are missing. Please login again."
      );
    }

    // Check if access token is present and valid
    if (accessToken) {
      try {
        const user = await verifyToken(accessToken, ACCESS_TOKEN_SECRET);
        if (new Date() > log.accessTokenExpiresAt) {
          throw new Error("The access token has expired. Please login again.");
        }
        if (Number(user.role) == Role.SURVEYOR) {
          return res.status(401).json({
            success: false,
            message: "Surveyors are not allowed to login to the web app.",
            data: null,
          });
        }
        req.user = user;
        return next(); // Access token is valid, continue
      } catch (error) {
        console.log(error);
      }
    }

    // If access token is missing or invalid, check refresh token
    if (refreshToken) {
      try {
        const user = await verifyToken(refreshToken, REFRESH_TOKEN_SECRET);
        // Generate a new access token
        const newAccessToken = generateNewAccessToken(user);
        const hashedAccessToken = hashWithoutSalt(newAccessToken);
        log.accessToken = hashedAccessToken;
        const decodedAccessToken: any = jwt.decode(newAccessToken);
        log.accessTokenExpiresAt = new Date(decodedAccessToken.exp * 1000); // Convert to ms
        await log.save();
        // Set the new access token in the cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          maxAge: 3600000, // 1 hour
        });

        // Attach user info to request object
        req.user = user;
        return next();
      } catch (error) {
        throw new HttpError(401, "Login required. Invalid refresh token.");
      }
    } else {
      // Refresh token is missing
      throw new HttpError(401, "Login required. Missing tokens.");
    }
  } catch (error) {
    // Clear the cookies by setting them with expired dates
    res.cookie("accessToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    console.log(error);
    return next(new HttpError(401, "Tokens expired or invalid."));
  }
};

export default isLoggedIn;
