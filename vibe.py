
import datetime
from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import random
import os
import sqlite3
import sqlalchemy.exc as sa_exc

# --- Harry Potter Quiz Pool ---
QUIZ_QUESTIONS = [
	{"question": "What is the name of Harry Potter's owl?", "options": ["Hedwig", "Crookshanks", "Scabbers", "Errol"], "answer": "Hedwig"},
	{"question": "Who is the headmaster of Hogwarts?", "options": ["Dumbledore", "Snape", "McGonagall", "Voldemort"], "answer": "Dumbledore"},
	{"question": "What house is Draco Malfoy in?", "options": ["Slytherin", "Gryffindor", "Ravenclaw", "Hufflepuff"], "answer": "Slytherin"},
	{"question": "What platform do you catch the Hogwarts Express from?", "options": ["9 3/4", "7 1/2", "10", "8 3/4"], "answer": "9 3/4"},
	{"question": "Who teaches Transfiguration?", "options": ["McGonagall", "Flitwick", "Sprout", "Snape"], "answer": "McGonagall"},
	{"question": "What is the spell to disarm an opponent?", "options": ["Expelliarmus", "Stupefy", "Lumos", "Avada Kedavra"], "answer": "Expelliarmus"},
	{"question": "Who is Harry's godfather?", "options": ["Sirius Black", "Remus Lupin", "Hagrid", "Dumbledore"], "answer": "Sirius Black"},
	{"question": "What is the name of the Weasley's house?", "options": ["The Burrow", "Shell Cottage", "Grimmauld Place", "Hogwarts"], "answer": "The Burrow"},
	{"question": "Who killed Dumbledore?", "options": ["Snape", "Voldemort", "Draco", "Bellatrix"], "answer": "Snape"},
	{"question": "What is the name of the wizarding bank?", "options": ["Gringotts", "Leaky Cauldron", "Ollivanders", "Honeydukes"], "answer": "Gringotts"},
	{"question": "What is the core of Harry's wand?", "options": ["Phoenix Feather", "Dragon Heartstring", "Unicorn Hair", "Veela Hair"], "answer": "Phoenix Feather"},
	{"question": "Who is the half-blood prince?", "options": ["Severus Snape", "Harry Potter", "Tom Riddle", "Albus Dumbledore"], "answer": "Severus Snape"},
	{"question": "What is Hermione's patronus?", "options": ["Otter", "Doe", "Stag", "Cat"], "answer": "Otter"},
	{"question": "What animal can McGonagall turn into?", "options": ["Cat", "Owl", "Doe", "Stag"], "answer": "Cat"},
	{"question": "What is the name of the three-headed dog?", "options": ["Fluffy", "Fang", "Norbert", "Buckbeak"], "answer": "Fluffy"},
	{"question": "Who is the Seeker for the Bulgarian Quidditch team?", "options": ["Viktor Krum", "Cedric Diggory", "Fleur Delacour", "Harry Potter"], "answer": "Viktor Krum"},
	{"question": "What is the name of the potion that allows someone to change their appearance?", "options": ["Polyjuice Potion", "Veritaserum", "Amortentia", "Felix Felicis"], "answer": "Polyjuice Potion"},
	{"question": "What does the 'Imperio' curse do?", "options": ["Controls the victim", "Kills the victim", "Tortures the victim", "Erases memory"], "answer": "Controls the victim"},
	{"question": "Who is the author of 'Fantastic Beasts and Where to Find Them'?", "options": ["Newt Scamander", "Gilderoy Lockhart", "Bathilda Bagshot", "Quirinus Quirrell"], "answer": "Newt Scamander"},
	{"question": "What is the name of the school Harry attends?", "options": ["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"], "answer": "Hogwarts"}
]

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hogwarts_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hogwarts_alarm.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Models ---
class User(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(80), unique=True, nullable=False)
	email = db.Column(db.String(120), unique=True, nullable=False)
	password_hash = db.Column(db.String(128), nullable=False)
	house = db.Column(db.String(20), nullable=True)
	streak = db.Column(db.Integer, default=0)
	last_alarm_date = db.Column(db.String(20), nullable=True)
	daily_score = db.Column(db.Integer, default=0)

class House(db.Model):
	name = db.Column(db.String(20), primary_key=True)
	total_points = db.Column(db.Integer, default=0)

