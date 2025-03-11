import express from 'express';
import { getMessagesBetweenUsers, sendMessage, getMessage, deleteMessage, getMessagesByUser } from '../controllers/messageController.js';

const messageRouter = express.Router();

messageRouter.post('/send', sendMessage);
messageRouter.get('/:messageId', getMessage);
messageRouter.delete('/:messageId', deleteMessage);
messageRouter.get('/user/:userId', getMessagesByUser);
messageRouter.get('/user/:userId/receiver/:receiverId', getMessagesBetweenUsers);

export default messageRouter;
