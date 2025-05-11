import express from "express";
import dotenv from "dotenv";
import isLoggedIn from "../middleware/isLoggedIn";
import chatController from "../controllers/chatbot/chatController";
import conversationController from "../controllers/chatbot/conversationController";
const router = express.Router();

router.post("/create", isLoggedIn, (req, res, next) => {
  chatController.createChat(req, res, next);
});
router.get("/list-all-chats", isLoggedIn, (req, res, next) => {
  chatController.getAllChats(req, res);
});
router.patch("/rename-chat/:id", isLoggedIn, (req, res, next) => {
  chatController.renameChat(req, res);
});
router.delete("/delete-chat/:id", isLoggedIn, (req, res, next) => {
  chatController.deleteChat(req, res);
});

router.get("/get-conversation/:chatId", isLoggedIn, (req, res, next) => {
  conversationController.getRecentConversations(req, res, next);
});

module.exports = router;
