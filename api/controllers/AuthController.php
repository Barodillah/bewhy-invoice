<?php

class AuthController
{
    private $db;

    // SMTP Configuration
    private $smtpHost = '';
    private $smtpPort = 465;
    private $smtpUser = '';
    private $smtpPass = '';
    private $smtpFrom = '';

    // OTP Configuration
    private $otpLength = 6;
    private $otpExpiryMinutes = 5;
    private $sessionExpiryHours = 24;
    private $resendCooldownSeconds = 60;

    public function __construct()
    {
        $this->db = getDB();
    }

    /**
     * POST /api/auth/request-otp
     * Input: { "email": "user@email.com" }
     */
    public function requestOtp()
    {
        $input = getJsonInput();
        $email = trim($input['email'] ?? '');

        if (empty($email)) {
            jsonResponse(['error' => 'Email wajib diisi'], 400);
        }

        // Check user exists and is active
        $stmt = $this->db->prepare('SELECT id, name, email FROM users WHERE email = ? AND is_active = 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonResponse(['error' => 'Email tidak terdaftar atau akun tidak aktif'], 404);
        }

        // Check cooldown — prevent spam
        $stmt = $this->db->prepare(
            'SELECT created_at FROM otp_codes WHERE user_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1'
        );
        $stmt->execute([$user['id']]);
        $lastOtp = $stmt->fetch();

        if ($lastOtp) {
            $lastSent = strtotime($lastOtp['created_at']);
            $now = time();
            $diff = $now - $lastSent;
            if ($diff < $this->resendCooldownSeconds) {
                $remaining = $this->resendCooldownSeconds - $diff;
                jsonResponse(['error' => "Tunggu {$remaining} detik sebelum mengirim ulang OTP"], 429);
            }
        }

        // Invalidate old unused OTPs
        $stmt = $this->db->prepare('UPDATE otp_codes SET is_used = 1 WHERE user_id = ? AND is_used = 0');
        $stmt->execute([$user['id']]);

        // Generate OTP code
        $code = str_pad(random_int(0, 999999), $this->otpLength, '0', STR_PAD_LEFT);
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$this->otpExpiryMinutes} minutes"));

        // Save OTP
        $stmt = $this->db->prepare('INSERT INTO otp_codes (user_id, code, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$user['id'], $code, $expiresAt]);

        // Send email
        $emailSent = $this->sendOtpEmail($user['email'], $user['name'], $code);

        if (!$emailSent) {
            jsonResponse(['error' => 'Gagal mengirim email OTP. Silakan coba lagi.'], 500);
        }

        // Mask email for response
        $maskedEmail = $this->maskEmail($user['email']);

        jsonResponse([
            'message' => 'Kode OTP telah dikirim ke email Anda',
            'email' => $maskedEmail,
        ]);
    }

