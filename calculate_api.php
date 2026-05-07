<?php
header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$itemId = $_GET['item'] ?? '';
$qtyInput = $_GET['qty'] ?? 1;

if (!is_numeric($qtyInput)) {
    http_response_code(400);
    echo json_encode(["error" => "Validation Error: Quantity must be strictly a number."]);
    exit;
}

$qty = max(1, (int)$qtyInput);
$database = get_all_data($pdo);

if (!isset($database[$itemId])) {
    http_response_code(404);
    echo json_encode(["error" => "Item not found in database."]);
    exit;
}

$totals = [];
function calculateMaterials($itemId, $qty, $database, &$totals) {
    if (!isset($database[$itemId])) return;
    $recipe = $database[$itemId]['recipe'];
    if (empty($recipe)) {
        $totals[$itemId] = ($totals[$itemId] ?? 0) + $qty;
        return;
    }
    foreach ($recipe as $partId => $partQty) {
        calculateMaterials($partId, $partQty * $qty, $database, $totals);
    }
}

calculateMaterials($itemId, $qty, $database, $totals);
arsort($totals);

$formattedTotals = [];
foreach ($totals as $matId => $matQty) {
    $formattedTotals[] = [
        "id" => $matId,
        "name" => $database[$matId]['name'] ?? $matId,
        "amount" => $matQty,
        "location" => $database[$matId]['location'] ?? ''
    ];
}

$directRecipe = [];
foreach ($database[$itemId]['recipe'] as $partId => $partQty) {
    $directRecipe[] = [
        "id" => $partId,
        "name" => $database[$partId]['name'] ?? $partId,
        "amount" => $partQty * $qty
    ];
}

echo json_encode([
    "item" => $database[$itemId],
    "qty" => $qty,
    "direct_recipe" => $directRecipe,
    "raw_materials" => $formattedTotals,
    "total_raw_count" => array_sum($totals)
]);
?>