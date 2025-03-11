import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import connectionRouter from './routes/connectionRouter.js';
import mentorConnectionRouter from './routes/mentorConnectionRouter.js';
import messageRouter from './routes/messageRouter.js';
import skillRouter from './routes/skillsRouter.js';
import userSkillRouter from './routes/userSkillsRouter.js';
import resourceRouter from './routes/resourcesRouter.js';
import storiesRouter from './routes/storiesRouter.js';
import jobsRouter from './routes/jobsRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('uploads'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/connections', connectionRouter);
app.use('/api/mentorconnections', mentorConnectionRouter);
app.use('/api/messages', messageRouter);
app.use('/api/skills', skillRouter);
app.use('/api/userskills', userSkillRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/jobs', jobsRouter);

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message || 'Internal Server Error'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
