<?php

class PaymentController {

    public function store($documentId) {
        $data = getJsonInput();
        $db = getDB();

        // Validate
        if (empty($data['amount']) || empty($data['type'])) {
            jsonResponse(['error' => "Fields 'amount' and 'type' are required"], 400);
        }

        if (!in_array($data['type'], ['dp', 'full'])) {
            jsonResponse(['error' => "Type must be 'dp' or 'full'"], 400);
        }

        // Check document exists
        $check = $db->prepare("SELECT id, status, total_amount FROM documents WHERE id = :id");
        $check->execute([':id' => $documentId]);
        $doc = $check->fetch();

        if (!$doc) {
            jsonResponse(['error' => 'Document not found'], 404);
        }

        $db->beginTransaction();
        try {
            // Insert payment
            $stmt = $db->prepare("
                INSERT INTO payments (document_id, type, amount, payment_date, notes)
                VALUES (:doc_id, :type, :amount, :date, :notes)
            ");
            $stmt->execute([
                ':doc_id' => $documentId,
                ':type'   => $data['type'],
                ':amount' => $data['amount'],
                ':date'   => $data['date'] ?? date('Y-m-d'),
                ':notes'  => $data['notes'] ?? null,
            ]);

            // Update document status
            $newStatus = $data['type'] === 'full' ? 'Paid' : 'DP Paid';
            $db->prepare("UPDATE documents SET status = :status WHERE id = :id")
               ->execute([':status' => $newStatus, ':id' => $documentId]);

            $db->commit();

            // Return updated payment list
            $payments = $db->prepare("SELECT * FROM payments WHERE document_id = :id ORDER BY payment_date, id");
            $payments->execute([':id' => $documentId]);

            $result = array_map(function($p) {
                return [
                    'id'     => (int) $p['id'],
                    'type'   => $p['type'],
                    'amount' => (float) $p['amount'],
                    'date'   => $p['payment_date'],
                    'notes'  => $p['notes'],
                ];
            }, $payments->fetchAll());

            jsonResponse([
                'message'  => 'Payment recorded',
                'status'   => $newStatus,
                'payments' => $result,
            ], 201);

        } catch (Exception $e) {
            $db->rollBack();
            jsonResponse(['error' => 'Failed to record payment: ' . $e->getMessage()], 500);
        }
    }
}
