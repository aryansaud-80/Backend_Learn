import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthcheckRouter from './routes/healthcheck.routes.js';
import userRouter from './routes/users.routes.js';

dotenv.config({ path: './.env' });

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/users', userRouter);

export default app;
