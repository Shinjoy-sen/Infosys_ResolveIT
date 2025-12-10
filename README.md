
resolveIT_final3 - Final combined project (backend + frontend)

Run instructions:
1. Ensure MySQL is running or create DB (if not exists):
   CREATE DATABASE resolveit_db;
   (defaults: user=root, password=2003)

2. Build:
   mvn clean package

3. Run:
   java -jar target/resolveIT-1.0.0.jar

4. Open: http://localhost:8090

Notes:
- Auth endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/anonymous
- Complaint endpoints: POST /api/complaints (multipart/form-data), GET /api/complaints/my
- Uploaded files saved in 'uploads' and served at /uploads/<filename>
- Frontend fetches categories from your Google Sheet with a fallback map.
