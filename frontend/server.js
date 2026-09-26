const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function forward(req, res, endpoint, options = {}) {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const data = await response.json();
            return res.status(response.status).json(data);
        }

        const text = await response.text();
        return res.status(response.status).send(text);
    } catch (error) {
        console.error("Backend connection error:", error.message);
        return res.status(502).json({
            error: "Backend is unavailable",
            details: error.message
        });
    }
}

app.get("/api/todos", (req, res) => {
    return forward(req, res, "/api/todos");
});

app.post("/api/todos", (req, res) => {
    return forward(req, res, "/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
    });
});

app.put("/api/todos/:id", (req, res) => {
    return forward(req, res, `/api/todos/${req.params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
    });
});

app.delete("/api/todos/:id", (req, res) => {
    return forward(req, res, `/api/todos/${req.params.id}`, {
        method: "DELETE"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend running on port ${PORT}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
});
