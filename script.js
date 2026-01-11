const PRICE_PER_CHICK = 170;
const DEFAULT_COUNT = 10;

// Элементы
const countDisplay = document.getElementById('count');
const countInput = document.getElementById('countInput');
const priceDisplay = document.getElementById('price');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');
const orderForm = document.getElementById('orderForm');
const loadingDiv = document.getElementById('loading');

let count = DEFAULT_COUNT;

// Обновление отображения
function updateDisplay() {
    countDisplay.textContent = count;
    countInput.value = count;
    priceDisplay.textContent = (count * PRICE_PER_CHICK).toLocaleString('ru-RU');
}

// Обработчики счетчика
decrementBtn.addEventListener('click', function() {
    if (count > 1) {
        count--;
        updateDisplay();
    }
});

incrementBtn.addEventListener('click', function() {
    if (count < 1000) {
        count++;
        updateDisplay();
    }
});

updateDisplay();

// Показать/скрыть загрузку
function showLoading() {
    loadingDiv.style.display = 'block';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div><p>Отправка...</p>';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

// Упрощенная маска для телефона - только цифры и пробелы
function setupPhoneInput() {
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        // Убираем старый сложный паттерн
        phoneInput.removeAttribute('pattern');
        phoneInput.placeholder = "Введите номер телефона";
        
        phoneInput.addEventListener('input', function(e) {
            // Получаем текущее значение
            let value = this.value;
            
            // Удаляем все, кроме цифр и знака +
            value = value.replace(/[^\d+]/g, '');
            
            // Если начинается с 8, меняем на +7
            if (value.startsWith('8')) {
                value = '7' + value.substring(1);
            }
            
            // Если начинается с 7 и нет + в начале, добавляем +
            if (value.startsWith('7') && !value.startsWith('+7')) {
                value = '+' + value;
            }
            
            // Если начинается с цифры (но не 7 или 8), добавляем +7 в начало
            if (/^\d/.test(value) && !value.startsWith('7') && !value.startsWith('+7')) {
                value = '+7' + value;
            }
            
            // Форматируем с пробелами для удобства чтения
            let formatted = value;
            if (value.startsWith('+7') && value.length > 2) {
                const rest = value.substring(2);
                if (rest.length <= 3) {
                    formatted = '+7 ' + rest;
                } else if (rest.length <= 6) {
                    formatted = '+7 ' + rest.substring(0, 3) + ' ' + rest.substring(3);
                } else if (rest.length <= 8) {
                    formatted = '+7 ' + rest.substring(0, 3) + ' ' + rest.substring(3, 6) + ' ' + rest.substring(6);
                } else {
                    formatted = '+7 ' + rest.substring(0, 3) + ' ' + rest.substring(3, 6) + ' ' + rest.substring(6, 8) + ' ' + rest.substring(8);
                }
            }
            
            this.value = formatted;
        });
        
        // При фокусе выделяем текст для удобства редактирования
        phoneInput.addEventListener('focus', function() {
            this.select();
        });
    }
}

// Форматирование телефона для отображения
function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    
    // Оставляем только цифры
    let cleaned = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, меняем на 7
    if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.substring(1);
    }
    
    // Форматируем
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
        return '+7 (' + cleaned.substring(1, 4) + ') ' + 
               cleaned.substring(4, 7) + ' ' + 
               cleaned.substring(7, 9) + ' ' + 
               cleaned.substring(9, 11);
    } else if (cleaned.length === 10) {
        return '+7 (' + cleaned.substring(0, 3) + ') ' + 
               cleaned.substring(3, 6) + ' ' + 
               cleaned.substring(6, 8) + ' ' + 
               cleaned.substring(8, 10);
    }
    
    // Если не соответствует стандартному формату, возвращаем как есть
    return phone;
}

// Обработка формы
orderForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Получаем значения
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
    // Простая валидация
    if (!name) {
        alert('Пожалуйста, введите ваше имя');
        document.getElementById('name').focus();
        return;
    }
    
    if (!phone) {
        alert('Пожалуйста, введите ваш телефон');
        document.getElementById('phone').focus();
        return;
    }
    
    // Проверяем, что в телефоне достаточно цифр
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        alert('Пожалуйста, введите корректный номер телефона (минимум 10 цифр).\n\nПример: +7 999 123 45 67');
        document.getElementById('phone').focus();
        return;
    }
    
    // Форматируем телефон для отправки
    let phoneForServer = phoneDigits;
    if (phoneForServer.startsWith('8')) {
        phoneForServer = '7' + phoneForServer.substring(1);
    }
    if (!phoneForServer.startsWith('7')) {
        phoneForServer = '7' + phoneForServer;
    }
    phoneForServer = '+' + phoneForServer;
    
    showLoading();
    
    try {
        const response = await fetch('/api/send_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                phone: phoneForServer,
                count,
                comment
            })
            });

        
        console.log('Статус ответа:', response.status);
        
        const data = await response.json();
        console.log('Данные после парсинга:', data);
        
        hideLoading();
        
        if (data.status === 'success') {
            // Показываем модальное окно
            document.getElementById('clientName').textContent = name;
            document.getElementById('clientPhone').textContent = formatPhoneForDisplay(phoneForServer);
            document.getElementById('orderCount').textContent = count;
            document.getElementById('successModal').style.display = 'flex';
            
            // Сбрасываем форму
            orderForm.reset();
            count = DEFAULT_COUNT;
            updateDisplay();
            
            // Автоматическое закрытие через 5 секунд
            setTimeout(() => {
                document.getElementById('successModal').style.display = 'none';
            }, 5000);
        } else {
            alert(data.message || 'Произошла ошибка при отправке');
        }
    } catch (error) {
        hideLoading();
        console.error('Ошибка сети:', error);
        alert('Ошибка сети. Пожалуйста, попробуйте еще раз или позвоните нам: +7 (999) 123-45-67');
    }
});

// Закрытие модального окна
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('successModal').style.display = 'none';
});

document.querySelector('.btn-ok').addEventListener('click', function() {
    document.getElementById('successModal').style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('successModal')) {
        document.getElementById('successModal').style.display = 'none';
    }
});

// Текущий год в футере
const yearEl = document.getElementById('currentYear');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Инициализация маски телефона
setupPhoneInput();

// Добавляем CSS для загрузки, если его нет
if (!document.querySelector('#loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
        .loading {
            margin: 20px auto;
            text-align: center;
            padding: 20px;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 10px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}