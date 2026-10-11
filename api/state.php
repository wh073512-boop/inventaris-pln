<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';

startAppSession();
$pdo = null;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function canonicalValue(mixed $value): mixed
{
    if (!is_array($value)) {
        return $value;
    }
    if (array_is_list($value)) {
        return array_map('canonicalValue', $value);
    }
    ksort($value);
    foreach ($value as $key => $item) {
        $value[$key] = canonicalValue($item);
    }
    return $value;
}

function sameValue(mixed $left, mixed $right): bool
{
    return canonicalValue($left) === canonicalValue($right);
}

function csvSafeValue(mixed $value): string
{
    if (is_array($value) || is_object($value)) {
        $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
    $text = (string)($value ?? '');
    if (preg_match('/^[\s]*[=+\-@]/u', $text)) {
        return "'" . $text;
    }
    return $text;
}

function sendReportCsv(string $type, array $state): never
{
    $reports = [
        'it' => [
            'inventra_aset_it.csv',
            ['Kode Aset', 'Nama Perangkat', 'Kategori', 'Kepemilikan', 'Vendor Sewa', 'Merk', 'Model', 'Serial Number', 'Kondisi', 'Pemegang', 'Lokasi', 'Jatuh Tempo'],
            array_map(static function (array $asset) use ($state): array {
                $employeeName = 'Gudang IT (Tersedia)';
                foreach ($state['employees'] ?? [] as $employee) {
                    if (($employee['id'] ?? null) === ($asset['assignedToEmployeeId'] ?? null)) {
                        $employeeName = ($employee['name'] ?? '') . ' (' . ($employee['nip'] ?? '') . ')';
                        break;
                    }
                }
                return [
                    $asset['assetCode'] ?? '', $asset['name'] ?? '', $asset['category'] ?? '',
                    $asset['ownershipType'] ?? '', $asset['rentalVendor'] ?? '', $asset['brand'] ?? '',
                    $asset['model'] ?? '', $asset['serialNumber'] ?? '', $asset['condition'] ?? '',
                    $employeeName, $asset['location'] ?? '',
                    ($asset['ownershipType'] ?? '') === 'SEWA' ? ($asset['rentalEndDate'] ?? '') : ($asset['warrantyUntil'] ?? ''),
                ];
            }, $state['itAssets'] ?? []),
        ],
        'atk' => [
            'inventra_stok_atk.csv',
            ['Kode Barang', 'Nama ATK', 'Kategori', 'Stok', 'Batas Minimum', 'Satuan', 'Harga Satuan', 'Lokasi', 'Terakhir Restock'],
            array_map(static fn(array $item): array => [
                $item['itemCode'] ?? '', $item['name'] ?? '', $item['category'] ?? '',
                $item['currentStock'] ?? 0, $item['minStockAlert'] ?? 0, $item['unit'] ?? '',
                $item['unitPrice'] ?? 0, $item['location'] ?? '', $item['lastRestockedDate'] ?? '',
            ], $state['consumables'] ?? []),
        ],
        'custody' => [
            'inventra_bast.csv',
            ['Nomor BAST', 'Aksi', 'Tanggal', 'Nama Aset', 'Kode Aset', 'Serial Number', 'Nama Pegawai', 'NIP', 'Departemen', 'Diserahkan Oleh', 'Catatan', 'Tanda Tangan Lengkap'],
            array_map(static fn(array $record): array => [
                $record['bastNumber'] ?? '', $record['actionType'] ?? '', $record['date'] ?? '',
                $record['assetName'] ?? '', $record['assetCode'] ?? '', $record['serialNumber'] ?? '',
                $record['employeeName'] ?? '', $record['employeeNip'] ?? '', $record['employeeDept'] ?? '',
                $record['handoverBy'] ?? '', $record['notes'] ?? '',
                !empty($record['signatureDataUrl']) || !empty($record['employeeSignatureDataUrl']) ? 'Ya' : 'Belum',
            ], $state['custodyRecords'] ?? []),
        ],
        'transactions' => [
            'inventra_mutasi_atk.csv',
            ['ID Mutasi', 'Tipe', 'Tanggal', 'Nama Barang', 'Jumlah', 'No Referensi', 'Pemohon', 'Departemen', 'Catatan'],
            array_map(static fn(array $record): array => [
                $record['id'] ?? '', $record['type'] ?? '', $record['date'] ?? '',
                $record['consumableName'] ?? '', $record['quantity'] ?? 0, $record['referenceNo'] ?? '',
                $record['requesterName'] ?? '', $record['department'] ?? '', $record['notes'] ?? '',
            ], $state['transactions'] ?? []),
        ],
    ];

    if (!isset($reports[$type])) {
        sendJson(['error' => 'Jenis laporan tidak dikenal.'], 400);
    }

    [$filename, $headers, $rows] = $reports[$type];
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store');
    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'wb');
    if ($output === false) {
        sendJson(['error' => 'Gagal menyiapkan file laporan.'], 500);
    }
    fputcsv($output, $headers, ',', '"', '\\');
    foreach ($rows as $row) {
        fputcsv($output, array_map('csvSafeValue', $row), ',', '"', '\\');
    }
    fclose($output);
    exit;
}

