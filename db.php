<?php
$db_file = __DIR__ . '/crafting_v11.sqlite';
$needs_setup = !file_exists($db_file);

$pdo = new PDO('sqlite:' . $db_file);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if ($needs_setup) {
    $pdo->exec("CREATE TABLE items (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, location TEXT)");
    $pdo->exec("CREATE TABLE recipes (item_id TEXT NOT NULL, ingredient_id TEXT NOT NULL, quantity INTEGER NOT NULL, FOREIGN KEY (item_id) REFERENCES items(id), FOREIGN KEY (ingredient_id) REFERENCES items(id))");

    $items = [
        ['steel_sword', 'Steel Sword', 'combat', ''],
        ['iron_shield', 'Iron Shield', 'combat', ''],
        ['war_axe', 'War Axe', 'combat', ''],
        ['basic_furnace', 'Basic Furnace', 'tech', ''],
        ['anvil', 'Anvil', 'tech', ''],
        ['workbench', 'Workbench', 'tech', ''],
        ['steel_ingot', 'Steel Ingot', 'materials', ''],
        ['iron_ingot', 'Iron Ingot', 'materials', ''],
        ['leather', 'Leather', 'materials', ''],
        ['iron_ore', 'Iron Ore', 'materials', 'Mined from deep underground veins or mountainous caves.'],
        ['coal', 'Coal', 'materials', 'Gathered from surface deposits and cavern walls.'],
        ['stone', 'Stone', 'materials', 'Harvested from open-world rock formations or quarries.'],
        ['wood', 'Wood', 'materials', 'Chopped from oak and pine trees in the dense forests.'],
        ['hide', 'Hide', 'materials', 'Hunted and skinned from wild beasts like wolves and deer.']
    ];
    $stmt = $pdo->prepare("INSERT INTO items (id, name, category, location) VALUES (?, ?, ?, ?)");
    foreach ($items as $item) $stmt->execute($item);

    $recipes = [
        ['steel_sword', 'steel_ingot', 2], ['steel_sword', 'leather', 1],
        ['iron_shield', 'iron_ingot', 4], ['iron_shield', 'wood', 2],
        ['war_axe', 'steel_ingot', 3], ['war_axe', 'wood', 1],
        ['basic_furnace', 'stone', 10], ['basic_furnace', 'wood', 5],
        ['anvil', 'iron_ingot', 8], ['anvil', 'stone', 4],
        ['workbench', 'wood', 12], ['workbench', 'iron_ingot', 2],
        ['steel_ingot', 'iron_ore', 2], ['steel_ingot', 'coal', 1],
        ['iron_ingot', 'iron_ore', 2], ['leather', 'hide', 2]
    ];
    $stmt = $pdo->prepare("INSERT INTO recipes (item_id, ingredient_id, quantity) VALUES (?, ?, ?)");
    foreach ($recipes as $recipe) $stmt->execute($recipe);
}

function get_all_data($pdo) {
    $items = $pdo->query("SELECT * FROM items")->fetchAll(PDO::FETCH_ASSOC);
    $recipes = $pdo->query("SELECT * FROM recipes")->fetchAll(PDO::FETCH_ASSOC);
    $db = [];
    foreach ($items as $row) $db[$row['id']] = ['name' => $row['name'], 'category' => $row['category'], 'location' => $row['location'], 'recipe' => []];
    foreach ($recipes as $row) $db[$row['item_id']]['recipe'][$row['ingredient_id']] = (int)$row['quantity'];
    return $db;
}
?>