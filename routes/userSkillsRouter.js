import express from 'express';
import { addSkill, deleteSkill, getSkills } from '../controllers/userSkillsController.js';

const router = express.Router();

router.post('/assign', addSkill);
router.delete('/remove/:userId/:skillId', deleteSkill);
router.get('/fetch/:userId', getSkills);

export default router;