function ensureSupportList(array $previous, array $next, string $key, array $mutableFields, bool $allowAppend): void
{
    $oldItems = $previous[$key] ?? [];
    $newItems = $next[$key] ?? [];
    if (!is_array($oldItems) || !is_array($newItems) || !array_is_list($oldItems) || !array_is_list($newItems)) {
        sendJson(['error' => 'Format data inventaris tidak valid.'], 422);
    }

    $oldById = [];
    foreach ($oldItems as $item) {
        if (!is_array($item) || !isset($item['id'])) {
            sendJson(['error' => 'Data inventaris tidak memiliki ID yang valid.'], 422);
        }
        $oldById[(string)$item['id']] = $item;
    }

    $seen = [];
    foreach ($newItems as $item) {
        if (!is_array($item) || !isset($item['id'])) {
            sendJson(['error' => 'Data inventaris tidak memiliki ID yang valid.'], 422);
        }
        $id = (string)$item['id'];
        if (isset($seen[$id])) {
            sendJson(['error' => 'ID data inventaris duplikat.'], 422);
        }
        $seen[$id] = true;

        if (!array_key_exists($id, $oldById)) {
            if (!$allowAppend) {
                sendJson(['error' => 'Role IT Support tidak dapat menambah data pada bagian ini.'], 403);
            }
            if ($key === 'custodyRecords' && !in_array($item['actionType'] ?? '', ['ASSIGN', 'RETURN'], true)) {
                sendJson(['error' => 'IT Support hanya dapat menambahkan catatan serah terima atau pengembalian.'], 403);
            }
            continue;
        }

        $old = $oldById[$id];
        $allKeys = array_unique(array_merge(array_keys($old), array_keys($item)));
        foreach ($allKeys as $field) {
            $oldValue = $old[$field] ?? null;
            $newValue = $item[$field] ?? null;
            if (!sameValue($oldValue, $newValue) && !in_array($field, $mutableFields, true)) {
                sendJson(['error' => 'IT Support tidak diizinkan mengubah data aset atau riwayat di luar tugasnya.'], 403);
            }
        }
    }

    if (!$allowAppend && count($newItems) !== count($oldItems)) {
        sendJson(['error' => 'Role IT Support tidak dapat menghapus atau menambah data aset.'], 403);
    }
    if ($allowAppend && count($newItems) < count($oldItems)) {
        sendJson(['error' => 'Role IT Support tidak dapat menghapus riwayat.'], 403);
    }
    foreach ($oldById as $id => $_item) {
        if (!isset($seen[$id])) {
            sendJson(['error' => 'Role IT Support tidak dapat menghapus riwayat.'], 403);
        }
    }
}

