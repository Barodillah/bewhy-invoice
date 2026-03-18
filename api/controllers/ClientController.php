<?php

class ClientController {
    
    public function index() {
        $db = getDB();
        $stmt = $db->query("SELECT * FROM clients ORDER BY created_at DESC");
        $clients = $stmt->fetchAll();
        jsonResponse($clients);
    }

    public function store() {
        $data = getJsonInput();

        $required = ['name', 'pic', 'email', 'address'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => "Field '$field' is required"], 400);
            }
        }

        $db = getDB();
        $stmt = $db->prepare("
            INSERT INTO clients (name, pic, email, address, phone)
            VALUES (:name, :pic, :email, :address, :phone)
        ");
        $stmt->execute([
            ':name'    => $data['name'],
            ':pic'     => $data['pic'],
            ':email'   => $data['email'],
            ':address' => $data['address'],
            ':phone'   => $data['phone'] ?? null,
        ]);

        $id = $db->lastInsertId();
        $client = $db->query("SELECT * FROM clients WHERE id = $id")->fetch();
        jsonResponse($client, 201);
    }

    public function update($id) {
        $data = getJsonInput();
        $db = getDB();

        // Check exists
        $existing = $db->prepare("SELECT id FROM clients WHERE id = :id");
        $existing->execute([':id' => $id]);
        if (!$existing->fetch()) {
            jsonResponse(['error' => 'Client not found'], 404);
        }

        $stmt = $db->prepare("
            UPDATE clients 
            SET name = :name, pic = :pic, email = :email, address = :address, phone = :phone
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'      => $id,
            ':name'    => $data['name'],
            ':pic'     => $data['pic'],
            ':email'   => $data['email'],
            ':address' => $data['address'],
            ':phone'   => $data['phone'] ?? null,
        ]);

        $client = $db->prepare("SELECT * FROM clients WHERE id = :id");
        $client->execute([':id' => $id]);
        jsonResponse($client->fetch());
    }

    public function destroy($id) {
        $db = getDB();

        $existing = $db->prepare("SELECT id FROM clients WHERE id = :id");
        $existing->execute([':id' => $id]);
        if (!$existing->fetch()) {
            jsonResponse(['error' => 'Client not found'], 404);
        }

        $stmt = $db->prepare("DELETE FROM clients WHERE id = :id");
        $stmt->execute([':id' => $id]);
        jsonResponse(['message' => 'Client deleted']);
    }
}
