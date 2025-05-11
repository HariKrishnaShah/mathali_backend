import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import {
  fileExistsInDropbox,
  setupBackupStatusSocket,
  uploadFileToDropbox,
} from "../controllers/backupUpload";
import fs from "fs";
dotenv.config();

// Shared upload state
let uploadInProgress = false;
let currentProgress = {
  currentFile: "",
  fileProgress: 0,
  overallProgress: 0,
};
let listeners: Socket[] = [];
// Initialize Socket.IO server
export const initializeSocket = (httpServer: any): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3002",
        "https://www.manthali.palikagis.com",
        "https://manthali.palikagis.com",
        "https://palikagis.com",
        "https://www.palikagis.com",
      ],
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    console.log("Socket handshake received"); // Log when handshake starts
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    if (!token) {
      console.log("No token found in handshake"); // Log if no token is found
      return next(new Error("Authentication error: Token not found"));
    }

    try {
      console.log("Token found, verifying..."); // Log before decoding the token
      const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      if (decoded.role !== 555) {
        console.log("User is not a superadmin.");
        throw new Error("Authentication error: User is not a super admin.");
      }
      console.log("pass");
      (socket as any).user = decoded; // Attach user data to the socket
      console.log("Token verified successfully"); // Log successful verification
      next();
    } catch (err) {
      console.log("Token verification failed: ", err); // Log token verification error
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Event Handling
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`); // Log user connection
    console.log("Authenticated user:", (socket as any).user); // Log authenticated user data
    setupBackupStatusSocket(socket, io);
    // Send initialization message
    socket.emit("initialization", { message: "Hello from server!" });

    // Socket handler for file upload
    socket.on("start-upload", async () => {
      if (uploadInProgress) {
        console.log(`User ${socket.id} joined ongoing upload`);
        listeners.push(socket);
        socket.emit("upload-already-in-progress", {
          message: "File upload is already in progress!",
        });
        // Emit current progress to the newly joined socket
        socket.emit("upload-progress", currentProgress);
        return;
      }

      // Start a new upload
      console.log("Starting file upload...");
      uploadInProgress = true;
      listeners = [socket]; // Clear and add current socket as the first listener

      const uploadFolder = path.join(__dirname, "..", "uploads", "dbBackups");
      const files = fs.readdirSync(uploadFolder);
      let totalBytes = 0;
      let uploadedBytes = 0;

      for (const file of files) {
        const filePath = path.join(uploadFolder, file);
        if (fs.statSync(filePath).isFile()) {
          const exists = await fileExistsInDropbox(file);
          if (!exists) {
            totalBytes += fs.statSync(filePath).size;
          }
        }
      }

      if (totalBytes === 0) {
        uploadInProgress = false;
        currentProgress = {
          currentFile: "",
          fileProgress: 0,
          overallProgress: 0,
        };

        for (const listener of listeners) {
          listener.emit("upload-completed", {
            message: "All files already exist in Dropbox!",
          });
        }
        return;
      }

      for (const listener of listeners) {
        listener.emit("upload-started", {
          message: "File upload has started!",
          totalFiles: files.length,
        });
      }

      let allUploadsCompleted = true;

      for (const file of files) {
        const filePath = path.join(uploadFolder, file);
        if (fs.statSync(filePath).isFile()) {
          console.log(`Checking if file ${file} exists in Dropbox...`);
          const exists = await fileExistsInDropbox(file);

          if (!exists) {
            console.log(`Uploading file ${file}...`);
            const fileSize = fs.statSync(filePath).size;

            try {
              await uploadFileToDropbox(
                filePath,
                file,
                socket,
                (progress: number) => {
                  const currentFileBytes = progress * fileSize;
                  const overallProgress =
                    (uploadedBytes + currentFileBytes) / totalBytes;

                  currentProgress = {
                    currentFile: file,
                    fileProgress: progress,
                    overallProgress: Math.min(1, overallProgress),
                  };

                  for (const listener of listeners) {
                    listener.emit("upload-progress", currentProgress);
                  }
                }
              );

              uploadedBytes += fileSize;
            } catch (err) {
              console.log(`Failed to upload ${file}:`, err);
              allUploadsCompleted = false;

              for (const listener of listeners) {
                listener.emit("upload-error", {
                  message: `Failed to upload ${file}`,
                  error: err,
                });
              }
              break;
            }
          }
        }
      }

      uploadInProgress = false;
      currentProgress = {
        currentFile: "",
        fileProgress: 0,
        overallProgress: 0,
      };

      if (allUploadsCompleted) {
        for (const listener of listeners) {
          listener.emit("upload-completed", {
            message: "All files uploaded successfully!",
          });
        }
      }
    });
    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id}, Reason: ${reason}`); // Log disconnection reason
    });

    // Additional error handling on socket
    socket.on("error", (error) => {
      console.log("Socket error: ", error); // Log any socket error
    });
  });

  return io;
};
