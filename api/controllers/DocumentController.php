<?php

class DocumentController {

    public function index() {
        $db = getDB();
        $type = $_GET['type'] ?? null;

        $sql = "
            SELECT d.*, c.name AS client_name, c.pic AS client_pic, c.email AS client_email, c.address AS client_address
            FROM documents d
            JOIN clients c ON c.id = d.client_id
        ";
        $params = [];

        if ($type) {
            $sql .= " WHERE d.type = :type";
            $params[':type'] = $type;
        }
        $sql .= " ORDER BY d.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $docs = $stmt->fetchAll();

        // Nest client data
        $result = array_map(function($doc) {
            return [
                'id'              => (int) $doc['id'],
                'type'            => $doc['type'],
                'number'          => $doc['doc_number'],
                'status'          => $doc['status'],
                'date'            => $doc['issue_date'],
                'dueDate'         => $doc['due_date'],
                'discount'        => (float) $doc['discount_amount'],
                'subTotal'        => (float) $doc['sub_total'],
                'total'           => (float) $doc['total_amount'],
                'clientId'        => (int) $doc['client_id'],
                'quotationId'     => $doc['quotation_id'] ? (int) $doc['quotation_id'] : null,
                'itemsTotal'      => (float) $doc['items_total'],
                'laborCostTotal'  => (float) $doc['labor_cost_total'],
                'client' => [
                    'id'      => (int) $doc['client_id'],
                    'name'    => $doc['client_name'],
                    'pic'     => $doc['client_pic'],
                    'email'   => $doc['client_email'],
                    'address' => $doc['client_address'],
                ],
            ];
        }, $docs);

        jsonResponse($result);
    }

