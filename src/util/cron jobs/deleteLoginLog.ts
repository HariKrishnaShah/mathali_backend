// deleteLoginLogsCron.ts
import cron from "node-cron";
import { LoginLog } from "../../entities/user/LoginLog";
import { AppDataSource } from "../../config/database";
export function scheduleLoginLogDeletion() {
  const loginLogRepo = AppDataSource.getRepository(LoginLog);
  // Schedule the cron job for midnight every day
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running daily login tokens revokation task...");
      await loginLogRepo.update({ revoked: false }, { revoked: true });
      console.log("All login tokens revoked successfully.");
    } catch (error) {
      console.error("Error revoking login tokens:", error);
    }
  });
}
