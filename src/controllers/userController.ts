import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/database";
import HttpError from "../util/httpError";
import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { plainToInstance } from "class-transformer";
import { throwValidationErrors } from "../util/validationError";
import "reflect-metadata";
import { UserDTO } from "../classValidators/userValidator";
import { Like, Raw } from "typeorm";
import { stringify } from "querystring";
import { Role } from "../types/common";
import { User } from "../entities/user/User";
import { LoginLog } from "../entities/user/LoginLog";
import { hashWithoutSalt } from "../util/functions/hash";
import { Or } from "typeorm";
import { access } from "fs";
dotenv.config();

// Ensure to use secret keys for signing JWT tokens
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret";
const ACCESS_TOKEN_EXPIRES_IN = "8h"; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = "1d"; // 1 day

interface JwtPayload {
  id: number;
  role: string;
  firstName: string;
}
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

class UserController {
  constructor(
    private userRepo = AppDataSource.getRepository(User),
    private loginLogRepo = AppDataSource.getRepository(LoginLog)
  ) {}

  async createUser(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const { email, password, firstName, lastName, phone, address, position } =
        req.body;

      const existingUser = await this.userRepo.findOneBy({
        email: email.toLowerCase(),
      });
      if (existingUser) {
        throw new HttpError(400, "A user with the same email already exists");
      }

      const user = new User();
      user.email = email.toLowerCase();
      user.password = String(password);
      user.role = Role.STAFF;
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = String(phone);
      user.address = address;
      user.position = position;
      user.modifiedBy = req?.user?.id ?? 0; // Set modifiedBy to the ID of the user creating the new user
      const userDto = Object.assign(new UserDTO(), user);
      const errors = await validate(userDto);
      if (errors.length > 0) {
        throwValidationErrors(errors);
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;

      const savedUser = await this.userRepo.save(user);

      return res.status(201).json({
        status: 200,
        success: true,
        message: "User created successfully",
        data: savedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      let { email, password } = req.body;
      password = String(password);

      // Find the user by email
      const user = await this.userRepo.findOneBy({ email });
      if (!user) {
        throw new HttpError(404, "Email Doesn't exist");
      }

      // Verify the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new HttpError(403, "Invalid email or password");
      }
      if (user.blocked) {
        throw new HttpError(
          403,
          "You are blocked. Contact admin to solve the issue."
        );
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // Decode tokens to get expiration times
      const decodedAccessToken: any = jwt.decode(accessToken);
      const decodedRefreshToken: any = jwt.decode(refreshToken);

      // Save the login log
      const loginLogRepo = AppDataSource.getRepository(LoginLog);
      const loginLog = new LoginLog();
      loginLog.user = user;
      loginLog.ipAddress = req.ip ?? "unknown";
      loginLog.userAgent = req.headers["user-agent"] || "Unknown";
      const hashedAccessToken = await hashWithoutSalt(accessToken);
      const hashedRefreshToken = await hashWithoutSalt(refreshToken);
      loginLog.accessToken = hashedAccessToken;
      loginLog.refreshToken = hashedRefreshToken;
      loginLog.accessTokenExpiresAt = new Date(decodedAccessToken.exp * 1000); // Convert to ms
      loginLog.refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000); // Convert to ms
      await loginLogRepo.save(loginLog);
      // Set tokens in cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 3600000,
        sameSite: "none",
        secure: true,
      }); // 1 hour
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 1000,
        sameSite: "none",
        secure: true,
      }); // 1 day

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          name: user.firstName,
          role: user.role,
          id: user.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const refreshToken = req.cookies.refreshToken;
      const hashedRefreshToken = await hashWithoutSalt(refreshToken);
      const log = await this.loginLogRepo.findOne({
        where: { refreshToken: hashedRefreshToken },
      });
      if (log) {
        log.revoked = true;
        await log.save();
      }
      // Clear the cookies by setting them with expired dates
      res.cookie("accessToken", "", {
        httpOnly: true,
        expires: new Date(0),
      });
      res.cookie("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Logout successful",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: any, res: Response, next: NextFunction): Promise<any> {
    const user = await User.findOneBy({ id: req.user.id });
    if (!user) {
      throw new HttpError(404, "User Not Found");
    }
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Profile data retrived successfully",
      data: { ...req.user, firstName: user.firstName },
    });
  }

  async getUsers(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      // Extract pagination, search, and role parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const search = req.query.search as string;
      const role = req.query.role as number;

      // Build search conditions if search query is provided
      const searchConditions = search
        ? [
            {
              firstName: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
            {
              lastName: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
            {
              phone: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
            {
              email: Raw((alias) => `${alias} ILIKE :value`, {
                value: `%${search}%`,
              }),
            },
          ]
        : undefined;

      // Build role condition if role query is provided
      const roleCondition = role ? { role: role } : {};

      // Find users with pagination, search conditions, and role filter
      const [users, totalItems] = await this.userRepo.findAndCount({
        where: searchConditions
          ? [
              { ...roleCondition, ...searchConditions[0] },
              { ...roleCondition, ...searchConditions[1] },
              { ...roleCondition, ...searchConditions[2] },
              { ...roleCondition, ...searchConditions[3] },
            ]
          : roleCondition,
        order: {
          createdAt: "DESC", // Sort by createdAt in descending order
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Calculate pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Users' data retrieved successfully.",
        data: users,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params; // ID of the user to delete
      const loggedInUser = req.user; // User info of the one making the request

      // Find the user to be deleted by ID
      const userToDelete = await this.userRepo.findOneBy({ id });
      if (!userToDelete) {
        throw new HttpError(404, "User not found");
      }

      if (userToDelete.id == loggedInUser.id) {
        throw new HttpError(403, "logged in user cannot delete themselves");
      }

      // If the logged-in user is a staff, they cannot delete any user
      if (loggedInUser.role == 333) {
        throw new HttpError(403, "Staff cannot delete users");
      }

      // If the logged-in user is an admin
      if (loggedInUser.role == 444) {
        if (userToDelete.role !== 333) {
          throw new HttpError(403, "Admins can only delete staff members");
        }
      }

      // If the logged-in user is a superadmin
      if (loggedInUser.role == 555) {
        if (userToDelete.role == 555) {
          throw new HttpError(
            403,
            "Superadmins cannot delete other superadmins"
          );
        }
      }

      // Proceed to delete the user
      await this.userRepo.delete(id);

      return res.status(200).json({
        status: 200,
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loggedInUser = { ...req.user };
      if (loggedInUser.role != 444 && loggedInUser.role != 555) {
        if (id != loggedInUser.id) {
          throw new HttpError(401, "Staff can only see their own data");
        }
      }

      const user = await this.userRepo.findOneBy({ id });
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      return res.status(200).json({
        status: 200,
        success: true,
        message: "User Data retrived successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params; // ID of the user whose password needs to be changed
      if (!req.body) {
        throw new HttpError(402, "New Password is required.");
      }
      let { newPassword, currentPassword } = req.body;
      newPassword = String(newPassword);
      const loggedInUser = { ...req.user }; // The logged-in user trying to change the password
      if (newPassword.length < 8 || !newPassword) {
        throw new HttpError(402, "Password must be atleast 8 characters long.");
      }

      // Find the user whose password is being changed
      const userToChange = await this.userRepo.findOneBy({ id });
      if (!userToChange) {
        throw new HttpError(404, "User not found");
      }

      // Check permission based on roles
      if (loggedInUser.role == 333 && loggedInUser.id !== userToChange.id) {
        throw new HttpError(403, "Staff can only change their own password");
      }

      if (loggedInUser.role == 444) {
        if (userToChange.role !== 333 && loggedInUser.id !== userToChange.id) {
          throw new HttpError(
            403,
            "Admins can only change their own or staff passwords"
          );
        }
      }

      if (loggedInUser.role == 555) {
        if (userToChange.role == 555 && loggedInUser.id !== userToChange.id) {
          throw new HttpError(
            403,
            "Superadmins cannot change super admin passwords"
          );
        }
      }

      // If the logged-in user is changing their own password, verify the current password
      if (loggedInUser.id == userToChange.id) {
        if (!currentPassword) {
          throw new HttpError(400, "Current Password is missing");
        }
        const isMatch = await bcrypt.compare(
          currentPassword,
          userToChange.password
        );
        if (!isMatch) {
          throw new HttpError(400, "Current password is incorrect");
        }
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userToChange.password = hashedPassword;

      // Save the updated user
      userToChange.modifiedBy = loggedInUser.id;
      await this.userRepo.save(userToChange);

      // Revoke all the tokens of that user
      await this.loginLogRepo.update(
        { user: { id: userToChange.id }, revoked: false },
        { revoked: true }
      );

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  async updateUser(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params; // ID of the user to be updated
      const { firstName, lastName, phone, address, position, role } = req.body;

      const loggedInUser = req.user; // The logged-in user trying to update the details

      // Validate required fields
      if (
        !firstName &&
        !lastName &&
        !phone &&
        !address &&
        !position &&
        role == undefined
      ) {
        throw new HttpError(400, "No fields to update.");
      }

      const userToUpdate = await this.userRepo.findOneBy({ id });

      if (!userToUpdate) {
        throw new HttpError(404, "User not found.");
      }

      // Store the previous role
      const previousRole = userToUpdate.role;

      // Check permissions based on roles
      if (loggedInUser.id == userToUpdate.id) {
        if (role !== previousRole) {
          throw new HttpError(403, "One can't change oneself's role");
        }
        // Users can always update their own details
        // No additional checks needed here
      } else if (loggedInUser.role == 333) {
        // Staff
        throw new HttpError(403, "Staff can only update their own details.");
      } else if (loggedInUser.role == 444) {
        // Admin
        if (userToUpdate.role == 444 || userToUpdate.role == 555) {
          throw new HttpError(
            403,
            "Admins cannot update admins or superadmins."
          );
        }
        // Admins cannot change roles
        if (role !== undefined && previousRole !== role) {
          throw new HttpError(403, "Admins cannot change anyone's role.");
        }
      } else if (loggedInUser.role == 555) {
        // Superadmin
        if (userToUpdate.role == 555 && loggedInUser.id !== userToUpdate.id) {
          throw new HttpError(
            403,
            "Superadmins cannot update other superadmins."
          );
        }
        if (role !== undefined && previousRole !== role) {
          // Superadmins can assign ADMIN roles and STAFF roles

          userToUpdate.role = role;
        }
      }

      // Update user details based on provided fields
      if (firstName) userToUpdate.firstName = firstName;
      if (lastName) userToUpdate.lastName = lastName;
      if (phone) userToUpdate.phone = phone;
      if (address) userToUpdate.address = address;
      if (position) userToUpdate.position = position;
      userToUpdate.modifiedBy = loggedInUser.id;
      await this.userRepo.save(userToUpdate);

      if (previousRole != role && role != undefined) {
        await this.loginLogRepo.update(
          { user: { id: userToUpdate.id }, revoked: false },
          { revoked: true }
        );
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "User details updated successfully.",
        data: { firstName: userToUpdate.firstName },
      });
    } catch (error) {
      next(error);
    }
  }

  //toggle blocked state of the user
  async toggleBlocked(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loggedInUser = req.user; // The logged-in user trying to update the details
      if (loggedInUser.id == id) {
        throw new HttpError(400, "One can't block or unblock onself.");
      }
      // Find the user by ID
      const user = await this.userRepo.findOne({
        where: { id: parseInt(id, 10) },
      });

      // Check if user exists
      if (!user) {
        throw new HttpError(404, "User not found");
      }

      // Toggle the blocked state
      user.blocked = !user.blocked;

      // Save the updated user
      await this.userRepo.save(user);

      // Send response
      res.status(200).json({
        message: `User ${user.blocked ? "blocked" : "unblocked"} successfully`,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all login logs, or filter by userId, role, and search if provided
  async getLoginLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const search = req.query.search as string;
      const role = req.query.role
        ? parseInt(req.query.role as string)
        : undefined;
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;

      // Build the where conditions using TypeORM's QueryBuilder
      const queryBuilder = this.loginLogRepo
        .createQueryBuilder("loginLog")
        .leftJoinAndSelect("loginLog.user", "user");

      // Add userId filter
      if (userId) {
        queryBuilder.andWhere("user.id = :userId", { userId });
      }

      // Add role filter
      if (role !== undefined) {
        queryBuilder.andWhere("user.role = :role", { role });
      }

      // Add search conditions
      if (search) {
        queryBuilder.andWhere(
          "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Add ordering
      queryBuilder.orderBy("loginLog.loginTime", "DESC");

      // Add pagination
      const [logs, totalItems] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      if (totalItems === 0) {
        return res.status(200).json({
          status: 200,
          success: true,
          message: userId
            ? `No login logs found for user ID ${userId}.`
            : "No login logs found.",
          data: [],
        });
      }

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        loginTimestamp: log.loginTime,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        user: {
          id: log.user.id,
          name: log.user.firstName,
          email: log.user.email,
          phone: log.user.phone,
        },
      }));

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Login logs retrieved successfully.",
        data: formattedLogs,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all login logs for a specific user
  async getUserLoginLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract userId from request parameters
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        throw new HttpError(400, "Invalid user ID.");
      }

      // Extract pagination parameters from query
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;

      // Find the user with the specified userId and their login logs
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ["loginLog"], // Include login logs relation
      });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: `User not found with ID ${userId}.`,
        });
      }

      // Sort the login logs by loginTime in descending order
      const sortedLogs = user.loginLog.sort(
        (a, b) =>
          new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      );

      // Paginate login logs
      const totalItems = sortedLogs.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Get the login logs for the current page
      const paginatedLogs = sortedLogs.slice(
        (page - 1) * pageSize,
        page * pageSize
      );
      // Format logs to include only specified user details
      const formattedLogs = {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          position: user.position,
        },
        log: paginatedLogs.map((log) => ({
          id: log.id,
          loginTimestamp: log.loginTime,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        })),
      };

      return res.status(200).json({
        status: 200,
        success: true,
        message: `Login logs retrieved successfully for user ID ${userId}.`,
        data: formattedLogs,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeLoginLogs(req: any, res: Response) {
    try {
      // console.log(req.user);
      const userId = Number(req.query.userId);

      // Check if a specific userId is provided
      if (userId) {
        // Check if user exists
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({
            status: 404,
            success: false,
            message: "User not found.",
            data: null,
          });
        }

        // Revoke all login logs for the specified user
        await this.loginLogRepo.update(
          { user: { id: userId }, revoked: false },
          { revoked: true }
        );

        return res.status(200).json({
          status: 200,
          success: true,
          message: `All login tokens for user ${
            user.firstName + " " + user.lastName
          } have been revoked.`,
          data: null,
        });
      }

      // If no userId is provided, revoke all login logs in the system
      await this.loginLogRepo.update({ revoked: false }, { revoked: true });

      return res.status(200).json({
        status: 200,
        success: true,
        message: "All login tokens have been revoked.",
        data: null,
      });
    } catch (error) {
      console.error("Error revoking login tokens:", error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: "An error occurred while revoking login token.",
        data: null,
      });
    }
  }

  async getLoggedInUsers(req: Request, res: Response) {
    try {
      const currentTime = new Date();
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      const role = req.query.role
        ? parseInt(req.query.role as string)
        : undefined;

      // Start building the query for fetching users with active tokens
      const query = this.userRepo
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.loginLog", "loginLog")
        .where("loginLog.revoked = :revoked", { revoked: false })
        .andWhere(
          "(loginLog.accessTokenExpiresAt > :currentTime OR loginLog.refreshTokenExpiresAt > :currentTime)",
          { currentTime }
        );

      // Apply search filters if search query is provided
      if (search) {
        query.andWhere(
          "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (role !== undefined) {
        query.andWhere("user.role = :role", { role });
      }

      // Add ordering
      query.orderBy("loginLog.loginTime", "DESC");

      // Add pagination
      const [users, totalItems] = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      // Prepare the response with required data
      const activeUsers = users.map((user) => {
        const activeTokens = user.loginLog.filter(
          (log) =>
            !log.revoked &&
            (log.accessTokenExpiresAt > currentTime ||
              log.refreshTokenExpiresAt > currentTime)
        );

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          ipAddress: user.loginLog.map((log) => log.ipAddress),
          numberOfDevices: activeTokens.length,
          userAgents: activeTokens.map((token) => token.userAgent),
        };
      });

      // Pagination details
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Active and live users fetched successfully.",
        data: activeUsers,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      console.error("Error fetching active and live users:", error);
      return res.status(500).json({
        status: 500,
        success: false,
        message: "An error occurred while fetching active and live users.",
        data: null,
      });
    }
  }

  async issueNewAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        throw new HttpError(401, "Login Tokens are missing.");
      }
      const refreshToken = authHeader.split(" ")[1];
      if (!refreshToken) {
        {
          throw new HttpError(401, "Login Tokens are missing.");
        }
      }

      const hashedRefreshToken = hashWithoutSalt(refreshToken);
      const log = await this.loginLogRepo.findOne({
        where: { refreshToken: hashedRefreshToken },
      });

      if (log) {
        if (log.revoked == true) {
          // Since, the token are revoked, throw forbidden error and terminate the create new access-token request

          throw new HttpError(
            401,
            "The login tokens are revoked. Please login again."
          );
        }
        if (new Date() > log.refreshTokenExpiresAt) {
          // If current time is greater than the expiration time
          throw new HttpError(
            401,
            "The refresh has expired. Please login again."
          );
        }
      } else {
        throw new HttpError(
          401,
          "The refresh tokens are missing. Please login again."
        );
      }

      const user = await verifyToken(refreshToken, REFRESH_TOKEN_SECRET);
      console.log("generating new access token");
      // Generate a new access token
      const newAccessToken = generateNewAccessToken(user);
      const hashedAccessToken = hashWithoutSalt(newAccessToken);
      log.accessToken = hashedAccessToken;
      const decodedAccessToken: any = jwt.decode(newAccessToken);
      log.accessTokenExpiresAt = new Date(decodedAccessToken.exp * 1000); // Convert to ms
      await log.save();

      return res.status(200).json({
        success: true,
        message: "New access token issued successfully.",
        data: { accessToken: newAccessToken },
      });
    } catch (error) {
      next(new HttpError(401, "The refresh token is mising or invalid"));
    }
  }

  async loginMobile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      let { email, password } = req.body;
      password = String(password);

      // Find the user by email
      const user = await this.userRepo.findOneBy({ email });
      if (!user) {
        throw new HttpError(200, "Email Doesn't exist");
      }

      // Verify the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new HttpError(403, "Invalid email or password");
      }
      if (user.blocked) {
        throw new HttpError(
          403,
          "You are blocked. Contact admin to solve the issue."
        );
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // Decode tokens to get expiration times
      const decodedAccessToken: any = jwt.decode(accessToken);
      const decodedRefreshToken: any = jwt.decode(refreshToken);

      // Save the login log
      const loginLogRepo = AppDataSource.getRepository(LoginLog);
      const loginLog = new LoginLog();
      loginLog.user = user;
      loginLog.ipAddress = req.ip ?? "unknown";
      loginLog.userAgent = req.headers["user-agent"] || "Unknown";
      const hashedAccessToken = await hashWithoutSalt(accessToken);
      const hashedRefreshToken = await hashWithoutSalt(refreshToken);
      loginLog.accessToken = hashedAccessToken;
      loginLog.refreshToken = hashedRefreshToken;
      loginLog.accessTokenExpiresAt = new Date(decodedAccessToken.exp * 1000); // Convert to ms
      loginLog.refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000); // Convert to ms
      await loginLogRepo.save(loginLog);
      // Set tokens in cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 3600000,
        sameSite: "none",
        secure: true,
      }); // 1 hour
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 1000,
        sameSite: "none",
        secure: true,
      }); // 1 day

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          name: user.firstName,
          role: user.role,
          id: user.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
