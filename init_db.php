<?php
try {
    $dbPath = __DIR__ . '/backend/database/database.sqlite';
    $sqlPath = __DIR__ . '/backend/database/export.sql';
    
    if (!file_exists($sqlPath)) {
        die("SQL file not found at $sqlPath\n");
    }

    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = file_get_contents($sqlPath);
    $db->exec($sql);
    
    echo "Database successfully re-initialized at $dbPath\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
