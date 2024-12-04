import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';;
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rootRouter from './routes/index';

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


app.use('/', rootRouter)