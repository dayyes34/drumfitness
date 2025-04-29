// js/sequencer.js
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация секвенсора
    const sequencer = new RhythmSequencer();

    // Загружаем данные упражнения, если есть ID в URL
    const exerciseId = getUrlParam('id');
    if (exerciseId) {
        sequencer.loadExercise(exerciseId);
    }
});

class RhythmSequencer {
    constructor() {
        // Данные секвенсора
        this.sequencerData = {
            kick: [false, false, false, false],
            snare: [false, false, false, false],
            hihat: [false, false, false, false],
            cymbal: [false, false, false, false]
        };

        // Состояние воспроизведения
        this.isPlaying = false;
        this.currentStep = 0;
        this.tempo = 120; // BPM
        this.interval = null;

        // Элементы интерфейса
        this.rows = document.querySelectorAll('.row');
        this.cells = document.querySelectorAll('.cell');
        this.playBtn = document.getElementById('play-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.tempoInput = document.getElementById('tempo');
        this.tempoValue = document.getElementById('tempo-value');

        // Данные упражнения
        this.exerciseId = null;
        this.exerciseName = document.getElementById('exercise-name');
        this.exerciseDescription = document.getElementById('exercise-description');

        // Инициализация обработчиков событий
        this.initEventListeners();

        // Настраиваем кнопку назад для Telegram
        if (tg.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                window.location.href = 'index.html';
            });
        }
    }

    initEventListeners() {
        // Обработчики для ячеек
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => {
                this.toggleCell(cell);
            });
        });

        // Кнопка воспроизведения
        this.playBtn.addEventListener('click', () => {
            this.play();
        });

        // Кнопка остановки
        this.stopBtn.addEventListener('click', () => {
            this.stop();
        });

        // Кнопка очистки
        this.clearBtn.addEventListener('click', () => {
            this.clear();
        });

        // Кнопка сохранения
        this.saveBtn.addEventListener('click', () => {
            this.saveToDatabase();
        });

        // Изменение темпа
        this.tempoInput.addEventListener('input', () => {
            this.tempo = this.tempoInput.value;
            this.tempoValue.textContent = this.tempo;

            // Если воспроизведение активно, обновляем интервал
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        });
    }

    toggleCell(cell) {
        cell.classList.toggle('active');

        // Находим индексы строки и ячейки
        const row = cell.closest('.row');
        const rowIndex = Array.from(this.rows).indexOf(row);
        const cellIndex = Array.from(row.querySelectorAll('.cell')).indexOf(cell);

        // Обновляем данные
        const soundType = this.rows[rowIndex].getAttribute('data-sound');
        this.sequencerData[soundType][cellIndex] = cell.classList.contains('active');
    }

    play() {
        // Если уже воспроизводится, останавливаем
        if (this.isPlaying) {
            this.stop();
            return;
        }

        this.isPlaying = true;
        this.playBtn.textContent = 'Пауза';

        // Вычисляем интервал шага в миллисекундах
        const stepTime = (60 / this.tempo) * 1000 / 1; // Делим на 1, т.к. у нас четвертные ноты

        // Запускаем интервал
        this.currentStep = 0;
        this.interval = setInterval(() => {
            this.playStep();
            this.currentStep = (this.currentStep + 1) % 4;
        }, stepTime);
    }

    playStep() {
        // Убираем класс текущего шага со всех ячеек
        document.querySelectorAll('.cell.current').forEach(cell => {
            cell.classList.remove('current');
        });

        // Проходим по каждой строке
        this.rows.forEach(row => {
            const soundType = row.getAttribute('data-sound');
            const cells = row.querySelectorAll('.cell');

            // Отмечаем текущий шаг
            cells[this.currentStep].classList.add('current');

            // Проверяем, нужно ли воспроизводить звук
            if (this.sequencerData[soundType][this.currentStep]) {
                this.playSound(soundType);
            }
        });
    }

    playSound(soundType) {
        // В простой версии просто логируем
        console.log(`Playing ${soundType}`);

        // Здесь можно добавить воспроизведение звука, например:
        /*
        const audio = new Audio(`sounds/${soundType}.mp3`);
        audio.play();
        */
    }

    stop() {
        if (!this.isPlaying) return;

        clearInterval(this.interval);
        this.isPlaying = false;
        this.playBtn.textContent = 'Играть';

        // Убираем отметку текущего шага
        document.querySelectorAll('.cell.current').forEach(cell => {
            cell.classList.remove('current');
        });
    }

    clear() {
        // Останавливаем воспроизведение, если активно
        this.stop();

        // Убираем активные ячейки
        document.querySelectorAll('.cell.active').forEach(cell => {
            cell.classList.remove('active');
        });

        // Сбрасываем данные
        for (const sound in this.sequencerData) {
            this.sequencerData[sound] = [false, false, false, false];
        }
    }

    async loadExercise(exerciseId) {
        try {
            const exercise = await apiRequest(`/exercises/${exerciseId}`);

            // Сохраняем ID упражнения
            this.exerciseId = exerciseId;

            // Обновляем заголовок и описание
            this.exerciseName.textContent = exercise.name;
            this.exerciseDescription.textContent = exercise.description || '';

            // Если у упражнения есть ритм, загружаем его
            if (exercise.rhythmData) {
                this.loadRhythmData(exercise.rhythmData);
            }
        } catch (error) {
            console.error('Error loading exercise:', error);
            this.exerciseName.textContent = 'Ошибка загрузки упражнения';
        }
    }

    loadRhythmData(rhythmData) {
        // Обновляем внутренние данные
        this.sequencerData = {...rhythmData};

        // Обновляем отображение
        this.rows.forEach(row => {
            const soundType = row.getAttribute('data-sound');
            const cells = row.querySelectorAll('.cell');

            if (this.sequencerData[soundType]) {
                this.sequencerData[soundType].forEach((isActive, index) => {
                    if (isActive) {
                        cells[index].classList.add('active');
                    } else {
                        cells[index].classList.remove('active');
                    }
                });
            }
        });
    }

    async saveToDatabase() {
        if (!this.exerciseId) {
            tg.showAlert('Сначала выберите упражнение');
            return;
        }

        try {
            tg.MainButton.setText('Сохранение...');
            tg.MainButton.show();
            tg.MainButton.showProgress();

            const result = await apiRequest('/save-rhythm', 'POST', {
                exerciseId: this.exerciseId,
                sequencerData: this.sequencerData
            });

            tg.MainButton.hideProgress();
            tg.MainButton.hide();

            if (result.success) {
                tg.showPopup({
                    title: 'Успешно',
                    message: 'Ритм сохранен в базе данных',
                    buttons: [{ type: 'ok' }]
                });
            } else {
                throw new Error(result.error || 'Ошибка при сохранении');
            }
        } catch (error) {
            tg.MainButton.hideProgress();
            tg.MainButton.hide();
            tg.showAlert(`Ошибка: ${error.message}`);
        }
    }
}