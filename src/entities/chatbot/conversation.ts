import { Column, Entity, ManyToOne, BeforeInsert, Unique } from "typeorm";
import { BaseEntity } from "../basic/Base";
import { Chat } from "./chat";
import { AppDataSource } from "../../config/database";

export enum AgentType {
  USER = "user",
  AI = "ai",
  SYSTEM = "system",
}

@Entity("conversation", { schema: "public" })
@Unique(["chat", "sequence"])
export class Conversation extends BaseEntity {
  @ManyToOne(() => Chat, (chat) => chat.conversation, {
    nullable: false,
    onDelete: "CASCADE",
  })
  chat: Chat;

  @Column({
    type: "enum",
    enum: AgentType,
    nullable: false,
  })
  agent: AgentType;

  @Column("text", {
    nullable: false,
  })
  content: string;

  @Column("integer", {
    nullable: false,
  })
  sequence: number;

  @Column("boolean", { nullable: false, default: false })
  hidden: Boolean;

  @BeforeInsert()
  async setSequence() {
    await AppDataSource.transaction(
      "SERIALIZABLE",
      async (transactionalEntityManager) => {
        // First acquire an advisory lock for this chat
        await transactionalEntityManager.query(
          "SELECT pg_advisory_xact_lock($1)",
          [this.chat.id]
        );

        // Get the current max sequence
        const result = await transactionalEntityManager
          .createQueryBuilder(Conversation, "conversation")
          .where("conversation.chatId = :chatId", { chatId: this.chat.id })
          .select("MAX(conversation.sequence)", "max")
          .getRawOne();

        const nextSequence = (result.max || 0) + 1;

        // Important: Wait for the previous sequence to exist
        // This ensures strict ordering
        if (nextSequence > 1) {
          let retries = 0;
          const maxRetries = 10;
          while (retries < maxRetries) {
            const prevSequenceExists = await transactionalEntityManager
              .createQueryBuilder(Conversation, "conversation")
              .where(
                "conversation.chatId = :chatId AND conversation.sequence = :prevSequence",
                {
                  chatId: this.chat.id,
                  prevSequence: nextSequence - 1,
                }
              )
              .getOne();

            if (prevSequenceExists) {
              break;
            }

            // Wait a bit before trying again
            await new Promise((resolve) => setTimeout(resolve, 100));
            retries++;
          }

          if (retries >= maxRetries) {
            throw new Error(
              `Timeout waiting for previous sequence ${nextSequence - 1}`
            );
          }
        }

        this.sequence = nextSequence;
      }
    );
  }
}
