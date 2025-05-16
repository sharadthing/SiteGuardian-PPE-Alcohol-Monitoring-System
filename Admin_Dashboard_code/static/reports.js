// Initializes charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
    
    // Initialize charts
    initializeCharts();
    populateViolationTable();
});

function initializeCharts() {
    // Sample data - this would come from your API in real implementation
    const complianceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'PPE Compliance Rate',
            data: [85, 82, 90, 88, 87, 92, 89],
            backgroundColor: 'rgba(5, 150, 105, 0.2)',
            borderColor: 'rgba(5, 150, 105, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    };
    
    const violationData = {
        labels: ['Helmet', 'Goggles', 'Vest', 'Gloves', 'Boots', 'Mask'],
        datasets: [{
            label: 'Violation Count',
            data: [12, 20, 8, 5, 3, 9],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    const workerData = {
        labels: ['Worker 101', 'Worker 205', 'Worker 312', 'Worker 178', 'Worker 423', 'Worker 89', 'Worker 256'],
        datasets: [{
            label: 'Compliance Rate %',
            data: [95, 93, 89, 87, 85, 82, 80],
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(5, 150, 105, 1)',
            borderWidth: 1
        }]
    };
    
    const departmentData = {
        labels: ['Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Welding', 'General'],
        datasets: [{
            label: 'Average Compliance %',
            data: [92, 88, 85, 90, 82, 89],
            backgroundColor: [
                'rgba(5, 150, 105, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(52, 211, 153, 0.7)',
                'rgba(110, 231, 183, 0.7)',
                'rgba(167, 243, 208, 0.7)',
                'rgba(209, 250, 229, 0.7)'
            ],
            borderColor: [
                'rgba(5, 150, 105, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(52, 211, 153, 1)',
                'rgba(110, 231, 183, 1)',
                'rgba(167, 243, 208, 1)',
                'rgba(209, 250, 229, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Create charts
    const complianceCtx = document.getElementById('complianceChart').getContext('2d');
    const violationCtx = document.getElementById('violationChart').getContext('2d');
    const workerCtx = document.getElementById('workerChart').getContext('2d');
    const departmentCtx = document.getElementById('departmentChart').getContext('2d');
    
    window.complianceChart = new Chart(complianceCtx, {
        type: 'line',
        data: complianceData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    window.violationChart = new Chart(violationCtx, {
        type: 'doughnut',
        data: violationData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            },
            cutout: '70%'
        }
    });
    
    window.workerChart = new Chart(workerCtx, {
        type: 'bar',
        data: workerData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 75,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    window.departmentChart = new Chart(departmentCtx, {
        type: 'pie',
        data: departmentData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

function populateViolationTable() {
    // Sample violation data - replace with your actual data
    const violations = [
        { datetime: '2023-06-15 08:23', workerId: 'W-101', name: 'Rajesh Gurung', violation: 'Goggles', location: 'Zone A', status: 'Resolved' },
        { datetime: '2023-06-15 09:45', workerId: 'W-205', name: 'Sunita Rai', violation: 'Helmet', location: 'Zone C', status: 'Pending' },
        { datetime: '2023-06-15 10:12', workerId: 'W-312', name: 'Nischal Thapa', violation: 'Vest', location: 'Zone B', status: 'Resolved' },
        { datetime: '2023-06-15 11:30', workerId: 'W-178', name: 'Bimal Sharma', violation: 'Gloves', location: 'Zone D', status: 'Pending' },
        { datetime: '2023-06-15 13:15', workerId: 'W-423', name: 'Anita Limbu', violation: 'Goggles', location: 'Zone A', status: 'Resolved' },
        { datetime: '2023-06-15 14:40', workerId: 'W-89', name: 'Prakash Rai', violation: 'Boots', location: 'Zone E', status: 'Pending' },
        { datetime: '2023-06-15 15:22', workerId: 'W-256', name: 'Sita Magar', violation: 'Mask', location: 'Zone C', status: 'Resolved' },
        { datetime: '2023-06-16 08:05', workerId: 'W-101', name: 'Rajesh Gurung', violation: 'Goggles', location: 'Zone A', status: 'Pending' },
        { datetime: '2023-06-16 09:18', workerId: 'W-312', name: 'Nischal Thapa', violation: 'Helmet', location: 'Zone B', status: 'Resolved' },
        { datetime: '2023-06-16 10:45', workerId: 'W-423', name: 'Anita Limbu', violation: 'Vest', location: 'Zone D', status: 'Pending' }
    ];
    
    const tableBody = document.getElementById('violationTableBody');
    tableBody.innerHTML = '';
    
    violations.forEach(violation => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-emerald-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">${violation.datetime}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">${violation.workerId}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">${violation.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getViolationColor(violation.violation)}">
                    ${violation.violation}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">${violation.location}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-900">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(violation.status)}">
                    ${violation.status}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update pagination info
    document.getElementById('totalItems').textContent = violations.length;
    document.getElementById('startItem').textContent = 1;
    document.getElementById('endItem').textContent = Math.min(10, violations.length);
}

function getViolationColor(violation) {
    const colors = {
        'Helmet': 'bg-red-100 text-red-800',
        'Goggles': 'bg-blue-100 text-blue-800',
        'Vest': 'bg-yellow-100 text-yellow-800',
        'Gloves': 'bg-green-100 text-green-800',
        'Boots': 'bg-purple-100 text-purple-800',
        'Mask': 'bg-orange-100 text-orange-800'
    };
    return colors[violation] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status) {
    return status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
}

function updateCharts() {
    // In a real implementation, this would fetch new data based on the selected date range
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    console.log(`Updating charts with date range: ${startDate} to ${endDate}`);
    
    // Simulate data update
    const newComplianceData = Array.from({length: 7}, () => Math.floor(Math.random() * 15) + 80);
    window.complianceChart.data.datasets[0].data = newComplianceData;
    window.complianceChart.update();
    
    // Update stats
    document.getElementById('totalViolations').textContent = Math.floor(Math.random() * 20) + 40;
    document.getElementById('avgCompliance').textContent = `${Math.floor(Math.random() * 5) + 85}%`;
    
    // Show loading effect
    const applyBtn = document.querySelector('#endDate').nextElementSibling;
    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
    applyBtn.disabled = true;
    
    setTimeout(() => {
        applyBtn.innerHTML = 'Apply';
        applyBtn.disabled = false;
    }, 1000);
}

function downloadReport() {
    console.log('Generating CSV report...');
    // In a real implementation, this would generate a CSV from the data
    
    // Show loading effect
    const exportBtn = document.querySelector('#violationTableBody').previousElementSibling.querySelector('button');
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting';
    exportBtn.disabled = true;
    
    setTimeout(() => {
        exportBtn.innerHTML = 'Export as CSV';
        exportBtn.disabled = false;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,Date,Worker ID,Name,Violation Type,Location,Status\n' + 
                     '2023-06-15 08:23,W-101,Rajesh Gurung,Goggles,Zone A,Resolved\n' +
                     '2023-06-15 09:45,W-205,Sunita Rai,Helmet,Zone C,Pending\n' +
                     '2023-06-15 10:12,W-312,Nischal Thapa,Vest,Zone B,Resolved\n' +
                     '2023-06-15 11:30,W-178,Bimal Sharma,Gloves,Zone D,Pending\n' +
                     '2023-06-15 13:15,W-423,Anita Limbu,Goggles,Zone A,Resolved';
        link.download = `ppe_violations_report_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 1500);
}

function previousPage() {
    console.log('Previous page');
    // Implement pagination logic
}

function nextPage() {
    console.log('Next page');
    // Implement pagination logic
}
