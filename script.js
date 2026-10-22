// ─── DOM refs ────────────────────────────────────────────────────────────────

const startTimeInput  = document.getElementById('startTime');
const endTimeInput    = document.getElementById('endTime');
const hourlyRateInput = document.getElementById('hourlyRate');
const manualWorkTime  = document.getElementById('manualWorkTime');
const manualEarned    = document.getElementById('manualEarned');
const manualError     = document.getElementById('manualError');

const timerRateInput = document.getElementById('timerRate');
const timerError     = document.getElementById('timerError');
const timerDisplay   = document.getElementById('timerDisplay');
const timerEarned    = document.getElementById('timerEarned');
const startBtn       = document.getElementById('startBtn');
const pauseBtn       = document.getElementById('pauseBtn');
const resetBtn       = document.getElementById('resetBtn');
const liveStartTime  = document.getElementById('liveStartTime');
const timerStatus    = document.getElementById('timerStatus');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(totalSeconds) {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
}

function formatMoney(amount) {
  return `${amount.toFixed(2)} zł`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// ─── Manual calculator (auto-calculate on input change) ──────────────────────

function runManualCalculation() {
  manualError.textContent = '';

  const startTime = startTimeInput.value;
  const endTime   = endTimeInput.value;
  const rate      = Number(hourlyRateInput.value);

  // Nie liczymy dopóki pola nie są wypełnione — brak błędu, po prostu czekamy
  if (!startTime || !endTime) return;

  if (hourlyRateInput.value !== '' && (Number.isNaN(rate) || rate < 0)) {
    manualError.textContent = 'Podaj poprawną stawkę godzinową.';
    return;
  }

  let startMinutes = timeToMinutes(startTime);
  let endMinutes   = timeToMinutes(endTime);

  // Obsługa pracy przechodzącej przez północ, np. 22:00 – 06:00
  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  const workedMinutes = endMinutes - startMinutes;
  const earned        = (workedMinutes / 60) * rate;

  manualWorkTime.textContent = formatTime(workedMinutes * 60);
  manualEarned.textContent   = formatMoney(earned);
}

[startTimeInput, endTimeInput, hourlyRateInput].forEach(el =>
  el.addEventListener('input', runManualCalculation)
);

// ─── Live timer ───────────────────────────────────────────────────────────────

let timerInterval  = null;
let accumulatedMs  = 0;    // ms zebrane przed pauzą
let tickStart      = null; // timestamp ostatniego startu
let timerStartedAt = null;

function getElapsedMs() {
  return tickStart !== null
    ? accumulatedMs + (Date.now() - tickStart)
    : accumulatedMs;
}

function updateTimerView() {
  const ms           = getElapsedMs();
  const totalSeconds = Math.floor(ms / 1000);
  const rate         = Number(timerRateInput.value) || 0;
  const earned       = (ms / 3_600_000) * rate; // ms → godziny

  timerDisplay.textContent = formatTime(totalSeconds);
  timerEarned.textContent  = formatMoney(earned);
}

startBtn.addEventListener('click', () => {
  if (timerInterval !== null) return;

  // Walidacja stawki przy starcie
  const rate = Number(timerRateInput.value);
  if (timerRateInput.value === '' || Number.isNaN(rate) || rate <= 0) {
    timerError.textContent = 'Podaj stawkę godzinową przed uruchomieniem timera.';
    timerRateInput.focus();
    return;
  }
  timerError.textContent = '';

  if (!timerStartedAt) {
    timerStartedAt = new Date();
    liveStartTime.textContent = timerStartedAt.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  tickStart = Date.now();
  timerStatus.textContent = 'Pracuje';
  timerInterval = setInterval(updateTimerView, 500);
});

pauseBtn.addEventListener('click', () => {
  if (timerInterval === null) return;

  accumulatedMs += Date.now() - tickStart;
  tickStart = null;
  clearInterval(timerInterval);
  timerInterval = null;
  timerStatus.textContent = 'Pauza';
  updateTimerView();
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval  = null;
  accumulatedMs  = 0;
  tickStart      = null;
  timerStartedAt = null;
  timerError.textContent = '';

  liveStartTime.textContent = '--:--';
  timerStatus.textContent   = 'Zatrzymany';
  updateTimerView();
});

// Przelicz zarobki na żywo gdy zmieni się stawka podczas działania timera
timerRateInput.addEventListener('input', () => {
  timerError.textContent = '';
  updateTimerView();
});

// Wymuś odświeżenie widoku gdy użytkownik wróci na kartę
// (przeglądarka może throttlować setInterval gdy karta jest w tle)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateTimerView();
  }
});
