// ============================================
// FertilityOS - Lab Routes
// ============================================

const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================
// LAB DASHBOARD
// ============================================
router.get('/dashboard', labController.getLabDashboard);
router.get('/todays-assessments', labController.getTodaysAssessments);

// ============================================
// SEMEN ANALYSIS & PROCESSING
// ============================================
router.post('/semen-samples', labController.createSemenSample);
router.get('/semen-samples', labController.getSemenSamples);
router.get('/semen-samples/:id', labController.getSemenSample);
router.put('/semen-samples/:id', labController.updateSemenSample);

// ============================================
// OOCYTE RETRIEVAL
// ============================================
router.post('/retrievals', labController.createOocyteRetrieval);
router.get('/retrievals', labController.getOocyteRetrievals);
router.get('/retrievals/:id', labController.getOocyteRetrieval);
router.put('/oocytes/:oocyteId/fertilization', labController.updateFertilizationCheck);

// ============================================
// EMBRYO MANAGEMENT
// ============================================
router.post('/embryos', labController.createEmbryo);
router.get('/embryos', labController.getEmbryos);
router.get('/embryos/:id', labController.getEmbryo);
router.post('/embryos/:embryoId/assessments', labController.addEmbryoAssessment);
router.put('/embryos/:id/outcome', labController.updateEmbryoOutcome);

// ============================================
// CRYOPRESERVATION
// ============================================

// Cryo Storage Management
router.get('/cryo/tanks', labController.getCryoTanks);
router.post('/cryo/tanks', labController.createCryoTank);
router.get('/cryo/tanks/:tankId/structure', labController.getTankStructure);
router.post('/cryo/canisters', labController.createCanister);
router.post('/cryo/canes', labController.createCane);

// Freeze Records
router.post('/cryo/freeze', labController.createFreezeRecord);
router.get('/cryo/freeze', labController.getFreezeRecords);

// Thaw Records
router.post('/cryo/thaw', labController.createThawRecord);

module.exports = router;
