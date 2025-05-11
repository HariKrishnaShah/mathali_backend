import multer from "multer";
import fs from "fs";
import path from "path";
import { Request } from "express";
import HttpError from "../util/httpError";

const DEFAULT_UPLOAD_FOLDER = "uploads";

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-zA-Z0-9-_]/g, "_");
};

const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    const uploadFolder = req.uploadFolder || DEFAULT_UPLOAD_FOLDER;

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    cb(null, uploadFolder);
  },
  filename: (req: Request, file, cb) => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);

    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(file.originalname);
    let fileNameWithoutExtension = path.basename(
      file.originalname,
      fileExtension
    );

    fileNameWithoutExtension = sanitizeFilename(fileNameWithoutExtension);
    const newFileName = `${fileNameWithoutExtension}_${timestamp}_${randomString}${fileExtension}`;

    cb(null, newFileName);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const { fieldname, mimetype, size } = file;

  if (fieldname.startsWith("photo")) {
    if (!mimetype.startsWith("image/")) {
      //@ts-ignore
      return cb(new HttpError(400, "Invalid Image in photo field."), false);
    }
    console.log(file);
    if (size > 5 * 1024) {
      //@ts-ignore
      return cb(new HttpError(400, "Photo size exceeds 5MB limit."), false);
    }
  } else if (fieldname.startsWith("video")) {
    if (!mimetype.startsWith("video/")) {
      return cb(
        //@ts-ignore
        new HttpError(400, "Invalid video type in video field."),
        false
      );
    }
    if (size > 50 * 1024 * 1024) {
      //@ts-ignore
      return cb(new HttpError(400, "Video size exceeds 50MB limit."), false);
    }
  } else if (fieldname.startsWith("pdf")) {
    if (mimetype !== "application/pdf") {
      return cb(
        //@ts-ignore
        new HttpError(400, "Invalid file type in pdf field. Expected a PDF."),
        false
      );
    }
    if (size > 10 * 1024 * 1024) {
      //@ts-ignore
      return cb(new HttpError(400, "PDF size exceeds 10MB limit."), false);
    }
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max size allowed for any file
  },
});
