const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();
const db = new Database("database.db");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "papelaria_secreta",
    resave: false,
    saveUninitialized: false
}));

// Criar tabela
db.prepare(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price TEXT,
    image TEXT
)
`).run();

// Upload
const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin fixo
const adminEmail = "admin@papelaria.com";
const adminPassword = bcrypt.hashSync("123456", 10);

function isAuth(req, res, next) {
    if (req.session.logged) return next();
    res.redirect("/login.html");
}

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email === adminEmail && bcrypt.compareSync(password, adminPassword)) {
        req.session.logged = true;
        return res.redirect("/admin.html");
    }

    res.send("Login inválido");
});

app.post("/add-product", isAuth, upload.single("image"), (req, res) => {
    const { title, price } = req.body;
    const image = req.file.filename;

    db.prepare(`
        INSERT INTO products (title, price, image)
        VALUES (?, ?, ?)
    `).run(title, price, image);

    res.redirect("/admin.html");
});

app.get("/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
