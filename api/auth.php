<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';

startAppSession();
$pdo = null;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    $pdo = database();
    if ($method === 'GET' && $action === 'status') {
        $count = (int)$pdo->query('SELECT COUNT(*) FROM app_users')->fetchColumn();
        sendJson([
            'setupRequired' => $count === 0,
            'user' => currentUser(),
            'csrfToken' => $_SESSION['csrf_token'],
        ]);
    }

    if ($method === 'POST') {
        requireCsrf();
        $body = readJsonBody();

        if ($action === 'setup') {
            $username = trim((string)($body['username'] ?? ''));
            $displayName = trim((string)($body['displayName'] ?? ''));
            $password = (string)($body['password'] ?? '');

            if (!preg_match('/^[A-Za-z0-9._-]{3,80}$/', $username)) {
                sendJson(['error' => 'Username harus 3–80 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).'], 422);
            }
            if ($displayName === '' || mb_strlen($displayName) > 160) {
                sendJson(['error' => 'Nama admin wajib diisi (maksimal 160 karakter).'], 422);
            }
            if (strlen($password) < 12) {
                sendJson(['error' => 'Kata sandi admin minimal 12 karakter.'], 422);
            }

            $lock = (int)$pdo->query("SELECT GET_LOCK('inventaris_pln_initial_setup', 10)")->fetchColumn();
            if ($lock !== 1) {
                sendJson(['error' => 'Setup awal sedang diproses. Coba lagi sebentar.'], 503);
            }
            $pdo->beginTransaction();
            $count = (int)$pdo->query('SELECT COUNT(*) FROM app_users')->fetchColumn();
            if ($count !== 0) {
                $pdo->rollBack();
                $pdo->query("SELECT RELEASE_LOCK('inventaris_pln_initial_setup')");
                sendJson(['error' => 'Setup awal sudah selesai. Silakan masuk.'], 409);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO app_users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$username, $displayName, password_hash($password, PASSWORD_DEFAULT), 'SUPER_ADMIN']);
            $userId = (int)$pdo->lastInsertId();
            $pdo->commit();
            $pdo->query("SELECT RELEASE_LOCK('inventaris_pln_initial_setup')");

            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            sendJson(['user' => currentUser(), 'csrfToken' => $_SESSION['csrf_token']], 201);
        }

        if ($action === 'login') {
            $username = trim((string)($body['username'] ?? ''));
            $password = (string)($body['password'] ?? '');
            $stmt = $pdo->prepare(
                'SELECT id, password_hash, is_active FROM app_users WHERE username = ? LIMIT 1'
            );
            $stmt->execute([$username]);
            $account = $stmt->fetch();
            if (!$account || (int)$account['is_active'] !== 1 || !password_verify($password, $account['password_hash'])) {
                sendJson(['error' => 'Username atau kata sandi salah.'], 401);
            }

            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$account['id'];
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            sendJson(['user' => currentUser(), 'csrfToken' => $_SESSION['csrf_token']]);
        }

        if ($action === 'logout') {
            unset($_SESSION['user_id']);
            session_regenerate_id(true);
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            sendJson(['csrfToken' => $_SESSION['csrf_token']]);
        }

        if ($action === 'users') {
            requireSuperAdmin();
            $username = trim((string)($body['username'] ?? ''));
            $displayName = trim((string)($body['displayName'] ?? ''));
            $password = (string)($body['password'] ?? '');
            $role = (string)($body['role'] ?? '');
            if (!preg_match('/^[A-Za-z0-9._-]{3,80}$/', $username)) {
                sendJson(['error' => 'Username harus 3–80 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).'], 422);
            }
            if ($displayName === '' || mb_strlen($displayName) > 160) {
                sendJson(['error' => 'Nama pengguna wajib diisi (maksimal 160 karakter).'], 422);
            }
            if (strlen($password) < 12) {
                sendJson(['error' => 'Kata sandi minimal 12 karakter.'], 422);
            }
            if (!in_array($role, ['SUPER_ADMIN', 'IT_SUPPORT', 'VIEWER'], true)) {
                sendJson(['error' => 'Role pengguna tidak valid.'], 422);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO app_users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
            );
            try {
                $stmt->execute([$username, $displayName, password_hash($password, PASSWORD_DEFAULT), $role]);
            } catch (PDOException $error) {
                if ($error->getCode() === '23000') {
                    sendJson(['error' => 'Username tersebut sudah digunakan.'], 409);
                }
                throw $error;
            }
            sendJson(['id' => (int)$pdo->lastInsertId()], 201);
        }

        sendJson(['error' => 'Aksi tidak dikenal.'], 404);
    }

    if ($method === 'GET' && $action === 'users') {
        requireSuperAdmin();
        $users = $pdo->query(
            'SELECT id, username, display_name AS displayName, role, is_active AS isActive, created_at AS createdAt FROM app_users ORDER BY display_name'
        )->fetchAll();
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['isActive'] = (bool)$user['isActive'];
        }
        sendJson(['users' => $users]);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && $action === 'users') {
        requireCsrf();
        $admin = requireSuperAdmin();
        $targetId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$targetId) {
            sendJson(['error' => 'ID pengguna tidak valid.'], 400);
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT id, role, is_active FROM app_users WHERE id = ? FOR UPDATE');
        $stmt->execute([$targetId]);
        $target = $stmt->fetch();
        if (!$target) {
            $pdo->rollBack();
            sendJson(['error' => 'Pengguna tidak ditemukan.'], 404);
        }

        if ($method === 'DELETE') {
            if ((int)$target['id'] === $admin['id']) {
                $pdo->rollBack();
                sendJson(['error' => 'Admin yang sedang masuk tidak dapat menghapus akunnya sendiri.'], 422);
            }
            if ($target['role'] === 'SUPER_ADMIN' && (int)$target['is_active'] === 1) {
                $remaining = (int)$pdo->query(
                    "SELECT COUNT(*) FROM app_users WHERE role = 'SUPER_ADMIN' AND is_active = 1 FOR UPDATE"
                )->fetchColumn();
                if ($remaining <= 1) {
                    $pdo->rollBack();
                    sendJson(['error' => 'Tidak dapat menghapus Super Admin aktif terakhir.'], 422);
                }
            }
            $delete = $pdo->prepare('DELETE FROM app_users WHERE id = ?');
            $delete->execute([$targetId]);
            $pdo->commit();
            sendJson(['success' => true]);
        }

        $body = readJsonBody();
        $role = (string)($body['role'] ?? $target['role']);
        $isActive = array_key_exists('isActive', $body) ? (bool)$body['isActive'] : (bool)$target['is_active'];
        if (!in_array($role, ['SUPER_ADMIN', 'IT_SUPPORT', 'VIEWER'], true)) {
            $pdo->rollBack();
            sendJson(['error' => 'Role pengguna tidak valid.'], 422);
        }
        if ((int)$target['id'] === $admin['id'] && (!$isActive || $role !== 'SUPER_ADMIN')) {
            $pdo->rollBack();
            sendJson(['error' => 'Tidak dapat menurunkan role atau menonaktifkan akun sendiri.'], 422);
        }
        if ($target['role'] === 'SUPER_ADMIN' && (int)$target['is_active'] === 1 && (!$isActive || $role !== 'SUPER_ADMIN')) {
            $remaining = (int)$pdo->query(
                "SELECT COUNT(*) FROM app_users WHERE role = 'SUPER_ADMIN' AND is_active = 1 FOR UPDATE"
            )->fetchColumn();
            if ($remaining <= 1) {
                $pdo->rollBack();
                sendJson(['error' => 'Tidak dapat mengubah Super Admin aktif terakhir.'], 422);
            }
        }
        $update = $pdo->prepare('UPDATE app_users SET role = ?, is_active = ? WHERE id = ?');
        $update->execute([$role, $isActive ? 1 : 0, $targetId]);
        $pdo->commit();
        sendJson(['success' => true]);
    }

    sendJson(['error' => 'Metode atau aksi tidak didukung.'], 405);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Inventaris API auth error: ' . $error->getMessage());
    sendJson(['error' => 'Terjadi kesalahan pada server. Periksa konfigurasi MySQL dan log Apache.'], 500);
}
