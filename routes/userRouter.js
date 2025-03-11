import express from 'express';
import { getProfileById, updateProfile, deleteProfile,getProfiles } from '../controllers/userController.js';
 
const router = express.Router();

router.get('/:userId', getProfileById);
router.put('/:userId',  updateProfile);
router.delete('/:userId', deleteProfile);
router.get('/',getProfiles)

export default router;
