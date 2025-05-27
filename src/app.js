import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOptions, limiter } from './constants/config.js';

const app = express();

app.use(morgan('dev'));
app.use(cors(corsOptions));

app.use(limiter);

app.use(helmet());

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the SocioFeed Backend');
});

export default app;
