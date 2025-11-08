import express from 'express';
import { ask } from '../controllers/assistantController.js';

const router = express.Router();

router.get('/ask', ask);

export default router;