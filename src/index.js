import { Pool } from "pg";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "../swagger.json" with { type: "json" };
import "dotenv/config";

const app = express();
const port = 3000;
const DB_URL = process.env.DATABASE_URL

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

const pool = new Pool({
    connectionString: DB_URL,
});

const client = await pool.connect();

const createTable = `
    CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE
    );
`;

await client.query(createTable);

let tasks = [
        { title: "study", done: false },
        { title: "work on project", done: true },
        { title: "code", done: false },
]

const rows = await client.query("SELECT * from tasks");

if (rows.rowCount === 0) {
    const query = "INSERT INTO tasks(title, done) VALUES($1, $2)";
    
    for (const task of tasks) {
        await client.query(query, [task.title, task.done]); 
    }
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

// app.get('/tasks', (req, res) => {
//     const fetchedTasks = db.prepare("SELECT * from tasks").all(); // Commented only for documentation
    
//     res.status(200).send(fetchedTasks); 
// });

// A2 Extra feature

app.get('/tasks', (req, res) => {    
    const title = req.query.title?.trim().toLowerCase();
    const done = req.query.done ?? undefined;
    
    const conditions = [];
    const params = [];

    if (title) {
        conditions.push("title like ?");
        params.push(title);
    }

    if (done !== undefined) {
        conditions.push("done = ?");
        params.push(done);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : ""

    const result = db.prepare(`SELECT * FROM tasks ${where}`).all(...params);

    res.status(200).send(result);
});

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

client.release();