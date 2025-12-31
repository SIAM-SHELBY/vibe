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
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        clock.textContent = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }

    // Check if it's time for alarm
    function checkAlarm() {
        if (!alarmTime) return;

        const now = new Date();
        let hours = now.getHours();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = now.getMinutes();

        if (
            hours === alarmTime.hours &&
            minutes === alarmTime.minutes &&
            ampm === alarmTime.ampm
        ) {
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

        let [hours, minutes] = timeValue.split(':').map(Number);
        let ampm = 'AM';
        if (hours >= 12) {
            ampm = 'PM';
            if (hours > 12) hours -= 12;
        } else if (hours === 0) {
            hours = 12;
        }
        alarmTime = { hours, minutes, ampm };
        alarmStatus.textContent = `Alarm set for ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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