try {
    $pdo = database();
    if ($method === 'GET') {
        $user = requireUser();
        $report = (string)($_GET['export'] ?? '');
        $stmt = $pdo->query('SELECT revision, payload FROM inventory_state WHERE id = 1');
        $row = $stmt->fetch();
        $fullState = $row ? json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR) : null;
        if ($report !== '') {
            if ($fullState === null) {
                sendJson(['error' => 'Data belum diinisialisasi.'], 404);
            }
            sendReportCsv($report, $fullState);
        }
        $state = $fullState;
        if ($state === null && $user['role'] === 'SUPER_ADMIN') {
            $state = [
                'itAssets' => [],
                'consumables' => [],
                'employees' => [],
                'custodyRecords' => [],
                'transactions' => [],
                'opnameSessions' => [],
                'serviceRecords' => [],
            ];
            $encoded = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            if ($encoded !== false) {
                $save = $pdo->prepare(
                    'INSERT INTO inventory_state (id, revision, payload, updated_by) VALUES (1, 1, ?, ?) ON DUPLICATE KEY UPDATE revision = VALUES(revision), payload = VALUES(payload), updated_by = VALUES(updated_by)'
                );
                $save->execute([$encoded, $user['id']]);
                $row = ['revision' => 1];
            }
        }
        if ($user['role'] === 'VIEWER' && $state !== null) {
            $state['itAssets'] = array_map(static fn(array $asset): array => [
                'id' => $asset['id'] ?? '',
                'ownershipType' => $asset['ownershipType'] ?? null,
                'assignedToEmployeeId' => $asset['assignedToEmployeeId'] ?? null,
            ], $state['itAssets'] ?? []);
            $state['employees'] = array_map(static fn(int $index): array => [
                'id' => 'employee-summary-' . $index,
                'name' => '',
                'nip' => '',
                'position' => '',
                'department' => '',
                'joinedDate' => '',
                'phone' => '',
            ], array_keys($state['employees'] ?? []));
            $state['consumables'] = [];
            $state['transactions'] = [];
            $state['opnameSessions'] = [];
            $state['serviceRecords'] = [];
        }
        sendJson([
            'state' => $state,
            'revision' => $row ? (int)$row['revision'] : 0,
            'role' => $user['role'],
        ]);
    }

    if ($method === 'PUT') {
        requireCsrf();
        $user = requireUser();
        $body = readJsonBody();
        $expectedRevision = filter_var($body['revision'] ?? null, FILTER_VALIDATE_INT);
        $next = $body['state'] ?? null;
        $requiredKeys = ['itAssets', 'consumables', 'employees', 'custodyRecords', 'transactions', 'opnameSessions', 'serviceRecords'];
        if (!is_array($next)) {
            sendJson(['error' => 'Snapshot data tidak valid.'], 422);
        }
        foreach ($requiredKeys as $key) {
            if (!isset($next[$key]) || !is_array($next[$key]) || !array_is_list($next[$key])) {
                sendJson(['error' => "Bagian data {$key} tidak valid."], 422);
            }
        }
        $encoded = json_encode($next, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($encoded === false || strlen($encoded) > 20 * 1024 * 1024) {
            sendJson(['error' => 'Ukuran data tidak valid atau melebihi batas 20 MB.'], 413);
        }

        $pdo->beginTransaction();
        $stmt = $pdo->query('SELECT revision, payload FROM inventory_state WHERE id = 1 FOR UPDATE');
        $row = $stmt->fetch();
        $currentRevision = $row ? (int)$row['revision'] : 0;
        if ($expectedRevision === false || $expectedRevision !== $currentRevision) {
            $pdo->rollBack();
            sendJson(['error' => 'Data berubah di sesi lain. Muat ulang aplikasi sebelum menyimpan lagi.'], 409);
        }
        $previous = $row ? json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR) : null;

        if ($user['role'] === 'VIEWER') {
            $pdo->rollBack();
            sendJson(['error' => 'Viewer hanya diizinkan melihat dan mengekspor data.'], 403);
        }
        if ($user['role'] === 'IT_SUPPORT') {
            if ($previous === null) {
                $pdo->rollBack();
                sendJson(['error' => 'Data awal harus diinisialisasi oleh Super Admin.'], 403);
            }
            foreach ($requiredKeys as $key) {
                if (!in_array($key, ['itAssets', 'custodyRecords', 'serviceRecords'], true)
                    && !sameValue($previous[$key] ?? null, $next[$key] ?? null)) {
                    $pdo->rollBack();
                    sendJson(['error' => 'IT Support tidak diizinkan mengubah bagian data ini.'], 403);
                }
            }
            ensureSupportList(
                $previous,
                $next,
                'itAssets',
                ['condition', 'damageNotes', 'serviceVendor', 'serviceTicketNo', 'serviceStartDate', 'estimatedServiceEndDate', 'isRentalVendorClaim', 'location', 'assignedToEmployeeId', 'assignedDate'],
                false
            );
            ensureSupportList($previous, $next, 'custodyRecords', [], true);
            ensureSupportList(
                $previous,
                $next,
                'serviceRecords',
                ['status', 'completedDate', 'resolutionNotes', 'technicianName'],
                true
            );
        }

        $revision = $currentRevision + 1;
        $save = $pdo->prepare(
            'INSERT INTO inventory_state (id, revision, payload, updated_by) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE revision = VALUES(revision), payload = VALUES(payload), updated_by = VALUES(updated_by)'
        );
        $save->execute([$revision, $encoded, $user['id']]);
        $pdo->commit();
        sendJson(['revision' => $revision]);
    }

    sendJson(['error' => 'Metode tidak didukung.'], 405);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Inventaris API state error: ' . $error->getMessage());
    sendJson(['error' => 'Terjadi kesalahan pada server saat mengakses database.'], 500);
}
