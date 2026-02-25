// server.js - pronto para Render
const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();
const db = new Database("database.db");

// Configurações
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // necessário para DELETE
app.use(express.static("public"));

app.use(session({
    secret: "papelaria_secreta",
    resave: false,
    saveUninitialized: false
}));

// Criar tabela de produtos
db.prepare(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price TEXT,
    image TEXT
)
`).run();

// Upload de imagens
const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin fixo
const adminEmail = "anavitoria@papelaria.com";
const adminPassword = bcrypt.hashSync("Ana@2008", 10);

// Middleware de autenticação
function isAuth(req, res, next) {
    if (req.session.logged) return next();
    res.status(401).json({ error: "Não autorizado" });
}

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if(email === adminEmail && bcrypt.compareSync(password, adminPassword)){
        req.session.logged = true;
        return res.json({ success: true });
    }

    res.status(401).json({ error: "Login inválido" });
});

// Adicionar produto
app.post("/add-product", isAuth, upload.single("image"), (req, res) => {
    const { title, price } = req.body;
    const image = req.file.filename;

    db.prepare(`
        INSERT INTO products (title, price, image)
        VALUES (?, ?, ?)
    `).run(title, price, image);

    res.json({ success: true });
});

// Listar produtos
app.get("/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
});

// Deletar produto
app.delete("/delete-product/:id", isAuth, (req, res) => {
    const id = req.params.id;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
});

// Porta dinâmica do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
