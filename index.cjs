const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let tasks = [
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
    res.status(200).send({
        name: "Task API",
        version: "1.0",
        endpoints: ["/tasks"]
    });
});

app.get('/health', (req, res) => {
    res.status(200).send({
        status: "ok"
    });
});

app.get('/tasks', (req, res) => {
    res.status(200).send(tasks);
});

app.get('/tasks/:id', (req, res) => {

    const task = tasks.find(item => item.id === Number(req.params.id));
    
    if (!task) {
        return res.status(400).send({error: `Task ${req.params.id} was not found`});
    }

    res.send(task);
});

app.post('/tasks', (req, res) => {
    const title = req.body.title?.trim();

    if (!title) {
        return res.status(400).send({
            error: "Title should not be empty"
        });
    }
    const newTask = {
        id: tasks.length + 1,
        title: title,
        done: false
    }

    tasks.push(newTask);
    
    res.status(201).send(`Created: ${JSON.stringify(newTask)}`);
})

app.listen(port, () => {
    console.log(`App is listening to ${port}`);
});