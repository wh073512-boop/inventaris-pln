<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function startAppSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $appRoot = dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $path = rtrim($appRoot, '/') . '/';
    if ($path === '//') {
        $path = '/';
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $path,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function sendJson(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        sendJson(['error' => 'Permintaan JSON tidak valid.'], 400);
    }
    return $data;
}

function requireCsrf(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if ($provided === '' || $expected === '' || !hash_equals($expected, $provided)) {
        sendJson(['error' => 'Token keamanan tidak valid. Muat ulang halaman dan coba lagi.'], 403);
    }
}

function currentUser(): ?array
{
    startAppSession();
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    $stmt = database()->prepare(
        'SELECT id, username, display_name, role, is_active FROM app_users WHERE id = ?'
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user || (int)$user['is_active'] !== 1) {
        $_SESSION = [];
        session_regenerate_id(true);
        return null;
    }

    return [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'displayName' => $user['display_name'],
        'role' => $user['role'],
    ];
}

function requireUser(): array
{
    $user = currentUser();
    if (!$user) {
        sendJson(['error' => 'Silakan masuk terlebih dahulu.'], 401);
    }
    return $user;
}

function requireSuperAdmin(): array
{
    $user = requireUser();
    if ($user['role'] !== 'SUPER_ADMIN') {
        sendJson(['error' => 'Akses hanya untuk Super Admin / IT Admin.'], 403);
    }
    return $user;
}
