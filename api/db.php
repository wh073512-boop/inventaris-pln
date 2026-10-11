<?php
declare(strict_types=1);

function database(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('INVENTARIS_DB_HOST') ?: '127.0.0.1';
    $port = getenv('INVENTARIS_DB_PORT') ?: '3306';
    $name = getenv('INVENTARIS_DB_NAME') ?: 'inventaris_pln';
    $user = getenv('INVENTARIS_DB_USER') ?: 'root';
    $password = getenv('INVENTARIS_DB_PASSWORD') ?: '';

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}
