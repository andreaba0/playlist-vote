import express from "express";

const app = express();
const port = 3001;

app.get('/api-service', (req: Request, res: Response) => {
    res.send('Hello World');
})

app.listen(port, () => {
    console.log(`Server is listening on ${port}`)
})