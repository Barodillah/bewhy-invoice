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
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
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

// ===== AUTH MIDDLEWARE HELPER =====
function authenticate() {
    $auth = new AuthController();
    $user = $auth->getAuthenticatedUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized. Silakan login terlebih dahulu.'], 401);
    }
    return $user;
}

// ===== ROUTING =====

// /api/auth/request-otp
// /api/auth/verify-otp
// /api/auth/me
// /api/auth/logout
if (isset($segments[0]) && $segments[0] === 'auth') {
    $action = $segments[1] ?? null;
    $controller = new AuthController();

    switch ($action) {
        case 'request-otp':
            if ($method === 'POST') $controller->requestOtp();
            else jsonResponse(['error' => 'Method not allowed'], 405);
            break;
        case 'verify-otp':
            if ($method === 'POST') $controller->verifyOtp();
            else jsonResponse(['error' => 'Method not allowed'], 405);
            break;
        case 'me':
            if ($method === 'GET') $controller->me();
            else jsonResponse(['error' => 'Method not allowed'], 405);
            break;
        case 'logout':
            if ($method === 'POST') $controller->logout();
            else jsonResponse(['error' => 'Method not allowed'], 405);
            break;
        default:
            jsonResponse(['error' => 'Auth endpoint not found'], 404);
    }
}

// /api/clients
// /api/clients/{id}
elseif (isset($segments[0]) && $segments[0] === 'clients') {
    authenticate(); // Require login
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
    authenticate(); // Require login
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

// /api/users (Admin only)
// /api/users/{id}
elseif (isset($segments[0]) && $segments[0] === 'users') {
    $currentUser = authenticate();
    if ($currentUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden. Hanya admin yang bisa mengakses.'], 403);
    }
    $id = $segments[1] ?? null;
    $controller = new UserController();

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

else {
    jsonResponse(['message' => 'Bewhy Invoice API v1.0', 'endpoints' => [
        'POST /api/auth/request-otp',
        'POST /api/auth/verify-otp',
        'GET  /api/auth/me',
        'POST /api/auth/logout',
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
        'GET /api/users (admin)',
        'POST /api/users (admin)',
        'PUT /api/users/{id} (admin)',
        'DELETE /api/users/{id} (admin)',
    ]]);
}

