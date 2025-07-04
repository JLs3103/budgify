let previousInputs = {
    income: { amount: '', description: '' },
    expense: { amount: '', description: '' }
};

let sidebarData = {
    income: {},
    expense: {}
};

let totalIncome = 0;
let totalExpense = 0;

let transactions = [];
let editingIndex = null;

let loginWarning = null;
let loginWarningBtn = null;

// ========== UI UTILITY ==========

function togglePopup() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const popup = document.getElementById('popup');

    if (!user) {
        // Show login warning popup with animation
        if (loginWarning) {
            loginWarning.classList.remove('hidden');
            loginWarning.classList.add('show');
        }
        return;
    }

    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) {
        setCurrentDateTime();
        resetCategoryDefault();
    }
}

function toggleAuthPopup() {
    const authPopup = document.getElementById('auth-popup');
    authPopup.classList.toggle('hidden');
    switchAuthTab('login');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
}

function setCurrentDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    const localStr = local.toISOString().slice(0, 16);
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
        input.value = localStr;
    });
}

function resetCategoryDefault() {
    document.querySelectorAll('select').forEach(select => {
        if (!select.value) {
            select.selectedIndex = 0;
        }
    });
}

function switchTab(tab) {
    const incomeForm = document.getElementById('income-form');
    const expenseForm = document.getElementById('expense-form');
    const incomeTab = document.getElementById('income-tab');
    const expenseTab = document.getElementById('expense-tab');

    const fromForm = tab === 'income' ? expenseForm : incomeForm;
    const toForm = tab === 'income' ? incomeForm : expenseForm;

    previousInputs[tab === 'income' ? 'expense' : 'income'].amount =
        fromForm.querySelector('input[name="amount"]').value;
    previousInputs[tab === 'income' ? 'expense' : 'income'].description =
        fromForm.querySelector('input[name="description"]').value;

    toForm.querySelector('input[name="amount"]').value = previousInputs[tab].amount;
    toForm.querySelector('input[name="description"]').value = previousInputs[tab].description;

    incomeForm.classList.toggle('hidden', tab !== 'income');
    expenseForm.classList.toggle('hidden', tab !== 'expense');
    incomeTab.classList.toggle('active', tab === 'income');
    expenseTab.classList.toggle('active', tab === 'expense');

    setCurrentDateTime();
    resetCategoryDefault();
}

// ========== FORMAT ==========

function formatNumber(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function setupAmountInput() {
    const inputs = document.querySelectorAll('input[name="amount"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let raw = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = raw !== '' ? formatNumber(raw) : '';
        });
        input.addEventListener('paste', (e) => {
            const paste = e.clipboardData.getData('text');
            if (/[^0-9]/.test(paste)) e.preventDefault();
        });
    });
}

function cancelForm() {
    document.querySelectorAll('.form-tab input, .form-tab select').forEach(input => input.value = '');
    previousInputs.income = { amount: '', description: '' };
    previousInputs.expense = { amount: '', description: '' };
    togglePopup();
    setCurrentDateTime();
    resetCategoryDefault();
    editingIndex = null;
}

// ========== SIDEBAR & BALANCE ==========

function updateSidebar(type, category, amount) {
    const container = document.getElementById(`${type}-list`);
    if (!sidebarData[type][category]) {
        sidebarData[type][category] = 0;
    }
    sidebarData[type][category] += amount;

    container.innerHTML = '';
    const entries = Object.entries(sidebarData[type]).reverse();
    for (const [cat, total] of entries) {
        const item = document.createElement('div');
        item.className = 'category-item';

        const icon = document.createElement('div');
        icon.className = 'icon';
        icon.style.background = type === 'income' ? '#27ae60' : '#eb5757';

        const text = document.createElement('span');
        const formatted = 'Rp ' + formatNumber(Math.abs(total));
        text.innerHTML = `${cat}<br><small style="color: ${type === 'income' ? '#27ae60' : '#eb5757'}">${type === 'expense' ? '-' : ''}${formatted}</small>`;

        item.appendChild(icon);
        item.appendChild(text);
        container.appendChild(item);
    }
}

function updateBalance() {
    const balance = totalIncome - totalExpense;
    const display = document.getElementById('total-balance');
    display.innerText = (balance < 0 ? '-Rp ' : 'Rp ') + formatNumber(Math.abs(balance));
    display.classList.toggle('negative', balance < 0);
}

