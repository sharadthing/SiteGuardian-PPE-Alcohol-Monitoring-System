document.addEventListener('DOMContentLoaded', function() {
    // Sample worker data
    const workers = [
      {
        id: "1",
        personal_info: {
          full_name: "Sunita Rai",
          date_of_birth: "1992-05-20",
          job_title: "General Worker",
          gender: "Female",
          nationality: "Nepali",
          blood_group: "O+"
        },
        emergency_contact: {
          name: "Bikash Rai",
          number: "+447845671236",
          relationship: "Husband"
        },
        contact_info: {
          phone: "+447766778891",
          email: "sunita.rai@example.com",
          address: "25 Camden High Street, London NW1 7JE"
        },
        site_access: {
          site_id: "OLY-1313",
          worker_id: "1313",
          site_name: "Olympic Park Development",
          working_status: "on",
          created_at: "2025-03-30T03:04:40.663Z"
        }
      },
      {
        id: "2",
        personal_info: {
          full_name: "Rajesh Gurung",
          date_of_birth: "1988-11-15",
          job_title: "Supervisor",
          gender: "Male",
          nationality: "Nepali",
          blood_group: "B+"
        },
        emergency_contact: {
          name: "Sita Gurung",
          number: "+447845671237",
          relationship: "Wife"
        },
        contact_info: {
          phone: "+447766778892",
          email: "rajesh.gurung@example.com",
          address: "30 Baker Street, London NW1 6XE"
        },
        site_access: {
          site_id: "OLY-1312",
          worker_id: "1312",
          site_name: "Olympic Park Development",
          working_status: "on",
          created_at: "2025-03-28T08:15:22.123Z"
        }
      },
      {
        id: "3",
        personal_info: {
          full_name: "Nischal Thapa",
          date_of_birth: "1990-07-22",
          job_title: "Safety Officer",
          gender: "Male",
          nationality: "Nepali",
          blood_group: "A+"
        },
        emergency_contact: {
          name: "Puja Thapa",
          number: "+447845671238",
          relationship: "Sister"
        },
        contact_info: {
          phone: "+447766778893",
          email: "nischal.thapa@example.com",
          address: "15 Oxford Street, London W1D 1AU"
        },
        site_access: {
          site_id: "OLY-1314",
          worker_id: "1314",
          site_name: "Olympic Park Development",
          working_status: "suspended",
          created_at: "2025-04-01T11:45:18.456Z"
        }
      }
    ];
  
    // DOM Elements
    const workersTableBody = document.getElementById('workersTableBody');
    const workerModal = document.getElementById('workerModal');
    const confirmModal = document.getElementById('confirmModal');
    const workerForm = document.getElementById('workerForm');
    const addWorkerBtn = document.getElementById('addWorkerBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelWorkerBtn = document.getElementById('cancelWorkerBtn');
    const confirmCancel = document.getElementById('confirmCancel');
    const tabButtons = document.querySelectorAll('.tab-button');
    const searchInput = document.querySelector('input[type="text"]');
    
    // Current state
    let currentWorkerId = null;
    let currentAction = null;
    let currentTab = 'all-workers';
    let currentSearchTerm = '';
  
    // Initialize the page
    function init() {
      renderWorkersTable();
      setupEventListeners();
    }
  
    // Render workers table based on current filters
    function renderWorkersTable() {
      workersTableBody.innerHTML = '';
      
      const filteredWorkers = workers.filter(worker => {
        // Filter by tab
        if (currentTab === 'on-site' && worker.site_access.working_status !== 'on') return false;
        if (currentTab === 'off-site' && worker.site_access.working_status !== 'off') return false;
        if (currentTab === 'suspended' && worker.site_access.working_status !== 'suspended') return false;
        
        // Filter by search term
        if (currentSearchTerm) {
          const searchLower = currentSearchTerm.toLowerCase();
          const matchesName = worker.personal_info.full_name.toLowerCase().includes(searchLower);
          const matchesId = worker.site_access.worker_id.toLowerCase().includes(searchLower);
          const matchesEmail = worker.contact_info.email.toLowerCase().includes(searchLower);
          
          if (!matchesName && !matchesId && !matchesEmail) return false;
        }
        
        return true;
      });
      
      if (filteredWorkers.length === 0) {
        workersTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
              No workers found matching your criteria
            </td>
          </tr>
        `;
        return;
      }
      
      filteredWorkers.forEach(worker => {
        const row = document.createElement('tr');
        row.className = 'worker-table-row hover:bg-gray-50';
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=${encodeURIComponent(worker.personal_info.full_name)}&background=059669&color=fff" alt="">
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${worker.personal_info.full_name}</div>
                <div class="text-sm text-gray-500">${worker.contact_info.email}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${worker.site_access.worker_id}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${worker.personal_info.job_title}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${worker.site_access.site_name}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="status-badge ${getStatusClass(worker.site_access.working_status)}">
              ${getStatusText(worker.site_access.working_status)}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${formatDate(worker.site_access.created_at)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-emerald-600 hover:text-emerald-900 mr-3 edit-worker" data-id="${worker.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 delete-worker" data-id="${worker.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        workersTableBody.appendChild(row);
      });
      
      // Add event listeners to action buttons
      document.querySelectorAll('.edit-worker').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const workerId = e.currentTarget.getAttribute('data-id');
          editWorker(workerId);
        });
      });
      
      document.querySelectorAll('.delete-worker').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const workerId = e.currentTarget.getAttribute('data-id');
          showConfirmModal(
            'Delete Worker',
            'Are you sure you want to delete this worker? This action cannot be undone.',
            () => deleteWorker(workerId)
          );
        });
      });
    }
  
    // Helper functions
    function getStatusClass(status) {
      switch(status) {
        case 'on': return 'bg-green-100 text-green-800';
        case 'off': return 'bg-blue-100 text-blue-800';
        case 'suspended': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  
    function getStatusText(status) {
      switch(status) {
        case 'on': return 'On Site';
        case 'off': return 'Off Site';
        case 'suspended': return 'Suspended';
        default: return 'Unknown';
      }
    }
  
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  
    // Worker CRUD operations
    function addWorker() {
      currentWorkerId = null;
      document.getElementById('modalTitle').textContent = 'Add New Worker';
      workerForm.reset();
      workerModal.classList.remove('hidden');
    }
  
    function editWorker(workerId) {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) return;
      
      currentWorkerId = workerId;
      document.getElementById('modalTitle').textContent = 'Edit Worker';
      
      // Fill form with worker data
      document.getElementById('workerId').value = workerId;
      document.getElementById('fullName').value = worker.personal_info.full_name;
      document.getElementById('dateOfBirth').value = worker.personal_info.date_of_birth;
      document.getElementById('jobTitle').value = worker.personal_info.job_title;
      document.getElementById('gender').value = worker.personal_info.gender;
      document.getElementById('nationality').value = worker.personal_info.nationality;
      document.getElementById('bloodGroup').value = worker.personal_info.blood_group;
      
      document.getElementById('phone').value = worker.contact_info.phone;
      document.getElementById('email').value = worker.contact_info.email;
      document.getElementById('address').value = worker.contact_info.address;
      
      document.getElementById('emergencyName').value = worker.emergency_contact.name;
      document.getElementById('emergencyNumber').value = worker.emergency_contact.number;
      document.getElementById('emergencyRelationship').value = worker.emergency_contact.relationship;
      
      document.getElementById('siteId').value = worker.site_access.site_id;
      document.getElementById('workerIdInput').value = worker.site_access.worker_id;
      document.getElementById('siteName').value = worker.site_access.site_name;
      document.getElementById('workingStatus').value = worker.site_access.working_status;
      
      workerModal.classList.remove('hidden');
    }
  
    function saveWorker(e) {
      e.preventDefault();

      const workerData = {
        personal_info: {
          full_name: document.getElementById('fullName').value,
          date_of_birth: document.getElementById('dateOfBirth').value,
          job_title: document.getElementById('jobTitle').value,
          gender: document.getElementById('gender').value,
          nationality: document.getElementById('nationality').value,
          blood_group: document.getElementById('bloodGroup').value,
        },
        contact_info: {
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          address: document.getElementById('address').value,
        },
        emergency_contact: {
          name: document.getElementById('emergencyName').value,
          number: document.getElementById('emergencyNumber').value,
          relationship: document.getElementById('emergencyRelationship').value,
        },
        site_access: {
          site_id: document.getElementById('siteId').value,
          worker_id: document.getElementById('workerIdInput').value,
          site_name: document.getElementById('siteName').value,
          working_status: document.getElementById('workingStatus').value,
        },
      };

      if (currentWorkerId) {
        // Update existing worker
        const workerIndex = workers.findIndex((w) => w.id === currentWorkerId);
        if (workerIndex !== -1) {
          workers[workerIndex] = { ...workers[workerIndex], ...workerData };
        }
      } else {
        // Add new worker
        const newWorker = {
          id: String(workers.length + 1),
          ...workerData,
        };
        workers.push(newWorker);
      }

      // Close modal and refresh table
      workerModal.classList.add('hidden');
      renderWorkersTable();
    }
  
    function deleteWorker(workerId) {
      const workerIndex = workers.findIndex(w => w.id === workerId);
      if (workerIndex !== -1) {
        workers.splice(workerIndex, 1);
        renderWorkersTable();
      }
    }
  
    function showConfirmModal(title, message, onConfirm) {
      document.getElementById('confirmTitle').textContent = title;
      document.getElementById('confirmMessage').textContent = message;
      confirmModal.classList.remove('hidden');
      
      confirmCancel.onclick = () => {
        confirmModal.classList.add('hidden');
      };
      
      document.getElementById('confirmOk').onclick = () => {
        confirmModal.classList.add('hidden');
        onConfirm();
      };
    }
  
    function setupEventListeners() {
      addWorkerBtn.addEventListener('click', addWorker);
      closeModalBtn.addEventListener('click', () => workerModal.classList.add('hidden'));
      cancelWorkerBtn.addEventListener('click', () => workerModal.classList.add('hidden'));
      workerForm.addEventListener('submit', saveWorker);
      
      tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          currentTab = e.currentTarget.getAttribute('data-tab');
          tabButtons.forEach(btn => btn.classList.remove('active'));
          e.currentTarget.classList.add('active');
          renderWorkersTable();
        });
      });
      
      searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderWorkersTable();
      });
    }
  
    init();
});
