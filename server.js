require("dotenv").config();

const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from departments
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2, updated_at= now()
      WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
      DELETE from employees
      WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  await client.connect();
  let SQL = /* sql*/ `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY, 
        name VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  
`;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql*/ `
    INSERT INTO departments(name) VALUES('HR');
    INSERT INTO departments(name) VALUES('Tech');
    INSERT INTO departments(name) VALUES('Hardware');
    INSERT INTO employees(name, department_id) VALUES('Mario', (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Thomas', (SELECT id FROM departments WHERE name='Tech'));
    INSERT INTO employees(name, department_id) VALUES('Torie', (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Noel', (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Nina', (SELECT id FROM departments WHERE name='Hardware'));
  
  `;
  await client.query(SQL);
  const port = process.env.PORT;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