    public function show($id) {
        $db = getDB();

        // Document
        $stmt = $db->prepare("
            SELECT d.*, c.name AS client_name, c.pic AS client_pic, c.email AS client_email, c.address AS client_address
            FROM documents d
            JOIN clients c ON c.id = d.client_id
            WHERE d.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $doc = $stmt->fetch();

        if (!$doc) {
            jsonResponse(['error' => 'Document not found'], 404);
        }

        // Items
        $items = $db->prepare("SELECT * FROM document_items WHERE document_id = :id ORDER BY sort_order, id");
        $items->execute([':id' => $id]);

        // Labor costs
        $labor = $db->prepare("SELECT * FROM labor_costs WHERE document_id = :id ORDER BY sort_order, id");
        $labor->execute([':id' => $id]);

        // Benefits
        $benefits = $db->prepare("SELECT * FROM document_benefits WHERE document_id = :id ORDER BY sort_order, id");
        $benefits->execute([':id' => $id]);

        // Terms
        $terms = $db->prepare("SELECT * FROM document_terms WHERE document_id = :id ORDER BY sort_order, id");
        $terms->execute([':id' => $id]);

        // Payments
        $payments = $db->prepare("SELECT * FROM payments WHERE document_id = :id ORDER BY payment_date, id");
        $payments->execute([':id' => $id]);

        $result = [
            'id'              => (int) $doc['id'],
            'type'            => $doc['type'],
            'number'          => $doc['doc_number'],
            'status'          => $doc['status'],
            'date'            => $doc['issue_date'],
            'dueDate'         => $doc['due_date'],
            'discount'        => (float) $doc['discount_amount'],
            'subTotal'        => (float) $doc['sub_total'],
            'total'           => (float) $doc['total_amount'],
            'clientId'        => (int) $doc['client_id'],
            'quotationId'     => $doc['quotation_id'] ? (int) $doc['quotation_id'] : null,
            'itemsTotal'      => (float) $doc['items_total'],
            'laborCostTotal'  => (float) $doc['labor_cost_total'],
            'client' => [
                'id'      => (int) $doc['client_id'],
                'name'    => $doc['client_name'],
                'pic'     => $doc['client_pic'],
                'email'   => $doc['client_email'],
                'address' => $doc['client_address'],
            ],
            'items' => array_map(function($item) {
                return [
                    'id'          => (int) $item['id'],
                    'description' => $item['description'],
                    'qty'         => (int) $item['qty'],
                    'unitPrice'   => (float) $item['unit_price'],
                    'total'       => (float) $item['total_price'],
                ];
            }, $items->fetchAll()),
            'laborCosts' => array_map(function($lc) {
                return [
                    'id'          => (int) $lc['id'],
                    'description' => $lc['description'],
                    'cost'        => (float) $lc['cost'],
                ];
            }, $labor->fetchAll()),
            'benefits' => array_map(function($b) {
                return $b['description'];
            }, $benefits->fetchAll()),
            'terms' => array_map(function($t) {
                return $t['description'];
            }, $terms->fetchAll()),
            'payments' => array_map(function($p) {
                return [
                    'id'     => (int) $p['id'],
                    'type'   => $p['type'],
                    'amount' => (float) $p['amount'],
                    'date'   => $p['payment_date'],
                    'notes'  => $p['notes'],
                ];
            }, $payments->fetchAll()),
        ];

        jsonResponse($result);
    }

    public function store() {
        $data = getJsonInput();
        $db = getDB();

        $db->beginTransaction();
        try {
            // Insert document
            $stmt = $db->prepare("
                INSERT INTO documents (client_id, quotation_id, type, doc_number, status, issue_date, due_date, items_total, labor_cost_total, sub_total, discount_amount, total_amount)
                VALUES (:client_id, :quotation_id, :type, :doc_number, :status, :issue_date, :due_date, :items_total, :labor_cost_total, :sub_total, :discount_amount, :total_amount)
            ");
            $stmt->execute([
                ':client_id'        => $data['clientId'],
                ':quotation_id'     => $data['quotationId'] ?? null,
                ':type'             => $data['type'],
                ':doc_number'       => $data['number'],
                ':status'           => $data['status'] ?? 'Draft',
                ':issue_date'       => $data['date'],
                ':due_date'         => $data['dueDate'] ?? null,
                ':items_total'      => $data['itemsTotal'] ?? 0,
                ':labor_cost_total' => $data['laborCostTotal'] ?? 0,
                ':sub_total'        => $data['subTotal'] ?? 0,
                ':discount_amount'  => $data['discount'] ?? 0,
                ':total_amount'     => $data['total'] ?? 0,
            ]);
            $docId = $db->lastInsertId();

            // Insert items
            if (!empty($data['items'])) {
                $itemStmt = $db->prepare("
                    INSERT INTO document_items (document_id, description, qty, unit_price, total_price, sort_order)
                    VALUES (:doc_id, :desc, :qty, :unit_price, :total_price, :sort)
                ");
                foreach ($data['items'] as $i => $item) {
                    $itemStmt->execute([
                        ':doc_id'      => $docId,
                        ':desc'        => $item['description'],
                        ':qty'         => $item['qty'],
                        ':unit_price'  => $item['unitPrice'],
                        ':total_price' => $item['total'] ?? ($item['qty'] * $item['unitPrice']),
                        ':sort'        => $i,
                    ]);
                }
            }

            // Insert labor costs
            if (!empty($data['laborCosts'])) {
                $laborStmt = $db->prepare("
                    INSERT INTO labor_costs (document_id, description, cost, sort_order)
                    VALUES (:doc_id, :desc, :cost, :sort)
                ");
                foreach ($data['laborCosts'] as $i => $lc) {
                    $laborStmt->execute([
                        ':doc_id' => $docId,
                        ':desc'   => $lc['description'],
                        ':cost'   => $lc['cost'],
                        ':sort'   => $i,
                    ]);
                }
            }

            // Insert benefits
            if (!empty($data['benefits'])) {
                $bStmt = $db->prepare("
                    INSERT INTO document_benefits (document_id, description, sort_order)
                    VALUES (:doc_id, :desc, :sort)
                ");
                foreach ($data['benefits'] as $i => $b) {
                    $bStmt->execute([
                        ':doc_id' => $docId,
                        ':desc'   => $b,
                        ':sort'   => $i,
                    ]);
                }
            }

            // Insert terms
            if (!empty($data['terms'])) {
                $tStmt = $db->prepare("
                    INSERT INTO document_terms (document_id, description, sort_order)
                    VALUES (:doc_id, :desc, :sort)
                ");
                foreach ($data['terms'] as $i => $t) {
                    $tStmt->execute([
                        ':doc_id' => $docId,
                        ':desc'   => $t,
                        ':sort'   => $i,
                    ]);
                }
            }

            $db->commit();
            jsonResponse(['id' => (int) $docId, 'message' => 'Document created'], 201);

        } catch (Exception $e) {
            $db->rollBack();
            jsonResponse(['error' => 'Failed to create document: ' . $e->getMessage()], 500);
        }
    }

    public function update($id) {
        $data = getJsonInput();
        $db = getDB();

        // Check exists
        $check = $db->prepare("SELECT id FROM documents WHERE id = :id");
        $check->execute([':id' => $id]);
        if (!$check->fetch()) {
            jsonResponse(['error' => 'Document not found'], 404);
        }

        $db->beginTransaction();
        try {
            // Update document header
            $stmt = $db->prepare("
                UPDATE documents SET
                    client_id = :client_id,
                    issue_date = :issue_date,
                    due_date = :due_date,
                    items_total = :items_total,
                    labor_cost_total = :labor_cost_total,
                    sub_total = :sub_total,
                    discount_amount = :discount_amount,
                    total_amount = :total_amount
                WHERE id = :id
            ");
            $stmt->execute([
                ':id'               => $id,
                ':client_id'        => $data['clientId'],
                ':issue_date'       => $data['date'],
                ':due_date'         => $data['dueDate'] ?? null,
                ':items_total'      => $data['itemsTotal'] ?? 0,
                ':labor_cost_total' => $data['laborCostTotal'] ?? 0,
                ':sub_total'        => $data['subTotal'] ?? 0,
                ':discount_amount'  => $data['discount'] ?? 0,
                ':total_amount'     => $data['total'] ?? 0,
            ]);

            // Replace items
            $db->prepare("DELETE FROM document_items WHERE document_id = :id")->execute([':id' => $id]);
            if (!empty($data['items'])) {
                $itemStmt = $db->prepare("
                    INSERT INTO document_items (document_id, description, qty, unit_price, total_price, sort_order)
                    VALUES (:doc_id, :desc, :qty, :unit_price, :total_price, :sort)
                ");
                foreach ($data['items'] as $i => $item) {
                    $itemStmt->execute([
                        ':doc_id'      => $id,
                        ':desc'        => $item['description'],
                        ':qty'         => $item['qty'],
                        ':unit_price'  => $item['unitPrice'],
                        ':total_price' => $item['total'] ?? ($item['qty'] * $item['unitPrice']),
                        ':sort'        => $i,
                    ]);
                }
            }

            // Replace labor costs
            $db->prepare("DELETE FROM labor_costs WHERE document_id = :id")->execute([':id' => $id]);
            if (!empty($data['laborCosts'])) {
                $laborStmt = $db->prepare("
                    INSERT INTO labor_costs (document_id, description, cost, sort_order)
                    VALUES (:doc_id, :desc, :cost, :sort)
                ");
                foreach ($data['laborCosts'] as $i => $lc) {
                    $laborStmt->execute([
                        ':doc_id' => $id,
                        ':desc'   => $lc['description'],
                        ':cost'   => $lc['cost'],
                        ':sort'   => $i,
                    ]);
                }
            }

            // Replace benefits
            $db->prepare("DELETE FROM document_benefits WHERE document_id = :id")->execute([':id' => $id]);
            if (!empty($data['benefits'])) {
                $bStmt = $db->prepare("
                    INSERT INTO document_benefits (document_id, description, sort_order)
                    VALUES (:doc_id, :desc, :sort)
                ");
                foreach ($data['benefits'] as $i => $b) {
                    $bStmt->execute([
                        ':doc_id' => $id,
                        ':desc'   => $b,
                        ':sort'   => $i,
                    ]);
                }
            }

            // Replace terms
            $db->prepare("DELETE FROM document_terms WHERE document_id = :id")->execute([':id' => $id]);
            if (!empty($data['terms'])) {
                $tStmt = $db->prepare("
                    INSERT INTO document_terms (document_id, description, sort_order)
                    VALUES (:doc_id, :desc, :sort)
                ");
                foreach ($data['terms'] as $i => $t) {
                    $tStmt->execute([
                        ':doc_id' => $id,
                        ':desc'   => $t,
                        ':sort'   => $i,
                    ]);
                }
            }

            $db->commit();
            jsonResponse(['id' => (int) $id, 'message' => 'Document updated']);

        } catch (Exception $e) {
            $db->rollBack();
            jsonResponse(['error' => 'Failed to update document: ' . $e->getMessage()], 500);
        }
    }

    public function updateStatus($id) {
        $data = getJsonInput();
        $db = getDB();

        if (empty($data['status'])) {
            jsonResponse(['error' => "Field 'status' is required"], 400);
        }

        $check = $db->prepare("SELECT id FROM documents WHERE id = :id");
        $check->execute([':id' => $id]);
        if (!$check->fetch()) {
            jsonResponse(['error' => 'Document not found'], 404);
        }

        $stmt = $db->prepare("UPDATE documents SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $data['status'], ':id' => $id]);

        jsonResponse(['id' => (int) $id, 'status' => $data['status'], 'message' => 'Status updated']);
    }
}
