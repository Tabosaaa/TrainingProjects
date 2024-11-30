import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import mongoose from 'mongoose';
import rootRouter from './router/index';


const app = express();

const port = 8080;

app.use(cors({
    credentials: true
}))

app.use(bodyParser.json());
app.use(compression());
app.use(cookieParser());    


const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/`);
});

const MONGO_URL =`mongodb+srv://tabosalucas2011:lucas@tabosaaa.89hnb.mongodb.net/?retryWrites=true&w=majority&appName=tabosaaa`

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (error: Error) =>  console.log(error));

app.use('/', rootRouter)