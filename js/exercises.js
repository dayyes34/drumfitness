// js/exercises.js
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что мы на странице со списком упражнений
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;

    // Загружаем список упражнений
    loadExercises();

    // Настраиваем кнопку назад для Telegram
    if (tg.BackButton) {
        tg.BackButton.hide();
    }
});

// Функция загрузки упражнений
async function loadExercises() {
    const exerciseList = document.getElementById('exercise-list');

    try {
        const exercises = await apiRequest('/exercises');

        // Очищаем список
        exerciseList.innerHTML = '';

        if (exercises.length === 0) {
            exerciseList.innerHTML = '<div class="no-data">Нет доступных упражнений</div>';
            return;
        }

        // Создаем элементы списка
        exercises.forEach(exercise => {
            const item = document.createElement('div');
            item.className = 'exercise-item';
            item.setAttribute('data-id', exercise._id);

            // Переводим сложность
            const difficultyText = {
                'easy': 'Легкий',
                'medium': 'Средний',
                'hard': 'Сложный'
            }[exercise.difficulty] || exercise.difficulty;

            item.innerHTML = `
                <div class="exercise-title">${exercise.name}</div>
                <div class="exercise-details">
                    Сложность: ${difficultyText} | Длительность: ${exercise.duration} мин
                </div>
            `;

            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                window.location.href = `sequencer.html?id=${exercise._id}`;
            });

            exerciseList.appendChild(item);
        });
    } catch (error) {
        exerciseList.innerHTML = '<div class="error">Не удалось загрузить упражнения</div>';
    }
}