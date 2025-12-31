document.addEventListener('DOMContentLoaded', function() {
    const clock = document.getElementById('clock');
    const alarmTimeInput = document.getElementById('alarm-time');
    const setAlarmBtn = document.getElementById('set-alarm');
    const clearAlarmBtn = document.getElementById('clear-alarm');
    const alarmStatus = document.getElementById('alarm-status');
    const alarmSound = document.getElementById('alarm-sound');

    let alarmTime = null;
    let alarmInterval = null;

    // Update clock every second
    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        clock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Check if it's time for alarm
    function checkAlarm() {
        if (!alarmTime) return;

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const alarm = alarmTime.hours * 100 + alarmTime.minutes;

        if (currentTime === alarm) {
            triggerAlarm();
        }
    }

    // Trigger the alarm
    function triggerAlarm() {
        alarmSound.play();
        alarmStatus.textContent = '🔔 Alarm ringing! Expecto Patronum!';
        document.body.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)';
        clearInterval(alarmInterval);
        alarmInterval = null;
        alarmTime = null;
        // Reset after 30 seconds
        setTimeout(() => {
            document.body.style.background = 'linear-gradient(135deg, #2c1810 0%, #4a2c2a 50%, #1a1a1a 100%)';
            alarmStatus.textContent = 'No alarm set';
        }, 30000);
    }

    // Set alarm
    setAlarmBtn.addEventListener('click', function() {
        const timeValue = alarmTimeInput.value;
        if (!timeValue) {
            alert('Please select a time for the alarm.');
            return;
        }

        const [hours, minutes] = timeValue.split(':').map(Number);
        alarmTime = { hours, minutes };
        alarmStatus.textContent = `Alarm set for ${timeValue}`;
        alarmTimeInput.value = '';
    });

    // Clear alarm
    clearAlarmBtn.addEventListener('click', function() {
        alarmTime = null;
        alarmStatus.textContent = 'No alarm set';
        if (alarmInterval) {
            clearInterval(alarmInterval);
            alarmInterval = null;
        }
    });

    // Start the clock
    updateClock();
    setInterval(updateClock, 1000);

    // Start checking for alarm
    alarmInterval = setInterval(checkAlarm, 1000);
});