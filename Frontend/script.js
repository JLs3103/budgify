const backendURL = 'http://localhost:5000/api/tasks';

function fetchTasks() {
    fetch(backendURL)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('taskList');
        list.innerHTML = '';
        data.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        const delBtn = document.createElement('button');
        delBtn.textContent = '❌';
        delBtn.onclick = () => deleteTask(task.id);
        li.appendChild(delBtn);
        list.appendChild(li);
        });
    });
}

function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;
    fetch(backendURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
    }).then(() => {
    input.value = '';
    fetchTasks();
    });
}

function deleteTask(id) {
    fetch(`${backendURL}/${id}`, { method: 'DELETE' })
    .then(() => fetchTasks());
}

document.addEventListener('DOMContentLoaded', fetchTasks);