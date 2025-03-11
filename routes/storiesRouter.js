import express from 'express';
import { addStory, updateStory, deleteStory, getStory, getStoriesByUser, getAllStories } from '../controllers/storiesController.js';
import upload from '../middleware/multerConfig.js';

const router = express.Router();

router.get('/:story_id', getStory);
router.get('/', getAllStories);
router.get('/user/:author_id', getStoriesByUser);
router.post('/', upload.single('thumbnail'), addStory);
router.put('/:story_id', upload.single('thumbnail'), updateStory);
router.delete('/:story_id', deleteStory);

export default router;
