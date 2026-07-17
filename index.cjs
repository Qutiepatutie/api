const express = require('express');
const app = express();
const port = 3000;

const tasks = [
        {
            id: 1,
            title: "study",
            done: false,
        },
        {
            id: 2,
            title: "work on project",
            done: true,
        },
        {
            id: 3,
            title: "code",
            done: false,
        }
]

app.get('/', (req, res) => {
    res.send({
        name: "Task API",
        version: "1.0",
        endpoints: ["/tasks"]
    });
});

app.get('/health', (req, res) => {
    res.send({
        status: "ok"
    });
});

app.get('/tasks', (req, res) => {
    res.send(tasks);
});

app.get('/tasks/:id', (req, res) => {

    const task = tasks.find(item => item.id === Number(req.params.id));
    
    if (!task) {
        return res.send({error: `Task ${req.params.id} was not found`});
    }

    res.send(task);
});

app.listen(port, () => {
    console.log(`App is listening to ${port}`);
});