class Quiz(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
	score = db.Column(db.Integer, default=0)
	completed = db.Column(db.Boolean, default=False)
	timestamp = db.Column(db.String(20))

class Alarm(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
	time = db.Column(db.String(20), nullable=True)
	active = db.Column(db.Boolean, default=False)
	triggered = db.Column(db.Boolean, default=False)

# --- Initial Houses ---
def init_houses():
	for house in ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"]:
		if not db.session.get(House, house):
			db.session.add(House(name=house, total_points=0))
	db.session.commit()

def get_house_members():
	members = {}
	for h in ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"]:
		users = User.query.filter_by(house=h).all()
		members[h] = [u.username for u in users]
	return members

# --- Routes ---

# --- Web Interface Routes ---
@app.route('/', methods=['GET', 'POST'])
def login_page():
	message = None
	if request.method == 'POST':
		username = request.form['username']
		password = request.form['password']
		user = User.query.filter_by(username=username).first()
		if not user or not check_password_hash(user.password_hash, password):
			message = 'Invalid credentials.'
		else:
			session['user_id'] = user.id
			# clear any existing quiz session to avoid unexpected immediate quiz
			session.pop('quiz_questions', None)
			session.pop('quiz_answers', None)
			session.pop('quiz_index', None)
			session.pop('quiz_score', None)
			
			# Reset alarm trigger on login so it doesn't immediately fire from an old state
			alarm = Alarm.query.filter_by(user_id=user.id).first()
			if alarm:
				alarm.triggered = False
				db.session.commit()

			if not user.house:
				return redirect(url_for('house_page'))
			session['house'] = user.house
			return redirect(url_for('dashboard_page'))
	return render_template('login.html', message=message)

@app.route('/register', methods=['GET', 'POST'])
def register_page():
	message = None
	if request.method == 'POST':
		username = request.form['username']
		email = request.form['email']
		password = request.form['password']
		if User.query.filter_by(username=username).first():
			message = 'Username already exists.'
		elif User.query.filter_by(email=email).first():
			message = 'Email already exists.'
		else:
			user = User(username=username, email=email, password_hash=generate_password_hash(password))
			db.session.add(user)
			db.session.commit()
			message = 'Registration successful! Please login.'
			return redirect(url_for('login_page'))
	return render_template('register.html', message=message)

@app.route('/house', methods=['GET', 'POST'])
def house_page():
	user_id = session.get('user_id')
	if not user_id:
		return redirect(url_for('login_page'))
	user = User.query.get(user_id)
	message = None
	if request.method == 'POST':
		house = request.form['house']
		if house not in ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"]:
			message = 'Invalid house.'
		elif user.house:
			message = 'House already selected.'
		else:
			user.house = house
			session['house'] = house
			db.session.commit()
			return redirect(url_for('dashboard_page'))
	return render_template('house.html', username=user.username, message=message)


@app.route('/dashboard', methods=['GET'])
def dashboard_page():
	user_id = session.get('user_id')
	if not user_id:
		return redirect(url_for('login_page'))
	members = get_house_members()
	return render_template('dashboard.html', members=members)


@app.route('/set_alarm', methods=['POST'])
def set_alarm():
	user_id = session.get('user_id')
	if not user_id:
		return redirect(url_for('login_page'))
	alarm_time = request.form.get('alarm_time')
	alarm = Alarm.query.filter_by(user_id=user_id).first()
	if not alarm:
		alarm = Alarm(user_id=user_id, time=alarm_time, active=True)
		db.session.add(alarm)
	else:
		alarm.time = alarm_time
		alarm.active = True
	db.session.commit()
	members = get_house_members()
	return render_template('dashboard.html', members=members, message=f'Alarm set for {alarm_time}')


@app.route('/simulate_alarm', methods=['POST'])
def simulate_alarm():
	# For testing: immediately trigger the quiz marathon for the logged-in user
	user_id = session.get('user_id')
	if not user_id:
		return redirect(url_for('login_page'))
	# Mark alarm as triggered (deactivate)
	alarm = Alarm.query.filter_by(user_id=user_id).first()
	if alarm:
		alarm.active = False
		alarm.triggered = True
		db.session.commit()
	# Redirect to quiz which will start a quiz session
	return redirect(url_for('quiz_page'))


@app.route('/alarms', methods=['GET'])
def list_alarms():
	user_id = session.get('user_id')
	if not user_id:
		return jsonify({'error': 'Not logged in'}), 401
	alarm = Alarm.query.filter_by(user_id=user_id).first()
	if not alarm:
		return jsonify({'alarm': None})
	return jsonify({'alarm': {'time': alarm.time, 'active': alarm.active, 'triggered': alarm.triggered}})


@app.route('/cancel_alarm', methods=['POST'])
def cancel_alarm():
	user_id = session.get('user_id')
	if not user_id:
		return jsonify({'error': 'Not logged in'}), 401
	alarm = Alarm.query.filter_by(user_id=user_id).first()
	if alarm:
		alarm.active = False
		alarm.triggered = False
		db.session.commit()
	return jsonify({'message': 'Alarm cancelled'})


@app.route('/poll_alarm', methods=['GET'])
def poll_alarm():
	# Frontend can poll this endpoint to know if alarm has triggered
	user_id = session.get('user_id')
	if not user_id:
		return jsonify({'error': 'Not logged in'}), 401
	alarm = Alarm.query.filter_by(user_id=user_id).first()
	if not alarm:
		return jsonify({'triggered': False})
	if alarm.triggered:
		# once polled, keep it triggered until frontend redirects to quiz
		return jsonify({'triggered': True})
	return jsonify({'triggered': False})


@app.route('/quiz', methods=['GET', 'POST'])
def quiz_page():
	user_id = session.get('user_id')
	if not user_id:
		return redirect(url_for('login_page'))
	# If quiz session is missing or just completed, start a new quiz
	if 'quiz_questions' not in session or 'quiz_index' not in session:
		# Reset alarm trigger in DB so it doesn't immediately trigger again
		alarm = Alarm.query.filter_by(user_id=user_id).first()
		if alarm:
			alarm.triggered = False
			db.session.commit()

		sampled = random.sample(QUIZ_QUESTIONS, 5)  # Use 5 questions as requested
		# Build public questions list and answers list separately to avoid mutating globals
		public_questions = []
		answers = []
		for q in sampled:
			opts = list(q['options'])
			random.shuffle(opts)
			public_questions.append({'question': q['question'], 'options': opts})
			answers.append(q['answer'])
		session['quiz_questions'] = public_questions
		session['quiz_answers'] = answers
		session['quiz_score'] = 0
		session['quiz_index'] = 0
	questions = session.get('quiz_questions', [])
	index = session.get('quiz_index', 0)
	score = session.get('quiz_score', 0)
	announcement = None

	# Handle answer submission
	if request.method == 'POST' and index < len(questions):
		answer = request.form.get('answer')
		if answer is None:
			# No answer submitted, redisplay question
			question = questions[index]
			return render_template('quiz.html', question=question, index=index, score=score, message="Please select an answer.")
		# get correct answer from stored answers list
		answers = session.get('quiz_answers', [])
		correct = answers[index] if index < len(answers) else None
		if answer == correct:
			session['quiz_score'] = score + 10
			score = session['quiz_score']
		session['quiz_index'] = index + 1
		index = session['quiz_index']
		# If quiz is complete after this answer
		if index == len(questions):
			user = User.query.get(user_id)
			user.daily_score = score
			user.streak += 1
			user.last_alarm_date = datetime.datetime.now().strftime('%Y-%m-%d')
			house = db.session.get(House, user.house)
			if house:
				house.total_points += score
			db.session.commit()
			announcement = f"{score} points to {user.house}! — awarded by Professor Dumbledore to {user.username}"
			# Reset quiz session
			session.pop('quiz_questions', None)
			session.pop('quiz_index', None)
			session.pop('quiz_score', None)
			return render_template('quiz.html', announcement=announcement, score=score)

	# Show next question or announcement
	if index < len(questions):
		question = questions[index]
		return render_template('quiz.html', question=question, index=index, score=score)
	else:
		return render_template('quiz.html', announcement=announcement, score=score)

@app.route('/leaderboard', methods=['GET'])
def leaderboard_page():
	houses = House.query.order_by(House.total_points.desc()).all()
	leaderboard = []
	for h in houses:
		users = User.query.filter_by(house=h.name).order_by(User.daily_score.desc()).all()
		leaderboard.append({
			'house': h.name,
			'total_points': h.total_points,
			'users': [{'username': u.username, 'daily_score': u.daily_score} for u in users]
		})
	user_id = session.get('user_id')
	user_streak = None
	if user_id:
		user = User.query.get(user_id)
		user_streak = user.streak if user else None
	return render_template('leaderboard.html', leaderboard=leaderboard, user_streak=user_streak)


@app.route('/logout')
def logout():
	session.clear()
	return redirect(url_for('login_page'))

@app.route('/login', methods=['POST'])
def login():
	data = request.json
	user = User.query.filter_by(username=data['username']).first()
	if not user or not check_password_hash(user.password_hash, data['password']):
		return jsonify({'error': 'Invalid credentials'}), 401
	session['user_id'] = user.id
	return jsonify({'message': 'Login successful', 'house': user.house})

@app.route('/select_house', methods=['POST'])
def select_house():
	user_id = session.get('user_id')
	if not user_id:
		return jsonify({'error': 'Not logged in'}), 401
	data = request.json
	house = data['house']
	if house not in ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"]:
		return jsonify({'error': 'Invalid house'}), 400
	user = User.query.get(user_id)
	if user.house:
		return jsonify({'error': 'House already selected'}), 400
	user.house = house
	db.session.commit()
	return jsonify({'message': f'House {house} selected'})

# --- DB Init ---
if __name__ == '__main__':
	with app.app_context():
		db.create_all()
		init_houses()

		# --- Simple migration: ensure 'triggered' column exists on Alarm table ---
		try:
			db_path = os.path.join(os.path.dirname(__file__), 'hogwarts_alarm.db')
			if os.path.exists(db_path):
				conn = sqlite3.connect(db_path)
				cur = conn.cursor()
				cur.execute("PRAGMA table_info('alarm')")
				cols = [r[1] for r in cur.fetchall()]
				if 'triggered' not in cols:
					cur.execute("ALTER TABLE alarm ADD COLUMN triggered BOOLEAN DEFAULT 0")
					conn.commit()
				conn.close()
		except Exception:
			pass

	# start background alarm checker
	import threading
	import time as _time

	def alarm_checker():
		while True:
			with app.app_context():
				try:
					now = datetime.datetime.now().strftime('%H:%M')
					alarms = Alarm.query.filter_by(active=True).all()
					for a in alarms:
						if a.time == now:
							a.triggered = True
							a.active = False
					db.session.commit()
				except Exception as e:
					print(f"Alarm checker error: {e}")
			_time.sleep(10) # Check more frequently (every 10s) to not miss the minute

	t = threading.Thread(target=alarm_checker, daemon=True)
	t.start()
	app.run(debug=True)



# --- Alarm Enforcement (conceptual, for frontend integration) ---
# The alarm should only stop when /answer_question returns 'Quiz complete'.

# --- Leaderboard Endpoint ---
@app.route('/leaderboard', methods=['GET'])
def leaderboard():
	houses = House.query.order_by(House.total_points.desc()).all()
	leaderboard = [{
		'house': h.name,
		'total_points': h.total_points
	} for h in houses]
	user_id = session.get('user_id')
	user_streak = None
	if user_id:
		user = User.query.get(user_id)
		user_streak = user.streak if user else None
	return jsonify({'leaderboard': leaderboard, 'user_streak': user_streak})

# --- Daily/Weekly Reset & Champions ---
def reset_points(period='daily'):
	with app.app_context():
		houses = House.query.all()
		top_house = max(houses, key=lambda h: h.total_points) if houses else None
		users = User.query.all()
		top_user = max(users, key=lambda u: u.daily_score) if users else None
		champion = {
			'house': top_house.name if top_house else None,
			'points': top_house.total_points if top_house else 0,
			'user': top_user.username if top_user else None,
			'user_points': top_user.daily_score if top_user else 0
		}
		# Reset points
		for h in houses:
			h.total_points = 0
		for u in users:
			u.daily_score = 0
		db.session.commit()
		return champion

@app.route('/reset_points', methods=['POST'])
def api_reset_points():
	data = request.json
	period = data.get('period', 'daily')
	champion = reset_points(period)
	return jsonify({'message': f'{period.capitalize()} points reset!', 'champion': champion})

# --- Motivation Mechanics ---
MOTIVATION_QUOTES = [
	"Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
	"It does not do to dwell on dreams and forget to live.",
	"We are only as strong as we are united, as weak as we are divided.",
	"Every great wizard in history has started out as nothing more than what we are now: students."
]

@app.route('/streak_break', methods=['GET'])
def streak_break():
	quote = random.choice(MOTIVATION_QUOTES)
	return jsonify({'message': 'Streak broken!', 'quote': quote})