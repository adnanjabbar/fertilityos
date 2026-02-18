let patientData = {};
let uploadedDocuments = [];
let createdPatientId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    setupFileUpload();
    
    // Pre-fill consultation fee from demographics form
    const consultationFee = document.getElementById('consultationFee');
    if (consultationFee) {
        consultationFee.addEventListener('change', function() {
            document.getElementById('paymentAmount').value = this.value;
        });
    }
});

function nextStep(stepNumber) {
    hideError('step1Error');
    hideError('step2Error');
    hideError('step3Error');
    hideError('step4Error');
    
    // Validate current step before proceeding
    const currentStep = getCurrentStep();
    
    if (currentStep === 1) {
        if (!validateDemographics()) return;
        saveDemographicsData();
    } else if (currentStep === 2) {
        saveMedicalHistoryData();
    } else if (currentStep === 3) {
        // Documents are optional
    }
    
    showStep(stepNumber);
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

function getCurrentStep() {
    const activeStep = document.querySelector('.intake-step.active');
    return parseInt(activeStep.id.replace('step', ''));
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.intake-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show selected step
    document.getElementById('step' + stepNumber).classList.add('active');
    
    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
        const stepNum = parseInt(step.dataset.step);
        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function validateDemographics() {
    const fullName = document.getElementById('fullName').value;
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const phone = document.getElementById('phone').value;
    
    if (!fullName || !dateOfBirth || !phone) {
        showError('step1Error', 'Please fill in all required fields (marked with *)');
        return false;
    }
    
    return true;
}

function saveDemographicsData() {
    patientData.demographics = {
        fullName: document.getElementById('fullName').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        cnic: document.getElementById('cnic').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        mrn: document.getElementById('mrn').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        heightCm: parseFloat(document.getElementById('heightCm').value) || undefined,
        weightKg: parseFloat(document.getElementById('weightKg').value) || undefined,
        partnerName: document.getElementById('partnerName').value,
        partnerAge: parseInt(document.getElementById('partnerAge').value) || undefined,
        partnerPhone: document.getElementById('partnerPhone').value,
        referringDoctor: document.getElementById('referringDoctor').value,
        referringDoctorHospital: document.getElementById('referringHospital').value,
        referringDoctorPhone: document.getElementById('referringDoctorPhone').value,
        consultationFee: parseFloat(document.getElementById('consultationFee').value) || 0
    };
}

function saveMedicalHistoryData() {
    // Collect previous treatments
    const previousTreatments = [];
    document.querySelectorAll('.treatment-entry').forEach(entry => {
        const type = entry.querySelector('.treatment-type').value;
        const date = entry.querySelector('.treatment-date').value;
        const outcome = entry.querySelector('.treatment-outcome').value;
        
        if (type || date || outcome) {
            previousTreatments.push({ treatment: type, date, outcome });
        }
    });
    
    // Collect arrays
    const medicalConditions = document.getElementById('medicalConditions').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    
    const surgeries = document.getElementById('surgeries').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    
    const allergies = document.getElementById('allergies').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    
    patientData.medicalHistory = {
        chiefComplaint: document.getElementById('chiefComplaint').value,
        durationOfInfertility: document.getElementById('durationOfInfertility').value,
        lastMenstrualPeriod: document.getElementById('lastMenstrualPeriod').value || undefined,
        cycleLengthDays: parseInt(document.getElementById('cycleLengthDays').value) || undefined,
        cycleRegularity: document.getElementById('cycleRegularity').value,
        menstrualHistory: document.getElementById('menstrualHistory').value,
        obstetricHistory: document.getElementById('obstetricHistory').value,
        medicalConditions: medicalConditions.length > 0 ? medicalConditions : undefined,
        surgeries: surgeries.length > 0 ? surgeries : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        familyHistory: document.getElementById('familyHistory').value,
        previousTreatments: previousTreatments.length > 0 ? previousTreatments : undefined,
        smoking: document.getElementById('smoking').value === 'true',
        alcohol: document.getElementById('alcohol').value === 'true',
        exercise: document.getElementById('exercise').value
    };
}

function addTreatmentEntry() {
    const container = document.getElementById('previousTreatments');
    const newEntry = document.createElement('div');
    newEntry.className = 'treatment-entry';
    newEntry.style.marginTop = '15px';
    newEntry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Treatment Type</label>
                <input type="text" class="treatment-type" placeholder="e.g., IUI, IVF">
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="text" class="treatment-date" placeholder="e.g., Jan 2024">
            </div>
            <div class="form-group">
                <label>Outcome</label>
                <input type="text" class="treatment-outcome" placeholder="e.g., Negative">
            </div>
        </div>
    `;
    container.appendChild(newEntry);
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#f0f4ff';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '';
        const files = e.dataTransfer.files;
        handleFiles({ target: { files } });
    });
}

function handleFiles(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedDocuments.push({
                name: file.name,
                type: file.type,
                size: file.size,
                base64: event.target.result
            });
            displayUploadedFile(file);
        };
        reader.readAsDataURL(file);
    });
}

function displayUploadedFile(file) {
    const container = document.getElementById('uploadedFiles');
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file-item';
    fileDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">📄</span>
                <div>
                    <div style="font-weight: 500;">${file.name}</div>
                    <div style="font-size: 12px; color: #64748b;">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeFile('${file.name}')">Remove</button>
        </div>
    `;
    container.appendChild(fileDiv);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function removeFile(fileName) {
    uploadedDocuments = uploadedDocuments.filter(doc => doc.name !== fileName);
    // Re-render uploaded files
    document.getElementById('uploadedFiles').innerHTML = '';
    uploadedDocuments.forEach(doc => {
        displayUploadedFile({ name: doc.name, size: doc.size });
    });
}

async function completeIntake() {
    hideError('step4Error');
    hideError('step4Success');
    
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const serviceDescription = document.getElementById('serviceDescription').value;
    
    if (!paymentAmount || !paymentMethod) {
        showError('step4Error', 'Please enter payment amount and method');
        return;
    }
    
    const completeBtn = document.getElementById('completeBtn');
    completeBtn.disabled = true;
    completeBtn.textContent = 'Processing...';
    
    try {
        // Step 1: Register patient
        const patientResponse = await apiCall('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData.demographics)
        });
        
        if (!patientResponse) throw new Error('Failed to register patient');
        
        createdPatientId = patientResponse.patient.id;
        
        // Step 2: Save medical history
        if (patientData.medicalHistory) {
            await apiCall(`/medical-history/${createdPatientId}`, {
                method: 'POST',
                body: JSON.stringify(patientData.medicalHistory)
            });
        }
        
        // Step 3: Upload documents
        for (const doc of uploadedDocuments) {
            await apiCall(`/documents/patient/${createdPatientId}`, {
                method: 'POST',
                body: JSON.stringify({
                    documentType: 'previous_report',
                    documentName: doc.name,
                    base64Data: doc.base64,
                    uploadedDate: new Date().toISOString().split('T')[0],
                    description: 'Uploaded during patient intake'
                })
            });
        }
        
        // Step 4: Generate receipt
        const receiptResponse = await apiCall('/receipts', {
            method: 'POST',
            body: JSON.stringify({
                patientId: createdPatientId,
                amountPaid: paymentAmount,
                paymentMethod: paymentMethod,
                serviceType: 'consultation',
                serviceDescription: serviceDescription
            })
        });
        
        // Show success and receipt
        document.getElementById('step4Success').textContent = 'Patient registered successfully!';
        document.getElementById('step4Success').style.display = 'block';
        
        displayReceipt(receiptResponse.receipt);
        
        completeBtn.textContent = 'Completed ✓';
        
    } catch (error) {
        console.error('Complete intake error:', error);
        showError('step4Error', error.message || 'Error completing registration');
        completeBtn.disabled = false;
        completeBtn.textContent = 'Complete Registration & Generate Receipt';
    }
}

function displayReceipt(receipt) {
    const receiptPreview = document.getElementById('receiptPreview');
    
    receiptPreview.innerHTML = `
        <div class="card">
            <div class="card-header" style="background: #667eea; color: white;">
                <h2>Receipt Generated</h2>
            </div>
            <div class="card-body">
                <div id="receiptContent" style="background: white; padding: 40px; border: 2px solid #e2e8f0; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #667eea; margin: 0;">🏥 ${receipt.clinic.clinic_name}</h1>
                        <p style="margin: 5px 0;">${receipt.clinic.address}, ${receipt.clinic.city}</p>
                        <p style="margin: 5px 0;">Phone: ${receipt.clinic.phone} | Email: ${receipt.clinic.email}</p>
                        <p style="margin: 5px 0; font-size: 12px;">License: ${receipt.clinic.license_number}</p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: 1px solid #e2e8f0;">
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div>
                            <h3 style="color: #667eea; margin-bottom: 10px;">RECEIPT</h3>
                            <p style="margin: 5px 0;"><strong>Receipt No:</strong> ${receipt.receipt_number}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(receipt.receipt_date)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 5px 0;"><strong>Patient:</strong> ${receipt.patient.name}</p>
                            <p style="margin: 5px 0;"><strong>Patient Code:</strong> ${receipt.patient.code}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${receipt.patient.phone}</p>
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
                        <p>Thank you for choosing ${receipt.clinic.clinic_name}</p>
                        <p>This is a computer-generated receipt.</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-primary" onclick="printReceipt()">🖨️ Print Receipt</button>
                    <button class="btn btn-secondary" onclick="window.location.href='patients.html'">View All Patients</button>
                    <button class="btn btn-secondary" onclick="viewPatientDetails()">View Patient Details</button>
                </div>
            </div>
        </div>
    `;
    
    receiptPreview.style.display = 'block';
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Receipt</title>');
    printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function viewPatientDetails() {
    if (createdPatientId) {
        window.location.href = `patient-details.html?id=${createdPatientId}`;
    }
}
// CNIC Formatting: xxxxx-xxxxxxx-x
function formatCNIC(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5);
    }
    if (value.length > 13) {
        value = value.substring(0, 13) + '-' + value.substring(13);
    }
    
    input.value = value.substring(0, 15); // xxxxx-xxxxxxx-x = 15 chars
    
// Auto-detect gender from last digit
    if (value.length === 15) {
        const lastDigit = parseInt(value.charAt(14));
        const genderField = document.getElementById('gender');
        if (genderField) {
            // Odd = Male, Even = Female
            genderField.value = (lastDigit % 2 === 1) ? 'Male' : 'Female';
        }
    }
}

// Phone Formatting: xxxx-xxxxxxx (Pakistan mobile)
function formatPhone(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Ensure it starts with 0
    if (value.length > 0 && value.charAt(0) !== '0') {
        value = '0' + value;
    }
    
    if (value.length > 4) {
        value = value.substring(0, 4) + '-' + value.substring(4);
    }
    
    input.value = value.substring(0, 12); // xxxx-xxxxxxx = 12 chars
}
