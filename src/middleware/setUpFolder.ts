import { NextFunction } from "express";
import path from "path";
import { Request, Response } from "express";
const DEFAULT_UPLOAD_FOLDER = path.join(__dirname, "../uploads");

// Middleware to set the dynamic upload folder
export const setUploadFolder = (folderPath: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    // Ensure folderPath doesn't escape the default base path
    const safeFolderPath = folderPath.replace(/^\//, ""); // Remove leading slash if present
    req.uploadFolder = safeFolderPath
      ? path.join(DEFAULT_UPLOAD_FOLDER, safeFolderPath)
      : DEFAULT_UPLOAD_FOLDER;

    next();
  };
};
