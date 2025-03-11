import express from 'express';
import { sendConnection, decideConnection, removeConnection, getConnections, getRequests } from '../controllers/connectionController.js';

const router = express.Router();

router.post('/send', sendConnection);
router.post('/decide', decideConnection);
router.delete('/:connectionId', removeConnection);
router.get('/:userId', getConnections);
router.get('/requests/:userId', getRequests);  

export default router;
