<?php
// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/DocumentController.php';
require_once __DIR__ . '/controllers/PaymentController.php';

// Parse URI
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path prefix
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

$path = trim($path, '/');
$segments = $path ? explode('/', $path) : [];
$method = $_SERVER['REQUEST_METHOD'];

// ===== ROUTING =====

// /api/clients
// /api/clients/{id}
if (isset($segments[0]) && $segments[0] === 'clients') {
    $id = $segments[1] ?? null;
    $controller = new ClientController();

    switch ($method) {
        case 'GET':
            $controller->index();
            break;
        case 'POST':
            $controller->store();
            break;
        case 'PUT':
            if ($id) $controller->update($id);
            else jsonResponse(['error' => 'ID required'], 400);
            break;
        case 'DELETE':
            if ($id) $controller->destroy($id);
            else jsonResponse(['error' => 'ID required'], 400);
            break;
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
}

// /api/documents
// /api/documents/{id}
// /api/documents/{id}/status
// /api/documents/{id}/payments
elseif (isset($segments[0]) && $segments[0] === 'documents') {
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;

    // /api/documents/{id}/payments
    if ($id && $action === 'payments' && $method === 'POST') {
        $controller = new PaymentController();
        $controller->store($id);
    }
    // /api/documents/{id}/status
    elseif ($id && $action === 'status' && $method === 'PATCH') {
        $controller = new DocumentController();
        $controller->updateStatus($id);
    }
    else {
        $controller = new DocumentController();
        switch ($method) {
            case 'GET':
                if ($id) $controller->show($id);
                else $controller->index();
                break;
            case 'POST':
                $controller->store();
                break;
            case 'PUT':
                if ($id) $controller->update($id);
                else jsonResponse(['error' => 'ID required'], 400);
                break;
            default:
                jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
}

else {
    jsonResponse(['message' => 'Bewhy Invoice API v1.0', 'endpoints' => [
        'GET /api/clients',
        'POST /api/clients',
        'PUT /api/clients/{id}',
        'DELETE /api/clients/{id}',
        'GET /api/documents?type=Quotation|Invoice',
        'GET /api/documents/{id}',
        'POST /api/documents',
        'PUT /api/documents/{id}',
        'PATCH /api/documents/{id}/status',
        'POST /api/documents/{id}/payments',
    ]]);
}
