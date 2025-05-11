import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { Chat } from "../../entities/chatbot/chat";
import { User } from "../../entities/user/User";
import HttpError from "../../util/httpError";

class ChatController {
  constructor(private chatRepo = AppDataSource.getRepository(Chat)) {}

  // Create a new chat
  async createChat(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newChat = this.chatRepo.create({
        name: name || "New Chat",
        user: user,
      });
      await this.chatRepo.save(newChat);
      res.status(201).json({
        sucess: true,
        status: 201,
        message: "Chat created successfully",
        data: {
          id: newChat.id,
          createdAt: newChat.createdAt,
          updatedAt: newChat.updatedAt,
          name: newChat.name,
        },
      });
    } catch (error) {
      throw new HttpError(500, "Something went wrong");
    }
  }

  // Get all chats for the authenticated user (Most recent first)
  async getAllChats(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const chats = await this.chatRepo.find({
        where: { user: { id: userId } },
        order: { createdAt: "DESC" },
      });
      res
        .status(200)
        .status(200)
        .json({ succuss: true, status: 200, data: chats });
    } catch (error) {
      res.status(500).json({ message: "Error fetching chats", error });
    }
  }

  // Delete chat by ID (only if owned by the user)
  async deleteChat(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const chatId = req.params.id;

      const chat = await this.chatRepo.findOne({
        where: { id: chatId, user: { id: userId } },
      });

      if (!chat) {
        return res
          .status(404)
          .json({ message: "Chat not found or unauthorized" });
      }

      await this.chatRepo.remove(chat);
      res.status(200).json({ message: "Chat deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting chat", error });
    }
  }

  // Rename chat (only if owned by the user)
  async renameChat(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const chatId = req.params.id;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "New name is required" });
      }

      const chat = await this.chatRepo.findOne({
        where: { id: chatId, user: { id: userId } },
      });

      if (!chat) {
        return res
          .status(404)
          .json({ message: "Chat not found or unauthorized" });
      }

      chat.name = name;
      await this.chatRepo.save(chat);
      res.status(200).json({ message: "Chat renamed successfully", chat });
    } catch (error) {
      res.status(500).json({ message: "Error renaming chat", error });
    }
  }
}

export default new ChatController();
