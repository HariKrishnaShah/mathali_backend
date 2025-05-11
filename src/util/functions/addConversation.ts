// conversation.service.ts
import { AppDataSource } from "../../config/database";
import { Chat } from "../../entities/chatbot/chat";
import { AgentType, Conversation } from "../../entities/chatbot/conversation";

export async function addConversation(
  userId: number,
  chatId: number,
  agent: AgentType,
  content: string,
  hidden: boolean = false
) {
  // Use serializable transaction for the entire operation
  return await AppDataSource.transaction(
    "SERIALIZABLE",
    async (transactionalEntityManager) => {
      try {
        const chat = await transactionalEntityManager
          .getRepository(Chat)
          .findOne({
            where: { id: chatId, user: { id: userId } },
            lock: { mode: "pessimistic_write" },
          });

        if (!chat) {
          throw new Error("Chat not found or unauthorized");
        }

        // Create and save the conversation within the same transaction
        const newConversation = new Conversation();
        newConversation.agent = agent;
        newConversation.content = content;
        newConversation.chat = chat;
        newConversation.hidden = hidden;

        // Save using the transaction manager
        return await transactionalEntityManager.save(newConversation);
      } catch (error: any) {
        // If it's a unique constraint violation, retry the operation
        if (error.code === "23505") {
          // PostgreSQL unique violation code
          // Let the transaction rollback and retry will happen automatically
          throw error;
        }
        throw error;
      }
    }
  );
}
