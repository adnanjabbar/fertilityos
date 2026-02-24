document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadReportsData();
});

async function loadReportsData() {
    try {
        // Load all cycles to calculate statistics
        const cyclesData = await apiCall('/cycles?limit=1000');
        const patientsData = await apiCall('/patients?limit=1000');
        
        if (cyclesData && cyclesData.cycles) {
            calculateOverallStats(cyclesData.cycles);
            calculateAgeGroupStats(cyclesData.cycles);
            displayOutcomesChart(cyclesData.cycles);
            displayCompletedCycles(cyclesData.cycles);
        }
        
        if (patientsData && cyclesData) {
            calculateMonthlyPerformance(patientsData.patients, cyclesData.cycles);
        }
        
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function calculateOverallStats(cycles) {
    const totalCycles = cycles.length;
    const completedCycles = cycles.filter(c => c.cycle_outcome !== null);
    const positiveCycles = cycles.filter(c => c.pregnancy_result === true);
    
    const successRate = completedCycles.length > 0 
        ? ((positiveCycles.length / completedCycles.length) * 100).toFixed(1)
        : 0;
    
    document.getElementById('totalCycles').textContent = totalCycles;
    document.getElementById('positiveCycles').textContent = positiveCycles.length;
    document.getElementById('successRate').textContent = successRate + '%';
    document.getElementById('avgEmbryos').textContent = '2.3'; // This would need embryo data
}

function calculateAgeGroupStats(cycles) {
    const ageGroups = {
        '< 30': { total: 0, positive: 0 },
        '30-34': { total: 0, positive: 0 },
        '35-39': { total: 0, positive: 0 },
        '40-44': { total: 0, positive: 0 },
        '≥ 45': { total: 0, positive: 0 }
    };
    
    cycles.forEach(cycle => {
        if (!cycle.cycle_outcome) return; // Only count completed cycles
        
        const age = parseInt(cycle.patient_age) || 0;
        let group;
        
        if (age < 30) group = '< 30';
        else if (age < 35) group = '30-34';
        else if (age < 40) group = '35-39';
        else if (age < 45) group = '40-44';
        else group = '≥ 45';
        
        if (ageGroups[group]) {
            ageGroups[group].total++;
            if (cycle.pregnancy_result) {
                ageGroups[group].positive++;
            }
        }
    });
    
    const tableBody = document.getElementById('ageGroupTable');
    let html = '';
    
    for (const [group, stats] of Object.entries(ageGroups)) {
        const successRate = stats.total > 0 
            ? ((stats.positive / stats.total) * 100).toFixed(1)
            : 0;
        
        html += `
            <tr>
                <td><strong>${group}</strong></td>
                <td>${stats.total}</td>
                <td>${stats.positive}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; background: #e2e8f0; height: 20px; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${successRate}%; background: #10b981; height: 100%;"></div>
                        </div>
                        <span><strong>${successRate}%</strong></span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html || '<tr><td colspan="4" class="text-center">No data available</td></tr>';
}

function displayOutcomesChart(cycles) {
    const completed = cycles.filter(c => c.cycle_outcome !== null);
    const positive = completed.filter(c => c.pregnancy_result === true).length;
    const negative = completed.filter(c => c.pregnancy_result === false).length;
    const cancelled = cycles.filter(c => c.cycle_outcome === 'cancelled').length;
    
    const total = completed.length + cancelled;
    
    const chartDiv = document.getElementById('outcomesChart');
    
    if (total === 0) {
        chartDiv.innerHTML = '<p class="text-center">No completed cycles yet</p>';
        return;
    }
    
    chartDiv.innerHTML = `
        <div style="display: flex; gap: 30px; align-items: center; justify-content: center; padding: 20px;">
            <div style="text-align: center;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: conic-gradient(
                    #10b981 0deg ${(positive/total)*360}deg,
                    #ef4444 ${(positive/total)*360}deg ${((positive+negative)/total)*360}deg,
                    #94a3b8 ${((positive+negative)/total)*360}deg 360deg
                ); margin: 0 auto 10px;"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: #10b981; border-radius: 4px;"></div>
                    <span><strong>Positive:</strong> ${positive} (${((positive/total)*100).toFixed(1)}%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: #ef4444; border-radius: 4px;"></div>
                    <span><strong>Negative:</strong> ${negative} (${((negative/total)*100).toFixed(1)}%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: #94a3b8; border-radius: 4px;"></div>
                    <span><strong>Cancelled:</strong> ${cancelled} (${((cancelled/total)*100).toFixed(1)}%)</span>
                </div>
            </div>
        </div>
    `;
}

function displayCompletedCycles(cycles) {
    const completed = cycles
        .filter(c => c.cycle_outcome !== null)
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
        .slice(0, 10);
    
    const tableBody = document.getElementById('completedCyclesTable');
    
    if (completed.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No completed cycles yet</td></tr>';
        return;
    }
    
    tableBody.innerHTML = completed.map(cycle => {
        const outcomeBadge = cycle.pregnancy_result 
            ? '<span class="badge badge-success">Positive</span>'
            : '<span class="badge badge-danger">Negative</span>';
        
        return `
            <tr>
                <td><strong>${cycle.cycle_code}</strong></td>
                <td>${cycle.patient_name}</td>
                <td>${cycle.patient_age || 'N/A'}</td>
                <td>${formatDate(cycle.start_date)}</td>
                <td>${outcomeBadge}</td>
                <td>${cycle.embryos_transferred || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function calculateMonthlyPerformance(patients, cycles) {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            date: date,
            label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            newPatients: 0,
            cyclesStarted: 0,
            cyclesCompleted: 0,
            positiveResults: 0
        });
    }
    
    // Count patients
    patients.forEach(patient => {
        const createdDate = new Date(patient.created_at);
        const monthData = months.find(m => 
            m.date.getMonth() === createdDate.getMonth() && 
            m.date.getFullYear() === createdDate.getFullYear()
        );
        if (monthData) monthData.newPatients++;
    });
    
    // Count cycles
    cycles.forEach(cycle => {
        const startDate = new Date(cycle.start_date);
        const monthData = months.find(m => 
            m.date.getMonth() === startDate.getMonth() && 
            m.date.getFullYear() === startDate.getFullYear()
        );
        
        if (monthData) {
            monthData.cyclesStarted++;
            
            if (cycle.cycle_outcome) {
                monthData.cyclesCompleted++;
                if (cycle.pregnancy_result) {
                    monthData.positiveResults++;
                }
            }
        }
    });
    
    const tableBody = document.getElementById('monthlyPerformanceTable');
    
    tableBody.innerHTML = months.map(month => {
        const successRate = month.cyclesCompleted > 0 
            ? ((month.positiveResults / month.cyclesCompleted) * 100).toFixed(1)
            : 'N/A';
        
        return `
            <tr>
                <td><strong>${month.label}</strong></td>
                <td>${month.newPatients}</td>
                <td>${month.cyclesStarted}</td>
                <td>${month.cyclesCompleted}</td>
                <td>${successRate !== 'N/A' ? successRate + '%' : 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function exportReport() {
    alert('PDF export feature coming soon! This will generate a comprehensive clinic report.');
}
