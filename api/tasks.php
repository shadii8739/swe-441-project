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
    $db     = getDB();
    $result = $db->query("SELECT * FROM tasks WHERE user_id = $user_id ORDER BY created_at DESC");
    $tasks  = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    echo json_encode($tasks);
    $db->close();

} elseif ($method === 'POST' && $action === 'create') {
    $title       = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $db          = getDB();
    // Intentional: no prepared statement — fixed in SCRUM-5
    $db->query("INSERT INTO tasks (user_id, title, description) VALUES ($user_id, '$title', '$description')");
    echo json_encode(['success' => true, 'id' => $db->insert_id]);
    $db->close();

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
