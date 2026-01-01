// --- Constants & Data ---
const QUIZ_QUESTIONS = [
    { "question": "What is the name of Harry Potter's owl?", "options": ["Hedwig", "Crookshanks", "Scabbers", "Errol"], "answer": "Hedwig" },
    { "question": "Who is the headmaster of Hogwarts?", "options": ["Dumbledore", "Snape", "McGonagall", "Voldemort"], "answer": "Dumbledore" },
    { "question": "What house is Draco Malfoy in?", "options": ["Slytherin", "Gryffindor", "Ravenclaw", "Hufflepuff"], "answer": "Slytherin" },
    { "question": "What platform do you catch the Hogwarts Express from?", "options": ["9 3/4", "7 1/2", "10", "8 3/4"], "answer": "9 3/4" },
    { "question": "Who teaches Transfiguration?", "options": ["McGonagall", "Flitwick", "Sprout", "Snape"], "answer": "McGonagall" },
    { "question": "What is the spell to disarm an opponent?", "options": ["Expelliarmus", "Stupefy", "Lumos", "Avada Kedavra"], "answer": "Expelliarmus" },
    { "question": "Who is Harry's godfather?", "options": ["Sirius Black", "Remus Lupin", "Hagrid", "Dumbledore"], "answer": "Sirius Black" },
    { "question": "What is the name of the Weasley's house?", "options": ["The Burrow", "Shell Cottage", "Grimmauld Place", "Hogwarts"], "answer": "The Burrow" },
    { "question": "Who killed Dumbledore?", "options": ["Snape", "Voldemort", "Draco", "Bellatrix"], "answer": "Snape" },
    { "question": "What is the name of the wizarding bank?", "options": ["Gringotts", "Leaky Cauldron", "Ollivanders", "Honeydukes"], "answer": "Gringotts" },
    { "question": "What is the core of Harry's wand?", "options": ["Phoenix Feather", "Dragon Heartstring", "Unicorn Hair", "Veela Hair"], "answer": "Phoenix Feather" },
    { "question": "Who is the half-blood prince?", "options": ["Severus Snape", "Harry Potter", "Tom Riddle", "Albus Dumbledore"], "answer": "Severus Snape" },
    { "question": "What is Hermione's patronus?", "options": ["Otter", "Doe", "Stag", "Cat"], "answer": "Otter" },
    { "question": "What animal can McGonagall turn into?", "options": ["Cat", "Owl", "Doe", "Stag"], "answer": "Cat" },
    { "question": "What is the name of the three-headed dog?", "options": ["Fluffy", "Fang", "Norbert", "Buckbeak"], "answer": "Fluffy" },
    { "question": "Who is the Seeker for the Bulgarian Quidditch team?", "options": ["Viktor Krum", "Cedric Diggory", "Fleur Delacour", "Harry Potter"], "answer": "Viktor Krum" },
    { "question": "What is the name of the potion that allows someone to change their appearance?", "options": ["Polyjuice Potion", "Veritaserum", "Amortentia", "Felix Felicis"], "answer": "Polyjuice Potion" },
    { "question": "What does the 'Imperio' curse do?", "options": ["Controls the victim", "Kills the victim", "Tortures the victim", "Erases memory"], "answer": "Controls the victim" },
    { "question": "Who is the author of 'Fantastic Beasts and Where to Find Them'?", "options": ["Newt Scamander", "Gilderoy Lockhart", "Bathilda Bagshot", "Quirinus Quirrell"], "answer": "Newt Scamander" },
    { "question": "What is the name of the school Harry attends?", "options": ["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"], "answer": "Hogwarts" }
];

// --- State Management ---
// We store 'hp_users' as an array of objects: { name, house, points }
// We store 'hp_current_user_name' as the key to the current active profile
let state = {
    currentUser: null,
    allUsers: JSON.parse(localStorage.getItem('hp_users')) || [],
    alarmTime: localStorage.getItem('hp_alarm_time') || null,
    currentQuiz: null,
    isAlarmActive: false
};

// --- DOM Elements ---
const sections = {
    house: document.getElementById('section-house'),
    dashboard: document.getElementById('section-dashboard'),
    quiz: document.getElementById('section-quiz'),
    results: document.getElementById('section-results'),
    leaderboard: document.getElementById('section-leaderboard')
};

const audio = document.getElementById('alarm-audio');

// --- Initialization ---
function init() {
    const savedName = localStorage.getItem('hp_current_user_name');
    if (savedName) {
        state.currentUser = state.allUsers.find(u => u.name === savedName);
    }

    if (!state.currentUser) {
        showSection('house');
    } else {
        showSection('dashboard');
        updateDashboard();
    }

    startAlarmPoller();
}

function showSection(name) {
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections[name].classList.remove('hidden');
}

// --- House Selection / "Login" ---
document.getElementById('house-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name-input').value.trim();
    const house = document.getElementById('house-select').value;

    if (!name) return;

    // Check if user already exists
    let user = state.allUsers.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (user) {
        // Just update house if they picked a different one (sorting hat is flexible)
        user.house = house;
    } else {
        // Create new student
        user = { name: name, house: house, points: 0 };
        state.allUsers.push(user);
    }

    state.currentUser = user;
    localStorage.setItem('hp_current_user_name', user.name);
    localStorage.setItem('hp_users', JSON.stringify(state.allUsers));

    showSection('dashboard');
    updateDashboard();
});

