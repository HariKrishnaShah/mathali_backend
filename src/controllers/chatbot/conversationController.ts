import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { Chat } from "../../entities/chatbot/chat";
import { Conversation } from "../../entities/chatbot/conversation";
import HttpError from "../../util/httpError";
import { User } from "../../entities/user/User";
import { Timestamp } from "typeorm";
import { timeStamp } from "console";

class ConversationController {
  constructor(
    private chatRepo = AppDataSource.getRepository(Chat),
    private conversationRepo = AppDataSource.getRepository(Conversation)
  ) {}

  // Get recent conversations of a chat
  async getRecentConversations(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const chatId = req.params.chatId;
      const chat = await this.chatRepo.findOne({
        where: { id: chatId, user: { id: userId } },
      });
      if (!chat) {
        return res
          .status(404)
          .json({ message: "Chat not found or unauthorized" });
      }

      const pageSize = parseInt(req.query.pageSize as string) || 100;
      const page = parseInt(req.query.page as string) || 1;

      const conversations = await this.conversationRepo.find({
        where: { chat: { id: Number(chatId) }, hidden: false },
        order: { sequence: "DESC" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      });

      const formattedData = conversations.map((conv) => ({
        [conv.agent]: conv.content,
        timestamp: conv.createdAt,
      }));

      res.status(200).json({
        success: true,
        status: 200,
        message: "Conversation Retrieved Successfully",
        data: formattedData.reverse(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConversationController();
