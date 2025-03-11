import express from 'express';
import { addSkill, deleteSkill, getSkill, getAllSkills } from '../controllers/skillsController.js';

const router = express.Router();

router.post('/add', addSkill);
router.delete('/delete/:skillId', deleteSkill);
router.get('/get/:skillId', getSkill);
router.get('/all', getAllSkills);

export default router;
