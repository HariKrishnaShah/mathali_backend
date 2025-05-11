import { AppDataSource } from "../../config/database";
import { Chat } from "../../entities/chatbot/chat";
import { Conversation } from "../../entities/chatbot/conversation";

export async function getRecentConversationsLocal(
  userId: number,
  chatId: number
) {
  try {
    const chat = await AppDataSource.getRepository(Chat).findOne({
      where: { id: chatId, user: { id: userId } },
    });

    if (!chat) {
      throw new Error("Chat not found or unauthorized");
    }

    const queryOptions: any = {
      where: { chat: { id: Number(chatId) } },
      order: { sequence: "ASC" },
    };

    const conversations = await AppDataSource.getRepository(Conversation).find(
      queryOptions
    );

    return conversations.map((conv) => ({
      [conv.agent]: conv.content,
    }));
  } catch (error) {
    throw error;
  }
}
