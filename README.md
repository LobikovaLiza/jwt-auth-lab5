docker-compose up --build

git:
git add .
git commit -m "4"   
git push

(GET)http://localhost:8080/api/test/all

(GET)http://localhost:8080/api/test/user

(GET)http://localhost:8080/api/test/admin

(POST)http://localhost:8080/api/auth/signup

(POST)http://localhost:8080/api/auth/signin



Регистрация: POST /api/auth/signup
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["user"] 
}

curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }

Вход с первого устройства: POST (http://localhost:8080/api/auth/signin)
-H "Content-Type: application/json" \
  -H "X-Device-Id: my-laptop-001" \
  -H "X-Device-Name: My Laptop" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

Вход со второго устройства POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: my-phone-002" \
  -H "X-Device-Name: My Phone" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

Получение списка устройств: GET http://localhost:8080/api/auth/devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_LAPTOP"

Выход с конкретного устройства: curl -X POST http://localhost:8080/api/auth/devices/my-phone-002/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_LAPTOP" \
  -H "Content-Type: application/json"

Переименование устройства: PUT http://localhost:8080/api/auth/devices/my-laptop-001/rename \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_LAPTOP" \
  -H "Content-Type: application/json" \
  -d '{"deviceName": "Work Laptop"}'

Выход со всех устройств кроме текущего: POST http://localhost:8080/api/auth/devices/logout-others \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_FROM_LAPTOP" \
  -H "Content-Type: application/json"

Обновление токена:POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: my-laptop-001" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN_FROM_LAPTOP"}'




новление токена: POST /api/auth/refresh
{
  "refreshToken": "your-refresh-token"
}

Выход: POST /api/auth/logout
Authorization: Bearer <access-token>

Профиль пользователя: GET /api/auth/me
Authorization: Bearer <access-token>