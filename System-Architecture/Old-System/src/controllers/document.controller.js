const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Upload document for patient
const uploadDocument = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      documentType,
      documentName,
      description,
      uploadedDate,
      base64Data // We'll receive file as base64 for now
    } = req.body;

    const clinicId = req.user.clinic_id;

    if (!base64Data || !documentName) {
      return res.status(400).json({ error: 'Document data and name required' });
    }

    // Verify patient belongs to clinic
    const patientCheck = await db.query(
      'SELECT patient_code FROM patients WHERE id = $1 AND clinic_id = $2',
      [patientId, clinicId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientCode = patientCheck.rows[0].patient_code;

    // Create directory for patient documents
    const documentsDir = `/var/www/ivf-platform/uploads/${clinicId}/${patientCode}`;
    await fs.mkdir(documentsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = documentName.split('.').pop();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const filePath = path.join(documentsDir, fileName);

    // Decode base64 and save file
    const base64Content = base64Data.split(',')[1] || base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(filePath, buffer);

    // Get file size
    const stats = await fs.stat(filePath);
    const fileSizeKb = Math.round(stats.size / 1024);

    // Save to database
    const result = await db.query(
      `INSERT INTO patient_documents (
        patient_id, clinic_id, document_type, document_name,
        file_path, file_size_kb, uploaded_date, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        patientId, clinicId, documentType, documentName,
        filePath, fileSizeKb, uploadedDate || new Date(), description, req.user.id
      ]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0]
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
};

// Get all documents for patient
const getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT d.*, u.full_name as uploaded_by_name
       FROM patient_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.patient_id = $1 AND d.clinic_id = $2
       ORDER BY d.uploaded_date DESC`,
      [patientId, clinicId]
    );

    res.json({
      documents: result.rows
    });

  } catch (error) {
    console.error('Get patient documents error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

// Download/view document
const getDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT * FROM patient_documents WHERE id = $1 AND clinic_id = $2`,
      [documentId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    // Read file and send as base64
    const fileBuffer = await fs.readFile(document.file_path);
    const base64Data = fileBuffer.toString('base64');

    res.json({
      document: {
        ...document,
        base64Data: base64Data
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT file_path FROM patient_documents WHERE id = $1 AND clinic_id = $2`,
      [documentId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = result.rows[0].file_path;

    // Delete file from disk
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('File deletion error:', err);
    }

    // Delete from database
    await db.query(
      'DELETE FROM patient_documents WHERE id = $1',
      [documentId]
    );

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

module.exports = {
  uploadDocument,
  getPatientDocuments,
  getDocument,
  deleteDocument
};
