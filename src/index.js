import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "../swagger.json" with { type: "json" };

import Database from "better-sqlite3";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

const db = new Database("tasks.db");
db.pragma("journal_mode = WAL");
const createTable = `
    CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        done INTEGER default 0
    );
`;

db.exec(createTable);

let tasks = [
        { title: "study", done: 0 },
        { title: "work on project", done: 1 },
        { title: "code", done: 0 },
]

const rows = db.prepare("SELECT COUNT(*) as count FROM tasks;").get();

if (rows.count === 0) {
    const insertInit = db.prepare("INSERT INTO tasks(title, done) VALUES(?, ?)");

    tasks.forEach((task) => {
        insertInit.run(task.title, task.done);
    });
}

// STAGE 1

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

// STAGE 2 // A2 STAGE 0

app.get('/tasks', (req, res) => {
    const fetchedTasks = db.prepare("SELECT * from tasks").all();
    
    res.status(200).send(fetchedTasks); 
});

// Extra feature

// app.get('/tasks', (req, res) => {    
//     const title = req.query.title?.trim().toLowerCase();
//     const done = req.query.done?.trim().toLowerCase();

//     let result = tasks;

//     if (title) {
//         result = result.filter(task => { 
//             if (task.title.toLowerCase().includes(title)) {
//                 return task;
//             }
//         });
//     }

//     if (done) {
//         result = result.filter(task => { 
//             if (String(task.done) === done) {
//                 return task;
//             }
//         });
//     }

//     res.status(200).send(result);
// });

app.get('/tasks/:id', (req, res) => {

    const id = req.params.id;

    const fetchedTask = db.prepare("SELECT * from tasks WHERE id = ?").get(id);
    
    if (fetchedTask.length === 0) {
        return res.status(404).send({
            error: `Task ${id} not found`
        });
    }

    res.status(200).send(fetchedTask);
});

// STAGE 3 // A2 STAGE 2

app.post('/tasks', (req, res) => {
    const title = req.body.title?.trim();

    if (!title) {
        return res.status(400).send({
            error: "Title should not be empty"
        });
    }

    db.prepare("INSERT INTO tasks (title) VALUES (?)").run(title);
    const task = db.prepare(`SELECT * FROM tasks ORDER BY id DESC LIMIT 1`).get();
    
    res.status(201).send(task);
});

// STAGE 4 // A2 STAGE 3

app.put('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    const { title, done } = req.body;
    
    console.log(Object.values(req.body));
    
    const tasks = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    
    if (!tasks) {
        return res.status(404).send();
    }

    if (Object.keys(req.body).length === 0) {
        return res.status(400).send();
    }

    let query = "";
    
    if (title && done != undefined) {
        query = "title = ?, done = ?";
        
    } else if (title) {
        query = "title = ?";
        
    } else if (done != undefined) {
        query = "done = ?"
        
    }

    db.prepare(`UPDATE tasks SET ${query} WHERE id = ?`).run(...Object.values(req.body),id);
    const updatedTask = db.prepare("SELECT * from tasks WHERE id = ?").get(id);

    res.status(200).send(updatedTask);
})

app.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    
    const tasks = db.prepare("SELECT * FROM tasks").all();
    
    if (!tasks.find(task => task.id === id)) {
        return res.status(404).send();
    }

    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

    res.status(204).send();
})

app.listen(port, () => {
    console.log(`App is listening to ${port}`);
});