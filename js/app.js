// js/app.js
// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Определим базовый URL для API
const API_URL = 'http://localhost:3000/api';

// Получим данные пользователя из Telegram
const userId = tg.initDataUnsafe?.user?.id || 'unknown';

// Получим параметры из URL
const getUrlParam = (param) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
};

// Отобразим данные об ошибке
const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Автоматически удалим через 3 секунды
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
};

// Функция для отправки запросов к API
const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Id': userId
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        showError(error.message);
        throw error;
    }
};
