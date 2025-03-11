import express from 'express';
import { getMyRequests,sendMentorConnection, decideMentorConnection, getMentorConnections, myMentorsByUserId,getMentorsByUserId } from '../controllers/mentorConnectionController.js';

const router = express.Router();

router.post('/send', sendMentorConnection);
router.post('/decide', decideMentorConnection);
router.get('/connections/:mentorId', getMentorConnections);
router.get('/myMentors/:userId', myMentorsByUserId);
router.get('/myRequests/:mentorId', getMyRequests);  
router.get("/mentors/:userId",getMentorsByUserId)
export default router;
