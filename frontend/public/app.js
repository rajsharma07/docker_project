const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const summary = document.getElementById("summary");
const message = document.getElementById("message");
const clearCompleted = document.getElementById("clearCompleted");

function showError(text) {
    message.textContent = text;
    message.classList.remove("hidden");
}

function clearError() {
    message.textContent = "";
    message.classList.add("hidden");
}

async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

function renderTodos(todos) {
    todoList.innerHTML = "";

    const completedCount = todos.filter(todo => todo.completed === 1).length;
    summary.textContent =
        `${todos.length} ${todos.length === 1 ? "task" : "tasks"} · ${completedCount} completed`;

    emptyState.classList.toggle("hidden", todos.length !== 0);

    todos.forEach(todo => {
        const li = document.createElement("li");
        li.className = `todo ${todo.completed ? "completed" : ""}`;

        const left = document.createElement("div");
        left.className = "todo-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed === 1;
        checkbox.setAttribute("aria-label", `Complete ${todo.title}`);

        checkbox.addEventListener("change", async () => {
            try {
                clearError();
                await api(`/api/todos/${todo.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ completed: checkbox.checked })
                });
                await loadTodos();
            } catch (error) {
                checkbox.checked = !checkbox.checked;
                showError(error.message);
            }
        });

        const title = document.createElement("span");
        title.className = "todo-title";
        title.textContent = todo.title;

        left.appendChild(checkbox);
        left.appendChild(title);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            try {
                clearError();
                await api(`/api/todos/${todo.id}`, { method: "DELETE" });
                await loadTodos();
            } catch (error) {
                showError(error.message);
            }
        });

        li.appendChild(left);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
    });
}

async function loadTodos() {
    try {
        const todos = await api("/api/todos");
        renderTodos(todos);
    } catch (error) {
        showError(`Cannot load todos: ${error.message}`);
    }
}

todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = todoInput.value.trim();

    if (!title) {
        return;
    }

    try {
        clearError();

        await api("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
        });

        todoInput.value = "";
        todoInput.focus();

        await loadTodos();
    } catch (error) {
        showError(error.message);
    }
});

clearCompleted.addEventListener("click", async () => {
    try {
        clearError();

        const todos = await api("/api/todos");
        const completed = todos.filter(todo => todo.completed === 1);

        await Promise.all(
            completed.map(todo =>
                api(`/api/todos/${todo.id}`, { method: "DELETE" })
            )
        );

        await loadTodos();
    } catch (error) {
        showError(error.message);
    }
});

loadTodos();