// ========== TRANSAKSI ==========

function renderTransactions(transList) {
    const list = document.querySelector('.transaction-list');
    const emptyMessage = document.querySelector('.transaction-empty');
    if (emptyMessage) emptyMessage.remove();
    list.innerHTML = '';

    if (transList.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'transaction-empty';
        empty.innerHTML = `<p>No transactions yet. <strong>Empty</strong>.</p>`;
        list.parentElement.insertBefore(empty, list);
        return;
    }

    transList.forEach((tx, index) => {
        const div = document.createElement('div');
        div.className = 'transaction';
        div.setAttribute('data-index', index);

        const left = document.createElement('div');
        left.className = 'transaction-left';

        const cat = document.createElement('span');
        cat.className = 'transaction-category';
        cat.innerText = tx.category;

        const date = document.createElement('span');
        date.className = 'transaction-date';
        date.innerText = new Date(tx.datetime).toLocaleString();

        left.appendChild(cat);
        left.appendChild(date);

        const center = document.createElement('div');
        center.className = 'transaction-description';
        center.innerText = tx.description;

        const right = document.createElement('div');
        right.className = 'transaction-right';

        const amount = document.createElement('div');
        const formatted = 'Rp ' + formatNumber(tx.amount.toString());
        amount.innerText = tx.type === 'expense' ? '-' + formatted : formatted;
        amount.className = tx.type === 'expense' ? 'transaction-expense' : 'transaction-income';

        const actions = document.createElement('div');
        actions.className = 'transaction-actions';
        actions.innerHTML = `
            <i class="fa-solid fa-pen edit-icon" title="Edit"></i>
            <i class="fa-solid fa-trash delete-icon" title="Delete"></i>
        `;

        right.appendChild(amount);
        right.appendChild(actions);

        div.appendChild(left);
        div.appendChild(center);
        div.appendChild(right);
        list.appendChild(div);
    });
}

function sortTransactions() {
    const dateSort = document.getElementById('filter-date').value;
    const typeSort = document.getElementById('filter-type').value;
    const categorySort = document.getElementById('filter-category').value;

    let sorted = [...transactions];

    if (dateSort === 'date-asc') {
        sorted.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    } else if (dateSort === 'date-desc') {
        sorted.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    }

    if (typeSort === 'income' || typeSort === 'expense') {
        sorted = sorted.filter(tx => tx.type === typeSort);
    }

    if (categorySort === 'az') {
        sorted.sort((a, b) => a.category.localeCompare(b.category));
    } else if (categorySort === 'za') {
        sorted.sort((a, b) => b.category.localeCompare(a.category));
    }

    renderTransactions(sorted);
}

function submitForm(type) {
    const form = document.getElementById(`${type}-form`);
    const datetime = form.querySelector('input[name="datetime"]').value;
    const amountInput = form.querySelector('input[name="amount"]');
    const amountRaw = amountInput.value.replace(/,/g, '');
    const description = form.querySelector('input[name="description"]').value.trim();
    const category = form.querySelector('select').value;

    if (!amountRaw && !description) {
        alert("Please fill in amount and description.");
        return;
    } else if (!amountRaw) {
        alert("Please fill in the amount.");
        return;
    } else if (!description) {
        alert("Please fill in the description.");
        return;
    }

    const amountValue = parseInt(amountRaw, 10);
    if (isNaN(amountValue)) return;

    if (editingIndex !== null) {
        const oldTx = transactions[editingIndex];
        if (oldTx.type === 'income') totalIncome -= oldTx.amount;
        else totalExpense -= oldTx.amount;
        updateSidebar(oldTx.type, oldTx.category, -oldTx.amount);

        if (type === 'income') totalIncome += amountValue;
        else totalExpense += amountValue;
        updateSidebar(type, category, amountValue);

        transactions[editingIndex] = { datetime, amount: amountValue, description, category, type };
        editingIndex = null;
    } else {
        const newTx = { datetime, amount: amountValue, description, category, type };
        transactions.push(newTx);

        if (type === 'income') totalIncome += amountValue;
        else totalExpense += amountValue;
        updateSidebar(type, category, amountValue);
    }

    updateBalance();
    cancelForm();
    sortTransactions();
}

