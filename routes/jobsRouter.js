import express from 'express';
import { getJobsById, getJobsBasedOnQuery, getJobsBasedOnSkill } from '../controllers/jobsController.js';

const router = express.Router();

router.get('/user/:userId', getJobsById);
router.post('/query', getJobsBasedOnQuery);
router.get('/skill/:skillName', getJobsBasedOnSkill);

export default router;
