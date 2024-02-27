const pg = require("pg");
const express = require("express");
const app = express();
const morgan = require("morgan");

app.use(express.json());
app.use(require("morgan")("dev"));

const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/acme_icecream_shop"
);

async function init() {
    try {
        await client.connect();
        console.log("Connected to database!");

        let SQL = `
        DROP TABLE IF EXISTS icecreamshop;
          CREATE TABLE icecreamshop(
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          name VARCHAR(255),
          is_favorite BOOLEAN DEFAULT FALSE
         );
        `;
        await client.query(SQL);

        console.log("tables created 📊");

        SQL = `
        INSERT INTO icecreamshop (name, is_favorite) VALUES 
            ('ChocoMocha', false),
            ('Vanilla', true),
            ('Cheesecake Swirl', false),
            ('Caramel Cookie Crums', false),
            ('Rum Raisin', true),
            ('Coffee Beans', false);
        `;

        await client.query(SQL);

        console.log("Data Seeded ✅");

        // Listening on a port
        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Listening on port ${port}`));
    } catch (error) {
        console.error(error);
    }
}

// Routes
app.get("/api/flavors", async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM icecreamshop;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.post("/api/flavors", async (req, res, next) => {
    try {
        //  Define the SQL query with interpolation // Using the COALESCE() function in SQL to provide a default value if the input value is NULL
        const SQL = `INSERT INTO icecreamshop(name, is_favorite) VALUES($1, COALESCE($2, false)) RETURNING *`;

        // Execute the SQL query with the value from req.body.name
        const response = await client.query(SQL, [
            req.body.name,
            req.body.is_favorite,
        ]);

        // Send the inserted record as the response
        res.send(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.put("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `
        UPDATE icecreamshop
        SET name=$1, is_favorite=$2, updated_at=now()
        WHERE id=$3
        RETURNING *;
        `;
        // Execute the SQL query with value from req.body and req.params
        const response = await client.query(SQL, [
            req.body.name,
            req.body.is_favorite,
            req.params.id,
        ]);
        // Sending the updated records as the response
        res.send(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.delete("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM icecreamshop
        WHERE id=$1;
        `;
        // EXecute the SQL query with value from req.params
        await client.query(SQL, [req.params.id]);

        // Send a success status code indicating that the item was deleted
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

init();

// npm run start:dev
