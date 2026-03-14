let patientId = null;
let patientData = null;
let treatmentPackages = [];
let currentInvoiceId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    
    const urlParams = new URLSearchParams(window.location.search);
    patientId = urlParams.get('id');
    
    console.log('Patient ID from URL:', patientId);
    
    if (!patientId) {
        alert('No patient ID provided');
        window.location.href = 'patients.html';
        return;
    }
    
    loadPatientDetails();
    loadTreatmentPackages();
    
    setTimeout(() => {
        setupMedicationForm();
        setupAssignTreatmentForm();
        setupGenerateInvoiceForm();
        setupRecordPaymentForm();
    }, 500);
});

async function loadPatientDetails() {
    try {
        const data = await apiCall(`/patients/${patientId}`);
        
        if (data && data.patient) {
            patientData = data.patient;
            displayPatientInfo(data.patient);
            loadMedicalHistory();
            loadDocuments();
            loadMedications();
            loadCycles();
            loadPayments();
        }
    } catch (error) {
        console.error('Error loading patient:', error);
        alert('Error loading patient details');
    }
}

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.full_name;
    document.getElementById('patientInfo').textContent = 
        `${patient.patient_code} | MRN: ${patient.mrn} | ${patient.age} years | ${patient.gender}`;
    
    const grid = document.getElementById('patientDetailsGrid');
    grid.innerHTML = `
        <div class="detail-section">
            <h3>Personal Information</h3>
            <div class="detail-row"><strong>Full Name:</strong> ${patient.full_name}</div>
            <div class="detail-row"><strong>Date of Birth:</strong> ${formatDate(patient.date_of_birth)}</div>
            <div class="detail-row"><strong>Age:</strong> ${patient.age} years</div>
            <div class="detail-row"><strong>Gender:</strong> ${patient.gender}</div>
            <div class="detail-row"><strong>CNIC:</strong> ${patient.cnic || 'N/A'}</div>
            <div class="detail-row"><strong>Blood Group:</strong> ${patient.blood_group || 'N/A'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Contact Information</h3>
            <div class="detail-row"><strong>Phone:</strong> ${patient.phone}</div>
            <div class="detail-row"><strong>Email:</strong> ${patient.email || 'N/A'}</div>
            <div class="detail-row"><strong>Address:</strong> ${patient.address || 'N/A'}</div>
            <div class="detail-row"><strong>City:</strong> ${patient.city || 'N/A'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Partner Information</h3>
            <div class="detail-row"><strong>Partner Name:</strong> ${patient.partner_name || 'N/A'}</div>
            <div class="detail-row"><strong>Partner Age:</strong> ${patient.partner_age || 'N/A'}</div>
            <div class="detail-row"><strong>Partner Phone:</strong> ${patient.partner_phone || 'N/A'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Referring Doctor</h3>
            <div class="detail-row"><strong>Doctor:</strong> ${patient.referring_doctor_name || 'N/A'}</div>
            <div class="detail-row"><strong>Hospital:</strong> ${patient.referring_doctor_hospital || 'N/A'}</div>
            <div class="detail-row"><strong>Phone:</strong> ${patient.referring_doctor_phone || 'N/A'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Financial Summary</h3>
            <div class="detail-row"><strong>Total Paid:</strong> PKR ${(patient.total_paid || 0).toLocaleString()}</div>
            <div class="detail-row"><strong>Outstanding:</strong> PKR ${(patient.outstanding_balance || 0).toLocaleString()}</div>
        </div>
        
        <div class="detail-section">
            <h3>Registration</h3>
            <div class="detail-row"><strong>Registered:</strong> ${formatDate(patient.created_at)}</div>
        </div>
    `;
}