// ========== AUTH ==========

function registerUser() {
    const fullName = document.querySelector('#register-form input[name="fullname"]').value.trim();
    const username = document.querySelector('#register-form input[name="username"]').value.trim();
    const email = document.querySelector('#register-form input[name="email"]').value.trim();
    const password = document.querySelector('#register-form input[name="password"]').value;
    const confirmPassword = document.querySelector('#register-form input[name="confirm_password"]').value;

    if (!fullName || !username || !email || !password || !confirmPassword) {
        alert('Please fill all fields.');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, username, email, password, confirm_password: confirmPassword })
    })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 201) {
                alert('Registration successful! Please login.');
                switchAuthTab('login');
            } else {
                alert(body.message || 'Registration failed.');
            }
        })
        .catch(() => alert('Error registering user.'));
}

function loginUser() {
    const email = document.querySelector('#login-form input[name="email"]').value.trim();
    const password = document.querySelector('#login-form input[name="password"]').value;

    if (!email || !password) {
        alert('Please enter email and password.');
        return;
    }

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200) {
                localStorage.setItem('loggedInUser', JSON.stringify(body.user));
                alert(`Welcome, ${body.user.full_name}!`);
                toggleAuthPopup();
                updateAuthUI();
            } else {
                alert(body.message || 'Login failed.');
            }
        })
        .catch(() => alert('Error during login.'));
}

function logoutUser() {
    localStorage.removeItem('loggedInUser');
    updateAuthUI();
}

function updateAuthUI() {
    const authBtn = document.getElementById('login-register-btn');
    const greeting = document.getElementById('greeting-container');
    const greetingText = document.getElementById('greeting-text');

    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (user) {
        greeting.classList.remove('hidden');
        greetingText.innerText = `Hello, ${user.full_name}`;
        authBtn.innerText = 'Logout';
        authBtn.onclick = logoutUser;
    } else {
        greeting.classList.add('hidden');
        authBtn.innerText = 'Login/Register';
        authBtn.onclick = toggleAuthPopup;
    }
}

function hideLoginWarning() {
    if (loginWarning) {
        loginWarning.classList.remove('show');
        loginWarning.classList.add('hide');
        setTimeout(() => {
            loginWarning.classList.add('hidden');
            loginWarning.classList.remove('hide');
        }, 300);
    }
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    setupAmountInput();
    updateAuthUI();

    loginWarning = document.getElementById('login-warning');
    loginWarningBtn = document.getElementById('login-warning-ok');

    document.querySelector('#income-form .submit-btn').addEventListener('click', () => submitForm('income'));
    document.querySelector('#expense-form .submit-btn').addEventListener('click', () => submitForm('expense'));
    document.querySelector('#register-form .submit-btn').addEventListener('click', registerUser);
    document.querySelector('#login-form .submit-btn').addEventListener('click', loginUser);

    document.querySelector('.transaction-list').addEventListener('click', (e) => {
        const parent = e.target.closest('.transaction');
        const index = parseInt(parent?.getAttribute('data-index'));

        if (e.target.classList.contains('delete-icon')) {
            const removed = transactions.splice(index, 1)[0];
            if (removed.type === 'income') totalIncome -= removed.amount;
            else totalExpense -= removed.amount;
            updateSidebar(removed.type, removed.category, -removed.amount);
            updateBalance();
            sortTransactions();
        }

        if (e.target.classList.contains('edit-icon')) {
            const tx = transactions[index];
            editingIndex = index;

            togglePopup();
            switchTab(tx.type);

            const form = document.getElementById(`${tx.type}-form`);
            form.querySelector('input[name="datetime"]').value = new Date(tx.datetime).toISOString().slice(0, 16);
            form.querySelector('input[name="amount"]').value = formatNumber(tx.amount.toString());
            form.querySelector('input[name="description"]').value = tx.description;
            form.querySelector('select').value = tx.category;
        }
    });

    if (loginWarningBtn) {
        loginWarningBtn.addEventListener('click', () => {
            if (loginWarning) {
                loginWarning.classList.remove('show');
                loginWarning.classList.add('hide');
                setTimeout(() => {
                    loginWarning.classList.add('hidden');
                    loginWarning.classList.remove('hide');
                }, 300);
            }
        });
    }
});