import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Dropbox } from "dropbox";
import fetch from "isomorphic-fetch";
dotenv.config();

// Initialize Dropbox client
// Initialize Dropbox client with Refresh Token
const dbx = new Dropbox({
  clientId: process.env.DROP_BOX_APP_KEY,
  clientSecret: process.env.DROP_BOX_APP_SECRET,
  refreshToken: process.env.DROP_BOX_REFRESH_TOKEN,
  fetch: fetch,
});
// Function to check if file exists in Dropbox folder
export async function fileExistsInDropbox(fileName: string): Promise<boolean> {
  try {
    // Search for the specific file instead of listing all files
    const result = await dbx.filesSearch({
      path: "/dbBackups",
      query: fileName,
      mode: { ".tag": "filename" },
    });

    return result.result.matches.some(
      (match) =>
        match.metadata[".tag"] === "file" && match.metadata.name === fileName
    );
  } catch (error) {
    console.error("Error checking file in Dropbox:", error);
    return false;
  }
}

// Function to upload file to Dropbox and emit progress
export async function uploadFileToDropbox(
  filePath: string,
  fileName: string,
  socket: Socket,
  onProgress: (progress: number) => void
) {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    const chunkSize = 1024 * 1024; // 1MB chunks
    let uploadedBytes = 0;

    // Create read stream with specific chunk size
    const stream = fs.createReadStream(filePath, {
      highWaterMark: chunkSize,
      encoding: undefined, // This ensures chunks are buffers
    });

    // Buffer to store file contents
    const fileBuffer = Buffer.alloc(fileSize);

    stream.on("data", (chunk: any) => {
      // Explicitly type chunk as Buffer
      chunk.copy(fileBuffer, uploadedBytes);
      uploadedBytes += chunk.length;
      const progress = uploadedBytes / fileSize;
      onProgress(progress);
    });

    stream.on("end", async () => {
      try {
        await dbx.filesUpload({
          path: `/dbBackups/${fileName}`,
          contents: fileBuffer,
          mode: { ".tag": "overwrite" },
        });
        resolve(true);
      } catch (err) {
        console.error(`Error uploading file ${fileName}:`, err);
        reject(err);
      }
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

export const setupBackupStatusSocket = (socket: Socket, io: Server) => {
  socket.on("check-backup-status", async () => {
    try {
      console.log("Checking backup status...");

      const uploadFolder = path.join(__dirname, "..", "uploads", "dbBackups");
      const localFiles = fs.readdirSync(uploadFolder);

      const fileStatuses = await Promise.all(
        localFiles.map(async (file) => {
          const filePath = path.join(uploadFolder, file);
          if (fs.statSync(filePath).isFile()) {
            const existsInDropbox = await fileExistsInDropbox(file);
            const fileSize = fs.statSync(filePath).size;
            const lastModified = fs.statSync(filePath).mtime;

            return {
              fileName: file,
              size: fileSize,
              lastModified: lastModified,
              existsInDropbox,
            };
          }
          return null;
        })
      );

      const validFiles = fileStatuses.filter(
        (status): status is NonNullable<typeof status> => status !== null
      );

      const stats = {
        totalFiles: validFiles.length,
        syncedFiles: validFiles.filter((f) => f.existsInDropbox).length,
        unsyncedFiles: validFiles.filter((f) => !f.existsInDropbox).length,
        totalSize: validFiles.reduce((acc, curr) => acc + curr.size, 0),
        files: validFiles,
      };

      socket.emit("backup-status-result", {
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error checking backup status:", error);
      socket.emit("backup-status-result", {
        success: false,
        error: "Failed to check backup status",
      });
    }
  });
};