async function loadMedicalHistory() {
    try {
        const data = await apiCall(`/medical-history/${patientId}`);
        const content = document.getElementById('medicalHistoryContent');
        
        if (data && data.medicalHistory) {
            const history = data.medicalHistory;
            content.innerHTML = `
                <div class="history-section">
                    <h3>Chief Complaint</h3>
                    <p>${history.chief_complaint || 'Not recorded'}</p>
                    <p><strong>Duration of Infertility:</strong> ${history.duration_of_infertility || 'N/A'}</p>
                </div>
                
                <div class="history-section">
                    <h3>Gynecological History</h3>
                    <p><strong>LMP:</strong> ${history.last_menstrual_period ? formatDate(history.last_menstrual_period) : 'N/A'}</p>
                    <p><strong>Cycle:</strong> ${history.cycle_length_days || 'N/A'} days, ${history.cycle_regularity || 'N/A'}</p>
                    <p><strong>Obstetric History:</strong> ${history.obstetric_history || 'N/A'}</p>
                </div>
                
                <div class="history-section">
                    <h3>Medical Conditions</h3>
                    <p>${history.medical_conditions && history.medical_conditions.length > 0 ? history.medical_conditions.join(', ') : 'None'}</p>
                </div>
                
                <div class="history-section">
                    <h3>Allergies</h3>
                    <p>${history.allergies && history.allergies.length > 0 ? history.allergies.join(', ') : 'None'}</p>
                </div>
                
                <div class="history-section">
                    <h3>Lifestyle</h3>
                    <p><strong>Smoking:</strong> ${history.smoking ? 'Yes' : 'No'}</p>
                    <p><strong>Alcohol:</strong> ${history.alcohol ? 'Yes' : 'No'}</p>
                    <p><strong>Exercise:</strong> ${history.exercise || 'N/A'}</p>
                </div>
            `;
        } else {
            content.innerHTML = '<p>No medical history recorded yet.</p>';
        }
    } catch (error) {
        console.error('Error loading medical history:', error);
        document.getElementById('medicalHistoryContent').innerHTML = '<p>Error loading medical history.</p>';
    }
}

