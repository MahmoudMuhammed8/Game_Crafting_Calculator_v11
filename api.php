<?php
header('Content-Type: application/json');
require_once 'db.php';
echo json_encode(get_all_data($pdo));
?>