// --- Dashboard ---
function updateDashboard() {
    const user = state.currentUser;
    document.getElementById('user-info').textContent = `${user.name} of House ${user.house}`;
    document.getElementById('user-info').className = `cinzel ${user.house.toLowerCase()}`;

    // Summary of house counts
    const summaryCont = document.getElementById('dashboard-members-summary');
    const counts = { Gryffindor: 0, Slytherin: 0, Ravenclaw: 0, Hufflepuff: 0 };
    state.allUsers.forEach(u => counts[u.house]++);

    summaryCont.innerHTML = '<strong>Hogwarts Directory:</strong><br>';
    Object.entries(counts).forEach(([h, count]) => {
        if (count > 0) {
            summaryCont.innerHTML += `<span class="${h.toLowerCase()}">${h}</span>: ${count} student(s) `;
        }
    });

    const status = document.getElementById('alarm-status');
    if (state.alarmTime) {
        status.textContent = `⏰ Alarm set for ${state.alarmTime}`;
    } else {
        status.textContent = "No alarm set";
    }
}

document.getElementById('alarm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const time = document.getElementById('alarm-time-input').value;
    state.alarmTime = time;
    localStorage.setItem('hp_alarm_time', time);
    updateDashboard();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('hp_current_user_name');
    state.currentUser = null;
    showSection('house');
});

// --- Alarm Logic ---
function startAlarmPoller() {
    setInterval(() => {
        if (!state.alarmTime || state.isAlarmActive) return;

        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

        if (currentTime === state.alarmTime) {
            triggerAlarm();
        }
    }, 5000);
}

function triggerAlarm() {
    state.isAlarmActive = true;
    startQuiz(true);
}

// --- Quiz Logic ---
function startQuiz(fromAlarm = false) {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
    state.currentQuiz = {
        questions: shuffled.slice(0, 5),
        index: 0,
        score: 0,
        fromAlarm: fromAlarm
    };

    if (fromAlarm) {
        audio.play().catch(e => console.log("Audio needs interaction first"));
        document.getElementById('alarm-indicator').style.display = 'block';
    } else {
        document.getElementById('alarm-indicator').style.display = 'none';
    }

    showSection('quiz');
    renderQuestion();
}

function renderQuestion() {
    const q = state.currentQuiz.questions[state.currentQuiz.index];
    document.getElementById('quiz-question-number').textContent = `Question ${state.currentQuiz.index + 1} of 5`;
    document.getElementById('quiz-question-text').textContent = q.question;
    document.getElementById('quiz-house-name').textContent = `House: ${state.currentUser.house}`;
    document.getElementById('quiz-current-score').textContent = `Score: ${state.currentQuiz.score}`;

    const optionsCont = document.getElementById('quiz-options');
    optionsCont.innerHTML = '';

    q.options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        label.innerHTML = `<input type="radio" name="answer" value="${opt}" required> <span>${opt}</span>`;
        optionsCont.appendChild(label);
    });
}

document.getElementById('quiz-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = document.querySelector('input[name="answer"]:checked').value;
    const correct = state.currentQuiz.questions[state.currentQuiz.index].answer;

    if (selected === correct) {
        state.currentQuiz.score += 10;
    }

    state.currentQuiz.index++;

    if (state.currentQuiz.index < 5) {
        renderQuestion();
    } else {
        finishQuiz();
    }
});

function finishQuiz() {
    const score = state.currentQuiz.score;

    // Update individual user points
    state.currentUser.points += score;
    localStorage.setItem('hp_users', JSON.stringify(state.allUsers));

    // Stop alarm
    audio.pause();
    audio.currentTime = 0;
    state.isAlarmActive = false;

    document.getElementById('result-score').textContent = score;
    document.getElementById('result-message').textContent = `${score} points awarded to ${state.currentUser.house}! — by Albus Dumbledore`;

    showSection('results');

    // Auto-redirect to dashboard after 5 seconds
    setTimeout(() => {
        if (sections.results.classList.contains('hidden')) return; // already navigated away
        showSection('dashboard');
        updateDashboard();
    }, 5000);
}

document.getElementById('result-back-btn').addEventListener('click', () => {
    showSection('dashboard');
    updateDashboard();
});

// --- Leaderboard ---
document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '';

    const houses = ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"];

    // Calculate house totals
    const houseTotals = houses.map(h => {
        const members = state.allUsers.filter(u => u.house === h);
        const total = members.reduce((sum, u) => sum + u.points, 0);
        return { name: h, total: total, members: members.sort((a, b) => b.points - a.points) };
    }).sort((a, b) => b.total - a.total);

    houseTotals.forEach(h => {
        let memberHtml = '';
        if (h.members.length > 0) {
            memberHtml = '<table style="width: 100%; font-size: 0.9rem; margin-top: 5px;">';
            h.members.forEach(m => {
                memberHtml += `<tr><td>${m.name}</td><td style="text-align:right;">${m.points} pts</td></tr>`;
            });
            memberHtml += '</table>';
        } else {
            memberHtml = '<div style="font-size: 0.8rem; font-style: italic; color: #888;">No students yet</div>';
        }

        content.innerHTML += `
            <div style="margin-bottom: 25px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <h3 class="${h.name.toLowerCase()}" style="margin: 0;">${h.name}</h3>
                    <span style="font-weight: bold;">${h.total} pts</span>
                </div>
                <div style="padding-left: 10px;">${memberHtml}</div>
            </div>
        `;
    });

    showSection('leaderboard');
});

document.getElementById('leaderboard-back-btn').addEventListener('click', () => {
    showSection('dashboard');
});

// Run Init
init();