async function loadDocuments() {
    try {
        const data = await apiCall(`/documents/patient/${patientId}`);
        const content = document.getElementById('documentsContent');
        
        if (data && data.documents && data.documents.length > 0) {
            content.innerHTML = data.documents.map(doc => `
                <div class="document-item">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">📄</span>
                        <div>
                            <div style="font-weight: 500;">${doc.document_name}</div>
                            <div style="font-size: 12px; color: #64748b;">
                                ${formatDate(doc.uploaded_date)} | ${(doc.file_size_kb / 1024).toFixed(2)} MB
                            </div>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-secondary" onclick="downloadDocument('${doc.id}', '${doc.document_name}')">
                            📥 Download
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            content.innerHTML = '<p>No documents uploaded.</p>';
        }
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

async function loadMedications() {
    try {
        const data = await apiCall(`/medications/patient/${patientId}?type=current`);
        const content = document.getElementById('currentMedicationsContent');
        
        if (data && data.medications && data.medications.length > 0) {
            content.innerHTML = `<table class="data-table">
                <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Start Date</th></tr></thead>
                <tbody>${data.medications.map(med => `
                    <tr>
                        <td>${med.medication_name || med.med_name}</td>
                        <td>${med.dosage}</td>
                        <td>${med.frequency}</td>
                        <td>${formatDate(med.start_date)}</td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            content.innerHTML = '<p>No current medications.</p>';
        }
        
        const prevData = await apiCall(`/medications/patient/${patientId}?type=previous`);
        const prevContent = document.getElementById('previousMedicationsContent');
        
        if (prevData && prevData.medications && prevData.medications.length > 0) {
            prevContent.innerHTML = `<table class="data-table">
                <thead><tr><th>Medication</th><th>Dosage</th><th>Period</th></tr></thead>
                <tbody>${prevData.medications.map(med => `
                    <tr>
                        <td>${med.medication_name || med.med_name}</td>
                        <td>${med.dosage}</td>
                        <td>${formatDate(med.start_date)} - ${med.end_date ? formatDate(med.end_date) : 'Ongoing'}</td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            prevContent.innerHTML = '<p>No previous medications.</p>';
        }
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

async function loadCycles() {
    try {
        const data = await apiCall(`/cycles?patientId=${patientId}`);
        const content = document.getElementById('cyclesContent');
        
        if (data && data.cycles && data.cycles.length > 0) {
            content.innerHTML = `<table class="data-table">
                <thead><tr><th>Cycle Code</th><th>Type</th><th>Stage</th><th>Start Date</th><th>Outcome</th><th>Actions</th></tr></thead>
                <tbody>${data.cycles.map(cycle => `
                    <tr>
                        <td><strong>${cycle.cycle_code}</strong></td>
                        <td>${cycle.cycle_type}</td>
                        <td><span class="badge">${cycle.current_stage}</span></td>
                        <td>${formatDate(cycle.start_date)}</td>
                        <td>${cycle.cycle_outcome || 'Ongoing'}</td>
                        <td><button class="btn btn-sm btn-secondary" onclick="viewCycle('${cycle.id}')">View</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            content.innerHTML = '<p>No IVF cycles started yet.</p>';
        }
    } catch (error) {
        console.error('Error loading cycles:', error);
    }
}

async function loadPayments() {
    try {
        const data = await apiCall(`/receipts/patient/${patientId}`);
        const content = document.getElementById('paymentsContent');
        
        if (data && data.receipts && data.receipts.length > 0) {
            content.innerHTML = `<table class="data-table">
                <thead><tr><th>Receipt #</th><th>Date</th><th>Service</th><th>Amount</th><th>Method</th><th>Actions</th></tr></thead>
                <tbody>${data.receipts.map(receipt => `
                    <tr>
                        <td><strong>${receipt.receipt_number}</strong></td>
                        <td>${formatDate(receipt.receipt_date)}</td>
                        <td>${receipt.service_description}</td>
                        <td>PKR ${receipt.amount_paid.toLocaleString()}</td>
                        <td>${receipt.payment_method}</td>
                        <td><button class="btn btn-sm btn-secondary" onclick="viewReceipt('${receipt.id}')">View</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            content.innerHTML = '<p>No payment records.</p>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function showPatientTab(tabName) {
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'billing') {
        loadBilling();
    }
}

function startNewCycle() {
    window.location.href = 'cycles.html';
}

function viewCycle(cycleId) {
    window.location.href = `cycle-details.html?id=${cycleId}`;
}

async function viewReceipt(receiptId) {
    try {
        const data = await apiCall(`/receipts/${receiptId}`);
        
        if (data && data.receipt) {
            const receipt = data.receipt;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header" style="background: #667eea; color: white;">
                        <h2>Receipt</h2>
                        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div id="receiptToPrint" style="background: white; padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #667eea; margin: 0;">🏥 ${receipt.clinic_name}</h1>
                                <p style="margin: 5px 0;">${receipt.clinic_address || ''}</p>
                                <p style="margin: 5px 0;">Phone: ${receipt.clinic_phone || ''} | Email: ${receipt.clinic_email || ''}</p>
                                <p style="margin: 5px 0; font-size: 12px;">License: ${receipt.license_number || ''}</p>
                            </div>
                            
                            <hr style="margin: 30px 0; border: 1px solid #e2e8f0;">
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                                <div>
                                    <h3 style="color: #667eea; margin-bottom: 10px;">RECEIPT</h3>
                                    <p style="margin: 5px 0;"><strong>Receipt No:</strong> ${receipt.receipt_number}</p>
                                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(receipt.receipt_date)}</p>
                                </div>
                                <div style="text-align: right;">
                                    <p style="margin: 5px 0;"><strong>Patient:</strong> ${receipt.patient_name || 'N/A'}</p>
                                    <p style="margin: 5px 0;"><strong>Patient Code:</strong> ${receipt.patient_code || 'N/A'}</p>
                                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${receipt.patient_phone || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <thead>
                                    <tr style="background: #f8fafc;">
                                        <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Service Description</th>
                                        <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Amount (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0;">${receipt.service_description}</td>
                                        <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${receipt.amount_paid.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr style="background: #f8fafc; font-weight: bold;">
                                        <td style="padding: 12px; border: 1px solid #e2e8f0;">TOTAL PAID</td>
                                        <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">PKR ${receipt.amount_paid.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                            
                            <p style="margin-top: 20px;"><strong>Payment Method:</strong> ${receipt.payment_method.toUpperCase()}</p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
                                <p>Thank you for choosing ${receipt.clinic_name || 'our clinic'}</p>
                                <p>This is a computer-generated receipt.</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn btn-primary" onclick="printReceiptContent()">🖨️ Print Receipt</button>
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
        alert('Error loading receipt');
    }
}

function printReceiptContent() {
    const content = document.getElementById('receiptToPrint').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Receipt</title>');
    printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

async function downloadDocument(documentId, fileName) {
    try {
        const data = await apiCall(`/documents/${documentId}`);
        
        if (data && data.document && data.document.base64Data) {
            const linkSource = data.document.base64Data.includes('base64,') 
                ? data.document.base64Data 
                : `data:application/octet-stream;base64,${data.document.base64Data}`;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.click();
        }
    } catch (error) {
        console.error('Error downloading document:', error);
        alert('Error downloading document');
    }
}

function showAddMedicationModal() {
    const modal = document.getElementById('addMedicationModal');
    if (!modal) {
        alert('Medication modal not found');
        return;
    }
    modal.style.display = 'block';
    const startDateField = document.getElementById('startDate');
    if (startDateField) {
        startDateField.valueAsDate = new Date();
    }
}

function closeAddMedicationModal() {
    const modal = document.getElementById('addMedicationModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('addMedicationForm');
    if (form) form.reset();
    hideError('addMedError');
}

function setupMedicationForm() {
    const form = document.getElementById('addMedicationForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('addMedError');
        
        const formData = {
            medicationName: document.getElementById('medicationName').value,
            dosage: document.getElementById('dosage').value,
            frequency: document.getElementById('frequency').value,
            route: document.getElementById('route').value,
            startDate: document.getElementById('startDate').value || new Date().toISOString().split('T')[0],
            isCurrent: true,
            isPrevious: false,
            notes: document.getElementById('medNotes').value
        };
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        
        try {
            await apiCall(`/medications/patient/${patientId}`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            closeAddMedicationModal();
            loadMedications();
            alert('Medication added successfully!');
        } catch (error) {
            showError('addMedError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Medication';
        }
    });
}

async function loadTreatmentPackages() {
    try {
        const data = await apiCall('/treatments/packages');
        if (data && data.packages) {
            treatmentPackages = data.packages;
            console.log('Loaded treatment packages:', treatmentPackages.length);
        }
    } catch (error) {
        console.error('Error loading treatment packages:', error);
    }
}

async function loadBilling() {
    await loadTreatmentPackages();
    await loadPatientTreatments();
    await loadPatientInvoices();
    updateFinancialSummary();
}

async function loadPatientTreatments() {
    try {
        const data = await apiCall(`/treatments/patient/${patientId}`);
        const content = document.getElementById('treatmentsContent');
        
        if (data && data.treatments && data.treatments.length > 0) {
            content.innerHTML = `<table class="data-table">
                <thead>
                    <tr>
                        <th>Treatment</th>
                        <th>Type</th>
                        <th>Cost</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>${data.treatments.map(treatment => `
                    <tr>
                        <td><strong>${treatment.treatment_name}</strong></td>
                        <td>${treatment.treatment_type}</td>
                        <td>PKR ${treatment.total_cost.toLocaleString()}</td>
                        <td><span class="badge">${treatment.status}</span></td>
                        <td>${formatDate(treatment.start_date)}</td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            content.innerHTML = '<p>No treatments assigned yet.</p>';
        }
    } catch (error) {
        console.error('Error loading treatments:', error);
    }
}

async function loadPatientInvoices() {
    try {
        const data = await apiCall(`/treatments/invoice/patient/${patientId}`);
        const content = document.getElementById('invoicesContent');
        
        if (data && data.invoices && data.invoices.length > 0) {
            content.innerHTML = `<table class="data-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Outstanding</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${data.invoices.map(invoice => `
                    <tr>
                        <td><strong>${invoice.invoice_number}</strong></td>
                        <td>${formatDate(invoice.invoice_date)}</td>
                        <td>PKR ${invoice.total_amount.toLocaleString()}</td>
                        <td>PKR ${(invoice.amount_paid || 0).toLocaleString()}</td>
                        <td style="color: ${invoice.outstanding > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                            PKR ${invoice.outstanding.toLocaleString()}
                        </td>
                        <td><span class="badge">${invoice.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="viewInvoiceDetails('${invoice.id}')">View</button>
                            ${invoice.outstanding > 0 ? `
                                <button class="btn btn-sm btn-success" onclick="showRecordPaymentModal('${invoice.id}', '${invoice.invoice_number}', ${invoice.total_amount}, ${invoice.amount_paid || 0}, ${invoice.outstanding})">
                                    Pay
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}</tbody>
            </table>`;
        } else {
            content.innerHTML = '<p>No invoices generated yet.</p>';
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function updateFinancialSummary() {
    if (patientData) {
        const totalBilled = parseFloat(patientData.total_paid || 0) + parseFloat(patientData.outstanding_balance || 0);
        const billElem = document.getElementById('totalBilled');
        const paidElem = document.getElementById('totalPaidSummary');
        const outElem = document.getElementById('outstandingSummary');
        
        if (billElem) billElem.textContent = `PKR ${totalBilled.toLocaleString()}`;
        if (paidElem) paidElem.textContent = `PKR ${(patientData.total_paid || 0).toLocaleString()}`;
        if (outElem) outElem.textContent = `PKR ${(patientData.outstanding_balance || 0).toLocaleString()}`;
    }
}

async function viewInvoiceDetails(invoiceId) {
    try {
        const data = await apiCall(`/treatments/invoice/patient/${patientId}`);
        
        if (data && data.invoices) {
            const invoice = data.invoices.find(inv => inv.id === invoiceId);
            
            if (invoice) {
                const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || []);
                
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.style.display = 'block';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 800px;">
                        <div class="modal-header">
                            <h2>Invoice Details - ${invoice.invoice_number}</h2>
                            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <p><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</p>
                            <p><strong>Due Date:</strong> ${invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="badge">${invoice.status}</span></p>
                            
                            <h3 style="margin-top: 20px;">Items:</h3>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${item.quantity}</td>
                                            <td>PKR ${item.unitPrice.toLocaleString()}</td>
                                            <td>PKR ${item.total.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                                        <td><strong>PKR ${invoice.subtotal.toLocaleString()}</strong></td>
                                    </tr>
                                    ${invoice.discount_amount > 0 ? `
                                    <tr>
                                        <td colspan="3" style="text-align: right;">Discount:</td>
                                        <td>- PKR ${invoice.discount_amount.toLocaleString()}</td>
                                    </tr>
                                    ` : ''}
                                    <tr style="background: #f8fafc;">
                                        <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                        <td><strong>PKR ${invoice.total_amount.toLocaleString()}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" style="text-align: right;">Paid:</td>
                                        <td style="color: #10b981;">PKR ${(invoice.amount_paid || 0).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" style="text-align: right;"><strong>Outstanding:</strong></td>
                                        <td style="color: #ef4444;"><strong>PKR ${invoice.outstanding.toLocaleString()}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                            
                            ${invoice.notes ? `<p style="margin-top: 20px;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
            }
        }
    } catch (error) {
        console.error('Error viewing invoice:', error);
        alert('Error loading invoice details');
    }
}

function showAssignTreatmentModal() {
    const modal = document.getElementById('assignTreatmentModal');
    if (!modal) {
        alert('Assign treatment modal not found in HTML');
        return;
    }
    
    const select = document.getElementById('treatmentPackage');
    if (select && treatmentPackages.length > 0) {
        select.innerHTML = '<option value="">Select a treatment package</option>' +
            treatmentPackages.map(pkg => 
                `<option value="${pkg.id}" data-name="${pkg.package_name}" data-type="${pkg.category}" data-price="${pkg.base_price}" data-services='${JSON.stringify(pkg.included_services || [])}'>${pkg.package_name} - PKR ${pkg.base_price.toLocaleString()}</option>`
            ).join('');
    } else {
        console.error('No treatment packages loaded');
    }
    
    modal.style.display = 'block';
}

function closeAssignTreatmentModal() {
    const modal = document.getElementById('assignTreatmentModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('assignTreatmentForm');
    if (form) form.reset();
    const infoDiv = document.getElementById('treatmentPackageInfo');
    if (infoDiv) infoDiv.style.display = 'none';
    hideError('assignTreatmentError');
}

function selectTreatmentPackage() {
    const select = document.getElementById('treatmentPackage');
    if (!select) return;
    
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const nameField = document.getElementById('treatmentName');
        const costField = document.getElementById('treatmentCost');
        
        if (nameField) nameField.value = selectedOption.dataset.name;
        if (costField) costField.value = selectedOption.dataset.price;
        
        const services = JSON.parse(selectedOption.dataset.services || '[]');
        const infoDiv = document.getElementById('treatmentPackageInfo');
        const servicesList = document.getElementById('packageServices');
        
        if (services.length > 0 && servicesList && infoDiv) {
            servicesList.innerHTML = services.map(s => `<li>${s}</li>`).join('');
            infoDiv.style.display = 'block';
        }
    }
}

function setupAssignTreatmentForm() {
    const form = document.getElementById('assignTreatmentForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('assignTreatmentError');
        
        const select = document.getElementById('treatmentPackage');
        const selectedOption = select ? select.options[select.selectedIndex] : null;
        
        const treatmentName = document.getElementById('treatmentName').value;
        const totalCost = parseFloat(document.getElementById('treatmentCost').value);
        
        const formData = {
            treatmentType: selectedOption ? (selectedOption.dataset.type || 'other') : 'other',
            treatmentName: treatmentName,
            totalCost: totalCost,
            startDate: document.getElementById('treatmentStartDate').value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('treatmentNotes').value
        };
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Assigning...';
        
        try {
            await apiCall(`/treatments/patient/${patientId}`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const invoiceData = {
                patientId: patientId,
                items: [{
                    name: treatmentName,
                    quantity: 1,
                    unitPrice: totalCost,
                    total: totalCost
                }],
                subtotal: totalCost,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: totalCost,
                dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                notes: `Invoice for ${treatmentName}`
            };
            
            await apiCall('/treatments/invoice', {
                method: 'POST',
                body: JSON.stringify(invoiceData)
            });
            
            closeAssignTreatmentModal();
            loadBilling();
            loadPatientDetails();
            alert('Treatment assigned and invoice generated successfully!');
        } catch (error) {
            showError('assignTreatmentError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Assign Treatment';
        }
    });
}

function showGenerateInvoiceModal() {
    const modal = document.getElementById('generateInvoiceModal');
    if (!modal) {
        alert('Generate invoice modal not found');
        return;
    }
    
    modal.style.display = 'block';
    
    const dueDate = document.getElementById('invoiceDueDate');
    if (dueDate) {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        dueDate.valueAsDate = date;
    }
    
    calculateInvoiceTotal();
}

function closeGenerateInvoiceModal() {
    const modal = document.getElementById('generateInvoiceModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('generateInvoiceForm');
    if (form) form.reset();
    
    const itemsContainer = document.getElementById('invoiceItems');
    if (itemsContainer) {
        itemsContainer.innerHTML = `
            <div class="invoice-item-row">
                <div class="form-row">
                    <div class="form-group" style="flex: 2;">
                        <label>Item/Service</label>
                        <input type="text" class="item-name" placeholder="e.g., IVF Cycle" required>
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" value="1" min="1" onchange="calculateInvoiceTotal()">
                    </div>
                    <div class="form-group">
                        <label>Unit Price (PKR)</label>
                        <input type="number" class="item-price" placeholder="0" onchange="calculateInvoiceTotal()">
                    </div>
                    <div class="form-group">
                        <label>Total</label>
                        <input type="number" class="item-total" readonly>
                    </div>
                </div>
            </div>
        `;
    }
    hideError('generateInvoiceError');
}

function addInvoiceItem() {
    const container = document.getElementById('invoiceItems');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item-row';
    newItem.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label>Item/Service</label>
                <input type="text" class="item-name" placeholder="e.g., Medications" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" class="item-quantity" value="1" min="1" onchange="calculateInvoiceTotal()">
            </div>
            <div class="form-group">
                <label>Unit Price (PKR)</label>
                <input type="number" class="item-price" placeholder="0" onchange="calculateInvoiceTotal()">
            </div>
            <div class="form-group">
                <label>Total</label>
                <input type="number" class="item-total" readonly>
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.invoice-item-row').remove(); calculateInvoiceTotal();" style="margin-top: 25px;">×</button>
        </div>
    `;
    container.appendChild(newItem);
}

function calculateInvoiceTotal() {
    let subtotal = 0;
    
    const rows = document.querySelectorAll('.invoice-item-row');
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const itemTotal = quantity * price;
        
        row.querySelector('.item-total').value = itemTotal;
        subtotal += itemTotal;
    });
    
    const discount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    const total = subtotal - discount;
    
    const subtotalElem = document.getElementById('invoiceSubtotal');
    const totalElem = document.getElementById('invoiceTotal');
    
    if (subtotalElem) subtotalElem.textContent = `PKR ${subtotal.toLocaleString()}`;
    if (totalElem) totalElem.textContent = `PKR ${total.toLocaleString()}`;
}

function setupGenerateInvoiceForm() {
    const form = document.getElementById('generateInvoiceForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('generateInvoiceError');
        
        const items = [];
        document.querySelectorAll('.invoice-item-row').forEach(row => {
            const name = row.querySelector('.item-name').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value);
            const unitPrice = parseFloat(row.querySelector('.item-price').value);
            const total = parseFloat(row.querySelector('.item-total').value);
            
            if (name && quantity && unitPrice) {
                items.push({ name, quantity, unitPrice, total });
            }
        });
        
        if (items.length === 0) {
            showError('generateInvoiceError', 'Please add at least one item');
            return;
        }
        
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const discountAmount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
        const totalAmount = subtotal - discountAmount;
        
        const formData = {
            patientId: patientId,
            items: items,
            subtotal: subtotal,
            taxAmount: 0,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            dueDate: document.getElementById('invoiceDueDate').value,
            notes: document.getElementById('invoiceNotes').value
        };
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Generating...';
        
        try {
            await apiCall('/treatments/invoice', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            closeGenerateInvoiceModal();
            loadBilling();
            loadPatientDetails();
            alert('Invoice generated successfully!');
        } catch (error) {
            showError('generateInvoiceError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Generate Invoice';
        }
    });
}

function showRecordPaymentModal(invoiceId, invoiceNumber, total, paid, outstanding) {
    currentInvoiceId = invoiceId;
    
    const modal = document.getElementById('recordPaymentModal');
    if (!modal) {
        alert('Payment modal not found');
        return;
    }
    
    document.getElementById('paymentInvoiceId').value = invoiceId;
    document.getElementById('paymentInvoiceNumber').textContent = invoiceNumber;
    document.getElementById('paymentInvoiceTotal').textContent = `PKR ${total.toLocaleString()}`;
    document.getElementById('paymentInvoicePaid').textContent = `PKR ${paid.toLocaleString()}`;
    document.getElementById('paymentInvoiceOutstanding').textContent = `PKR ${outstanding.toLocaleString()}`;
    document.getElementById('paymentAmount').value = outstanding;
    
    modal.style.display = 'block';
}

function closeRecordPaymentModal() {
    const modal = document.getElementById('recordPaymentModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('recordPaymentForm');
    if (form) form.reset();
    hideError('recordPaymentError');
}

function setupRecordPaymentForm() {
    const form = document.getElementById('recordPaymentForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('recordPaymentError');
        
        const invoiceId = document.getElementById('paymentInvoiceId').value;
        const amountPaid = parseFloat(document.getElementById('paymentAmount').value);
        const paymentMethod = document.getElementById('paymentMethodSelect').value;
        
        if (!amountPaid || amountPaid <= 0) {
            showError('recordPaymentError', 'Please enter a valid payment amount');
            return;
        }
        
        const formData = {
            amountPaid: amountPaid,
            paymentMethod: paymentMethod
        };
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        try {
            const data = await apiCall(`/treatments/invoice/${invoiceId}/payment`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            closeRecordPaymentModal();
            loadBilling();
            loadPatientDetails();
            loadPayments();
            
            if (data && data.receipt) {
                viewReceipt(data.receipt.id);
            } else {
                alert('Payment recorded successfully!');
            }
        } catch (error) {
            showError('recordPaymentError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Record Payment & Generate Receipt';
        }
    });
}

function showAddPaymentModal() {
    alert('Add direct payment - coming soon!');
}
