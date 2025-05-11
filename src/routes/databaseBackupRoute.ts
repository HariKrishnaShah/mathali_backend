import express from "express";
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import databaseBackupController from "../controllers/databaseBackupController";
import { upload } from "../config/multer.config";
import { setUploadFolder } from "../middleware/setUpFolder";
const router = express.Router();

router.post(
  "/create-db-backup-now",
  isLoggedIn,
  isSuperAdmin,
  (req, res, next) => {
    databaseBackupController.createBackup(req, res, next);
  }
);

router.get(
  "/list-all-available-backups",
  isLoggedIn,
  isSuperAdmin,
  (req, res, next) => {
    databaseBackupController.listBackups(req, res, next);
  }
);

router.get(
  "/download-backup/:fileName",
  isLoggedIn,
  isSuperAdmin,
  (req, res, next) => {
    databaseBackupController.downloadBackup(req, res, next);
  }
);
router.post(
  "/restore-db-to-backup/:fileName",
  isLoggedIn,
  isSuperAdmin,
  (req, res, next) => {
    databaseBackupController.restoreBackup(req, res, next);
  }
);

router.post(
  "/upload-backup",
  setUploadFolder("/dbBackups"),
  upload.single("file"), // Middleware for handling single file uploads
  (req, res, next) => databaseBackupController.uploadBackup(req, res, next)
);

module.exports = router;
