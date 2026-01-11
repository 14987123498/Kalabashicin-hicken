<?php
// Включаем вывод ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Устанавливаем кодировку UTF-8 для всего скрипта
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Получаем данные из формы
$name = isset($_POST['name']) ? trim(htmlspecialchars($_POST['name'], ENT_QUOTES, 'UTF-8')) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$count = isset($_POST['count']) ? intval($_POST['count']) : 0;
$comment = isset($_POST['comment']) ? trim(htmlspecialchars($_POST['comment'], ENT_QUOTES, 'UTF-8')) : '';

// Проверка обязательных полей
if (empty($name) || empty($phone)) {
    $response = [
        'status' => 'error',
        'message' => 'Не заполнены обязательные поля: Имя и Телефон'
    ];
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Подготовка письма
$to = 'T.kalabashkin@mail.ru';
$subject = 'Новый заказ цыплят от ' . $name;

// Кодируем тему письма для корректного отображения
$subject_encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$message = "
НОВЫЙ ЗАКАЗ ЦЫПЛЯТ

Имя: $name
Телефон: $phone
Количество: $count шт.
Стоимость: " . ($count * 100) . " руб.

Комментарий: $comment

---
Дата: " . date('d.m.Y H:i:s') . "
";

// Заголовки письма с правильной кодировкой
$headers = "From: Siberian Lux <no-reply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
$headers .= "Reply-To: no-reply@" . $_SERVER['HTTP_HOST'] . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Пытаемся отправить письмо
try {
    $mailSent = mail($to, $subject_encoded, $message, $headers);
    
    if ($mailSent) {
        // Логируем успешную заявку
        file_put_contents('orders.log', 
            date('Y-m-d H:i:s') . " | Успех | $name | $phone | $count шт.\n", 
            FILE_APPEND | LOCK_EX
        );
        
        $response = [
            'status' => 'success',
            'message' => 'Заявка успешно отправлена!'
        ];
    } else {
        // Логируем ошибку
        file_put_contents('errors.log', 
            date('Y-m-d H:i:s') . " | Ошибка отправки mail() | $name | $phone\n", 
            FILE_APPEND | LOCK_EX
        );
        
        $response = [
            'status' => 'error',
            'message' => 'Ошибка отправки. Пожалуйста, позвоните нам: +7 (999) 123-45-67'
        ];
    }
} catch (Exception $e) {
    file_put_contents('errors.log', 
        date('Y-m-d H:i:s') . " | Exception: " . $e->getMessage() . "\n", 
        FILE_APPEND | LOCK_EX
    );
    
    $response = [
        'status' => 'error',
        'message' => 'Системная ошибка. Попробуйте позже.'
    ];
}

// Отправляем JSON ответ
echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;