    /**
     * POST /api/auth/verify-otp
     * Input: { "email": "user@email.com", "code": "123456" }
     */
    public function verifyOtp()
    {
        $input = getJsonInput();
        $email = trim($input['email'] ?? '');
        $code = trim($input['code'] ?? '');

        if (empty($email) || empty($code)) {
            jsonResponse(['error' => 'Email dan kode OTP wajib diisi'], 400);
        }

        // Get user
        $stmt = $this->db->prepare('SELECT id, name, email, role FROM users WHERE email = ? AND is_active = 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonResponse(['error' => 'Email tidak terdaftar'], 404);
        }

        // Validate OTP
        $stmt = $this->db->prepare(
            'SELECT id, code, expires_at FROM otp_codes WHERE user_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1'
        );
        $stmt->execute([$user['id']]);
        $otp = $stmt->fetch();

        if (!$otp) {
            jsonResponse(['error' => 'Kode OTP tidak ditemukan. Silakan minta kode baru.'], 400);
        }

        // Check expiry
        if (strtotime($otp['expires_at']) < time()) {
            // Mark as used
            $stmt = $this->db->prepare('UPDATE otp_codes SET is_used = 1 WHERE id = ?');
            $stmt->execute([$otp['id']]);
            jsonResponse(['error' => 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'], 400);
        }

        // Check code match
        if ($otp['code'] !== $code) {
            jsonResponse(['error' => 'Kode OTP salah'], 400);
        }

        // Mark OTP as used
        $stmt = $this->db->prepare('UPDATE otp_codes SET is_used = 1 WHERE id = ?');
        $stmt->execute([$otp['id']]);

        // Create session token
        $token = bin2hex(random_bytes(32)); // 64 char hex
        $sessionExpiry = date('Y-m-d H:i:s', strtotime("+{$this->sessionExpiryHours} hours"));

        $stmt = $this->db->prepare('INSERT INTO auth_sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$user['id'], $token, $sessionExpiry]);

        // Update last login
        $stmt = $this->db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
        $stmt->execute([$user['id']]);

        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }

    /**
     * GET /api/auth/me
     * Header: Authorization: Bearer <token>
     */
    public function me()
    {
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            jsonResponse(['error' => 'Unauthorized'], 401);
        }

        jsonResponse([
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     * Header: Authorization: Bearer <token>
     */
    public function logout()
    {
        $token = $this->getBearerToken();

        if ($token) {
            $stmt = $this->db->prepare('DELETE FROM auth_sessions WHERE token = ?');
            $stmt->execute([$token]);
        }

        jsonResponse(['message' => 'Berhasil logout']);
    }

    // ===== HELPER METHODS =====

    /**
     * Get authenticated user from Bearer token.
     * Can be used as middleware in other controllers.
     */
    public function getAuthenticatedUser()
    {
        $token = $this->getBearerToken();

        if (!$token) {
            return null;
        }

        $stmt = $this->db->prepare(
            'SELECT u.id, u.name, u.email, u.role 
             FROM auth_sessions s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1'
        );
        $stmt->execute([$token]);
        return $stmt->fetch();
    }

    /**
     * Extract Bearer token from Authorization header
     */
    private function getBearerToken()
    {
        $headers = '';

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['HTTP_AUTHORIZATION'];
        }
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $headers = $requestHeaders['Authorization'] ?? '';
        }

        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Send OTP email via SMTP using fsockopen (no external library needed)
     */
    private function sendOtpEmail($to, $name, $code)
    {
        $subject = "Kode OTP Login - Bewhy Invoice";
        $htmlBody = $this->getOtpEmailTemplate($name, $code);

        // Use PHP's mail() as fallback, but prefer SMTP direct
        // We'll use a simple SMTP implementation with fsockopen + SSL
        return $this->sendSmtpEmail($to, $subject, $htmlBody);
    }

    /**
     * Simple SMTP email sender using fsockopen with SSL
     */
    private function sendSmtpEmail($to, $subject, $htmlBody)
    {
        $host = 'ssl://' . $this->smtpHost;
        $port = $this->smtpPort;

        try {
            $socket = @fsockopen($host, $port, $errno, $errstr, 30);
            if (!$socket) {
                error_log("SMTP connection failed: $errstr ($errno)");
                return false;
            }

            $this->smtpRead($socket); // greeting
            $this->smtpCommand($socket, "EHLO " . $this->smtpHost);
            $this->smtpCommand($socket, "AUTH LOGIN");
            $this->smtpCommand($socket, base64_encode($this->smtpUser));
            $this->smtpCommand($socket, base64_encode($this->smtpPass));
            $this->smtpCommand($socket, "MAIL FROM:<{$this->smtpFrom}>");
            $this->smtpCommand($socket, "RCPT TO:<{$to}>");
            $this->smtpCommand($socket, "DATA");

            // Build email headers and body
            $boundary = md5(uniqid(time()));
            $headers = "From: Bewhy Invoice <{$this->smtpFrom}>\r\n";
            $headers .= "To: {$to}\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "Date: " . date('r') . "\r\n";

            $message = $headers . "\r\n" . $htmlBody . "\r\n.\r\n";
            $this->smtpCommand($socket, $message);
            $this->smtpCommand($socket, "QUIT");

            fclose($socket);
            return true;
        }
        catch (\Exception $e) {
            error_log("SMTP error: " . $e->getMessage());
            return false;
        }
    }

    private function smtpCommand($socket, $command)
    {
        fwrite($socket, $command . "\r\n");
        return $this->smtpRead($socket);
    }

    private function smtpRead($socket)
    {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // If 4th char is a space, it's the last line
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }

    /**
     * HTML email template for OTP
     */
    private function getOtpEmailTemplate($name, $code)
    {
        $expiryMinutes = $this->otpExpiryMinutes;
        return <<<HTML

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="420" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Bewhy Invoice</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Halo,</p>
                            <p style="margin:0 0 24px;color:#1e293b;font-size:16px;font-weight:600;">{$name}</p>
                            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                                Gunakan kode OTP di bawah ini untuk login ke akun Anda:
                            </p>
                            <!-- OTP Code -->
                            <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
                                <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#6366f1;font-family:'Courier New',Courier,monospace;">{$code}</span>
                            </div>
                            <p style="margin:0 0 4px;color:#94a3b8;font-size:13px;">
                                ⏱ Kode ini berlaku selama <strong>{$expiryMinutes} menit</strong>.
                            </p>
                            <p style="margin:0;color:#94a3b8;font-size:13px;">
                                Jika Anda tidak meminta kode ini, abaikan email ini.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                            <p style="margin:0;color:#94a3b8;font-size:12px;">
                                &copy; 2026 Bewhy Invoice System
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Mask email address for privacy
     * Example: admin@bewhy.id -> ad***@bewhy.id
     */
    private function maskEmail($email)
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1];

        if (strlen($name) <= 2) {
            $masked = $name[0] . '***';
        }
        else {
            $masked = substr($name, 0, 2) . '***';
        }

        return $masked . '@' . $domain;
    }
}
