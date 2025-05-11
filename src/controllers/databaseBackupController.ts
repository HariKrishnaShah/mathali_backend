import { AppDataSource } from "../config/database";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";

dotenv.config();

const execPromise = promisify(exec);

export class DatabaseBackupController {
  // Backup the database and store the record in the database
  async createBackup(req: Request, res: Response, next: NextFunction) {
    const backupFolder = path.join(__dirname, "../uploads/dbBackups");
    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true }); // Create backup folder if it doesn't exist
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);
    const backupFileName = `backup_${timestamp}.sql`;
    const backupFilePath = path.join(backupFolder, backupFileName);

    // Prepare the pg_dump command to backup the database
    const backupCommand = `pg_dump -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d ${process.env.DB_NAME} -Fc -v -f ${backupFilePath}`;

    try {
      // Execute the backup command
      await execPromise(backupCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      return res.json({
        status: 200,
        success: true,
        message: "Database backup created.",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async listBackups(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Extract pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;

      // Folder where backup files are stored
      const backupFolder = path.join(__dirname, "../uploads/dbBackups");

      // Read all files from the backup folder
      const files = await fs.promises.readdir(backupFolder);

      // Get the list of files with their metadata (size in MB and createdAt)
      const backupFiles = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(backupFolder, fileName);
          const stats = await fs.promises.stat(filePath);

          // Convert size from bytes to MB
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2); // Format to 2 decimal places

          // Convert createdAt to a human-readable format
          const createdAtHumanReadable = stats.birthtime.toLocaleString(); // Use default locale format

          return {
            fileName,
            size: sizeInMB, // Size in MB
            createdAt: stats.birthtime, // Original Date object for sorting
            createdAtHumanReadable, // Human-readable format of createdAt
            path: filePath,
          };
        })
      );

      // Sort the files by createdAt in descending order (latest first)
      backupFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Calculate pagination details
      const totalFiles = backupFiles.length;
      const totalPages = Math.ceil(totalFiles / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedFiles = backupFiles.slice(
        startIndex,
        startIndex + pageSize
      );

      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPages;

      // Respond with the backup files and pagination details
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Backup files retrieved successfully.",
        data: paginatedFiles,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalItems: totalFiles,
          hasPreviousPage,
          hasNextPage,
        },
      });
    } catch (error) {
      console.log(error);
      next(error); // Pass error to the error-handling middleware
    }
  }

  // Download a backup file by its name
  async downloadBackup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { fileName } = req.params; // Get the file name from the route parameters

    try {
      // Construct the path to the backup file
      const backupFolder = path.join(__dirname, "../uploads/dbBackups");
      const backupFilePath = path.join(backupFolder, fileName);

      // Check if the file exists
      if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Backup file not found.",
        });
      }

      // Send the file as a download to the client
      return res.download(backupFilePath, fileName, (err) => {
        if (err) {
          console.log(err);
          next(err); // Pass error to the error-handling middleware
        }
      });
    } catch (error) {
      console.log(error);
      next(error); // Pass error to the error-handling middleware
    }
  }

  //Restore the database
  async restoreBackup(req: Request, res: Response, next: NextFunction) {
    const { fileName } = req.params;
    const restoreFilePath = path.join(
      __dirname,
      "../uploads/dbBackups",
      fileName
    );

    const backupFolder = path.join(__dirname, "../uploads/dbBackups");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);
    const beforeRestoreBackupFileName = `before_restoring_${fileName}_${timestamp}.sql`;
    const beforeRestoreBackupFilePath = path.join(
      backupFolder,
      beforeRestoreBackupFileName
    );

    try {
      // Check if the file exists
      if (!fs.existsSync(restoreFilePath)) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Backup file to restore not found.",
        });
      }

      // Create safety backup
      const backupCommand = `pg_dump -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d ${process.env.DB_NAME} -Fc -v -f ${beforeRestoreBackupFilePath}`;
      await execPromise(backupCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      // Terminate all connections to the database
      const terminateConnectionsCommand = `psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${process.env.DB_NAME}' AND pid <> pg_backend_pid();"`;
      await execPromise(terminateConnectionsCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      // Drop the database
      const dropDbCommand = `dropdb -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} --if-exists ${process.env.DB_NAME}`;
      await execPromise(dropDbCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      // Create a new database
      const createDbCommand = `createdb -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} ${process.env.DB_NAME}`;
      await execPromise(createDbCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      // Restore the database
      const restoreCommand = `pg_restore -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d ${process.env.DB_NAME} --clean --if-exists --no-owner --no-privileges --verbose ${restoreFilePath}`;
      await execPromise(restoreCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Database restored successfully.",
      });
    } catch (error) {
      console.log("Restore failed:", error);

      try {
        // Terminate all connections again for clean rollback
        const terminateConnectionsCommand = `psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${process.env.DB_NAME}' AND pid <> pg_backend_pid();"`;
        await execPromise(terminateConnectionsCommand, {
          env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
        });

        // Drop the database again
        const dropDbCommand = `dropdb -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} --if-exists ${process.env.DB_NAME}`;
        await execPromise(dropDbCommand, {
          env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
        });

        // Create a new database
        const createDbCommand = `createdb -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} ${process.env.DB_NAME}`;
        await execPromise(createDbCommand, {
          env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
        });

        // Restore from the safety backup
        const rollbackCommand = `pg_restore -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d ${process.env.DB_NAME} --clean --if-exists --no-owner --no-privileges --verbose ${beforeRestoreBackupFilePath}`;
        await execPromise(rollbackCommand, {
          env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
        });

        return res.status(500).json({
          status: 500,
          success: false,
          message:
            "Restore failed. Database rolled back to the previous state.",
        });
      } catch (rollbackError) {
        console.log("Rollback failed:", rollbackError);
        return res.status(500).json({
          status: 500,
          success: false,
          message:
            "Restore and rollback failed. Database may be in an inconsistent state.",
        });
      }
    }
  }

  async validateBackupFile(filePath: string): Promise<boolean> {
    try {
      // Use pg_restore with --list flag to verify the backup file format and content
      // This command only lists the contents without actually restoring
      const validateCommand = `pg_restore -l "${filePath}"`;

      // Additionally check if we can connect to the database
      const connectCommand = `psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USERNAME} -d ${process.env.DB_NAME} -c "SELECT 1"`;

      // Execute the validation command
      const { stdout: backupContent, stderr: backupError } = await execPromise(
        validateCommand,
        {
          env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
        }
      );

      // Check if backup file is valid
      if (backupError) {
        console.error("Backup validation error:", backupError);
        return false;
      }

      // Test database connectivity
      const { stderr: connectError } = await execPromise(connectCommand, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      if (connectError) {
        console.error("Database connection error:", connectError);
        return false;
      }

      // If we got here, both the backup file is valid and we can connect to the database
      console.log("Backup validation successful");
      console.log("Backup contents:", backupContent);
      return true;
    } catch (error) {
      console.error("Error during validation:", error);
      return false;
    }
  }
  async uploadBackup(req: any, res: Response, next: NextFunction) {
    try {
      const file = req.file; // Retrieve the file uploaded by Multer

      if (!file) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "No file uploaded.",
        });
      }

      const uploadedFilePath = file.path; // Multer automatically provides the file path

      // Validate the backup file
      const isValid = await this.validateBackupFile(uploadedFilePath);

      if (!isValid) {
        // If invalid, delete the uploaded file to avoid keeping bad files
        fs.unlinkSync(uploadedFilePath);

        return res.status(400).json({
          status: 400,
          success: false,
          message: "Invalid backup file. Cannot restore.",
        });
      }

      // If valid, proceed with further logic
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Backup file validated successfully.",
        filePath: uploadedFilePath, // Optionally provide the uploaded file's path
      });
    } catch (error) {
      console.error("Error during file upload or validation:", error);

      next(error);
    }
  }
}

export default new DatabaseBackupController();
