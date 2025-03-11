import express from 'express';
import {
  addResource,
  updateResource,
  deleteResource,
  getResourcesBySkill,
  getMyResources,
  getResource,
  getAllResources,
} from '../controllers/resourcesController.js';

const resourceRouter = express.Router();

resourceRouter.post('/add', addResource);
resourceRouter.put('/update/:resource_id', updateResource);
resourceRouter.delete('/delete/:resource_id', deleteResource);
resourceRouter.get('/skill/:skill_id', getResourcesBySkill);
resourceRouter.get('/mentor/:mentor_id', getMyResources);
resourceRouter.get('/:resource_id', getResource);
resourceRouter.get('/', getAllResources);

export default resourceRouter;
