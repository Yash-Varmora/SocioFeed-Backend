import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOptions, limiter } from './constants/config.js';
import { CustomError, errResponse, sendResponse } from './helpers/response.js';
import indexRoute from './routes/index.js';

const app = express();

app.use(morgan('dev'));
app.use(cors(corsOptions));

app.use(limiter);

app.use(helmet());

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  return sendResponse(res, 200, 'SUCCESS', 'Backend is running');
});

app.use('/api', indexRoute);

app.use((req, res, next) => {
  next(new CustomError(404, 'Not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  errResponse(err, req, res);
});

export default app;
