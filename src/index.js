import { Pool } from "pg";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "../swagger.json" with { type: "json" };
import "dotenv/config";

const app = express();
const port = process.env.PORT;
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

const clientRes = await pool.query("SELECT * from tasks");

if (clientRes.rowCount === 0) {
    const query = "INSERT INTO tasks(title, done) VALUES($1, $2)";
    
    for (const task of tasks) {
        await pool.query(query, [task.title, task.done]); 
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

// STAGE 2 // A2 STAGE 0 // A3 Stage 2

app.get('/tasks', async (req, res) => {
    const tasks = await pool.query("SELECT * FROM tasks");
    
    res.status(200).send(tasks.rows); 
});

// A2 Extra feature

// app.get('/tasks', (req, res) => {    
//     const title = req.query.title?.trim().toLowerCase();
//     const done = req.query.done ?? undefined;
    
//     const conditions = [];
//     const params = [];

//     if (title) {
//         conditions.push("title like ?");
//         params.push(title);
//     }

//     if (done !== undefined) {
//         conditions.push("done = ?");
//         params.push(done);
//     }

//     const where = conditions.length
//         ? `WHERE ${conditions.join(" AND ")}`
//         : ""

//     const result = db.prepare(`SELECT * FROM tasks ${where}`).all(...params);

//     res.status(200).send(result);
// });

app.get('/tasks/:id', async (req, res) => {
    const id = req.params.id;

    const query = "SELECT * from tasks WHERE id = $1";

    const fetchedTask = await pool.query(query, [id]);
    
    if (fetchedTask.rowCount === 0) {
        return res.status(404).send({
            error: `Task ${id} not found`
        });
    }

    res.status(200).send(fetchedTask.rows[0]);
});

// STAGE 3 // A2 STAGE 2 // A3 STAGE 3

app.post('/tasks', async (req, res) => {
    const title = req.body.title?.trim();

    if (!title) {
        return res.status(400).send({
            error: "Title should not be empty"
        });
    }

    const query = "INSERT INTO tasks (title) VALUES ($1) RETURNING *";
    const newTask = await pool.query(query, [title]);
    
    res.status(201).send(newTask.rows[0]);
});

// STAGE 4 // A2 STAGE 3 // A3 Stage 3

app.put('/tasks/:id', async (req, res) => {
    const id = Number(req.params.id);

    const getTask = "SELECT * FROM tasks WHERE id = $1";
    const task = await pool.query(getTask, [id]);
    
    if (task.rowCount === 0) {
        return res.status(404).send();
    }
    
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send();
    }
    
    const { title, done } = req.body;
    const params = [];
    const values = [];
    
    if (title) {
        params.push(`title = $${params.length+1}`);
        values.push(title);
    }    
    
    if (done !== undefined) {
        params.push(`done = $${params.length+1}`);
        values.push(done);
    }

    const where = params.length
        ? params.join(", ")
        : "";
    
    const query = `UPDATE tasks SET ${where} WHERE id = $${params.length + 1} RETURNING *`;
    const updatedTask = await pool.query(query, [...values,id]);

    res.status(200).send(updatedTask.rows[0]);
})

app.delete('/tasks/:id', async (req, res) => {
    const id = Number(req.params.id);
    
    const getTask = "SELECT * FROM tasks WHERE id = $1";
    const task = await pool.query(getTask, [id]);
    
    if (task.rowCount === 0) {
        return res.status(404).send();
    }

    const deleteTask = "DELETE FROM tasks WHERE id = $1";
    await pool.query(deleteTask, [id]);

    res.status(204).send();
})

app.listen(port, () => {
    console.log(`App is listening to ${port}`);
});