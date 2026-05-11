<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$action  = $_GET['action'] ?? '';

if ($method === 'GET') {
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    echo json_encode($tasks);

} elseif ($method === 'POST' && $action === 'create') {
    $title       = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $db          = getDB();
    $stmt        = $db->prepare('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $user_id, $title, $description);
    $stmt->execute();
    $id = $db->insert_id;
    $stmt->close();
    echo json_encode(['success' => true, 'id' => $id]);

} elseif ($method === 'POST' && $action === 'update') {
    $id     = intval($_POST['id']);
    $status = $_POST['status'] ?? 'pending';
    $db     = getDB();
    $stmt   = $db->prepare('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?');
    $stmt->bind_param('sii', $status, $id, $user_id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    $stmt->close();
    $db->close();

} elseif ($method === 'POST' && $action === 'delete') {
    $id   = intval($_POST['id']);
    $db   = getDB();
    $stmt = $db->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $id, $user_id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    $stmt->close();
    $db->close();

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
