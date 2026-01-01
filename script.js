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
let state = {
    house: localStorage.getItem('hp_house') || null,
    alarmTime: localStorage.getItem('hp_alarm_time') || null,
    scores: JSON.parse(localStorage.getItem('hp_scores')) || {
        Gryffindor: 0, Slytherin: 0, Ravenclaw: 0, Hufflepuff: 0
    },
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
    if (!state.house) {
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

// --- House Selection ---
document.getElementById('house-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const house = document.getElementById('house-select').value;
    state.house = house;
    localStorage.setItem('hp_house', house);
    showSection('dashboard');
    updateDashboard();
});

// --- Dashboard ---
function updateDashboard() {
    document.getElementById('user-info').textContent = `Witch/Wizard of House ${state.house}`;
    document.getElementById('user-info').className = state.house.toLowerCase();

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
    localStorage.removeItem('hp_house');
    state.house = null;
    showSection('house');
});

// --- Alarm Logic ---
function startAlarmPoller() {
    setInterval(() => {
        if (!state.alarmTime || state.isAlarmActive) return;

        const now = new Date();
        const currentTIme = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

        if (currentTIme === state.alarmTime) {
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
    // Select 5 random questions
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
    document.getElementById('quiz-house-name').textContent = `House: ${state.house}`;
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

    // Update local leaderboard
    state.scores[state.house] += score;
    localStorage.setItem('hp_scores', JSON.stringify(state.scores));

    // Stop alarm
    audio.pause();
    audio.currentTime = 0;
    state.isAlarmActive = false;

    document.getElementById('result-score').textContent = score;
    document.getElementById('result-message').textContent = `${score} points awarded to ${state.house}! — by Albus Dumbledore`;

    showSection('results');
}

document.getElementById('result-back-btn').addEventListener('click', () => {
    showSection('dashboard');
});

// --- Leaderboard ---
document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '';

    const sortedHouses = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);

    sortedHouses.forEach(([house, pts]) => {
        content.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 5px;">
                <h3 class="${house.toLowerCase()}" style="margin: 0;">${house}</h3>
                <span style="font-weight: bold;">${pts} pts</span>
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