<?php

class UserController
{
    private $db;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * GET /api/users — List all users
     */
    public function index()
    {
        $stmt = $this->db->query('SELECT id, name, email, role, is_active, last_login_at, created_at FROM users ORDER BY created_at DESC');
        $users = $stmt->fetchAll();
        jsonResponse($users);
    }

    /**
     * POST /api/users — Create a new user
     */
    public function store()
    {
        $input = getJsonInput();
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $role = $input['role'] ?? 'staff';

        if (empty($name) || empty($email)) {
            jsonResponse(['error' => 'Nama dan email wajib diisi'], 400);
        }

        if (!in_array($role, ['admin', 'staff'])) {
            jsonResponse(['error' => 'Role tidak valid'], 400);
        }

        // Check duplicate email
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Email sudah terdaftar'], 409);
        }

        $stmt = $this->db->prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, $role]);

        jsonResponse(['message' => 'User berhasil ditambahkan', 'id' => (int) $this->db->lastInsertId()], 201);
    }

    /**
     * PUT /api/users/{id} — Update user
     */
    public function update($id)
    {
        $input = getJsonInput();
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $role = $input['role'] ?? 'staff';
        $isActive = isset($input['is_active']) ? (int) $input['is_active'] : 1;

        if (empty($name) || empty($email)) {
            jsonResponse(['error' => 'Nama dan email wajib diisi'], 400);
        }

        // Check duplicate email (exclude current user)
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Email sudah digunakan user lain'], 409);
        }

        $stmt = $this->db->prepare('UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?');
        $stmt->execute([$name, $email, $role, $isActive, $id]);

        jsonResponse(['message' => 'User berhasil diupdate']);
    }

    /**
     * DELETE /api/users/{id} — Delete user
     */
    public function destroy($id)
    {
        // Prevent deleting self
        $token = $this->getBearerToken();
        if ($token) {
            $stmt = $this->db->prepare('SELECT user_id FROM auth_sessions WHERE token = ?');
            $stmt->execute([$token]);
            $session = $stmt->fetch();
            if ($session && (int) $session['user_id'] === (int) $id) {
                jsonResponse(['error' => 'Tidak bisa menghapus akun sendiri'], 400);
            }
        }

        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);

        jsonResponse(['message' => 'User berhasil dihapus']);
    }

    private function getBearerToken()
    {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $headers = $requestHeaders['Authorization'] ?? '';
        }
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
