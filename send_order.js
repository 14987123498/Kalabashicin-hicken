export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed'
    });
  }

  const { name, phone, count, comment } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      status: 'error',
      message: 'Имя и телефон обязательны'
    });
  }

  console.log('Новая заявка:', {
    name,
    phone,
    count,
    comment
  });

  return res.status(200).json({
    status: 'success',
    message: 'Заявка успешно отправлена'
  });
}
