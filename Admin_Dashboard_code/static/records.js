document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const recordsTableBody = document.getElementById('recordsTableBody');
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const eventTypeFilter = document.getElementById('eventTypeFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const prevPageMobile = document.getElementById('prevPageMobile');
    const nextPageMobile = document.getElementById('nextPageMobile');
    const pageNumbers = document.getElementById('pageNumbers');
    const paginationInfo = document.getElementById('paginationInfo');
  
    // Pagination variables
    let currentPage = 1;
    const recordsPerPage = 10;
    let totalRecords = 0;
    let allRecords = [];
  
    // Fetch records from API
    async function fetchRecords() {
      try {
        // Show loading state
        recordsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
              <i class="fas fa-spinner fa-spin mr-2"></i> Loading records...
            </td>
          </tr>
        `;
  
        // In a real app, you would fetch from your API endpoint
        // const response = await fetch('/api/records');
        // const data = await response.json();
        
        // Simulating API call with your sample data
        const mockData = [
          {
            worker_id: "1311",
            full_name: "Nischal Thapa",
            site_name: "Olympic Park Development",
            daily_records: {
              "2025-04-04": [
                {
                  event_id: "01dd6aa4-133e-4e79-bffc-384c490462c5",
                  event_type: "clock-in",
                  timestamp: "2025-04-04T19:20:03.692Z",
                  ppe_record: null,
                  alcohol_test: null
                },
                {
                  event_id: "23ee7bb5-244f-5f8a-cggd-495d591573d6",
                  event_type: "clock-out",
                  timestamp: "2025-04-04T23:45:12.451Z",
                  ppe_record: null,
                  alcohol_test: null
                }
              ],
              "2025-04-03": [
                {
                  event_id: "34ff8cc6-355g-6h9b-dhhe-606f602684e7",
                  event_type: "clock-in",
                  timestamp: "2025-04-03T08:15:22.123Z",
                  ppe_record: {
                    compliant: true,
                    detected_items: {
                      Helmet: true,
                      Vest: true
                    }
                  },
                  alcohol_test: {
                    level: 0.0,
                    passed: true
                  }
                }
              ]
            }
          },
          // Add more mock worker data as needed
        ];
  
        // Transform the data into a flat structure for the table
        const transformedRecords = [];
        mockData.forEach(worker => {
          for (const date in worker.daily_records) {
            worker.daily_records[date].forEach(record => {
              transformedRecords.push({
                worker_id: worker.worker_id,
                full_name: worker.full_name,
                site_name: worker.site_name,
                date: date,
                ...record
              });
            });
          }
        });
  
        // Sort by timestamp (newest first)
        transformedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
        allRecords = transformedRecords;
        totalRecords = allRecords.length;
        
        // Reset to first page
        currentPage = 1;
        renderRecords();
        renderPagination();
        
      } catch (error) {
        console.error('Error fetching records:', error);
        recordsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-4 text-center text-red-500">
              <i class="fas fa-exclamation-circle mr-2"></i> Failed to load records. Please try again.
            </td>
          </tr>
        `;
      }
    }
  
    // Render records to the table
    function renderRecords() {
      // Apply filters
      let filteredRecords = [...allRecords];
      
      // Search filter
      if (searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.full_name.toLowerCase().includes(searchTerm) || 
          record.worker_id.toLowerCase().includes(searchTerm))
      }
      
      // Date filter
      if (dateFilter.value) {
        filteredRecords = filteredRecords.filter(record => 
          record.date === dateFilter.value)
      }
      
      // Event type filter
      if (eventTypeFilter.value !== 'all') {
        filteredRecords = filteredRecords.filter(record => 
          record.event_type === eventTypeFilter.value)
      }
      
      // Calculate pagination
      const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = Math.min(startIndex + recordsPerPage, filteredRecords.length);
      const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
      
      // Update total records count after filtering
      totalRecords = filteredRecords.length;
      
      // Clear the table
      recordsTableBody.innerHTML = '';
      
      if (paginatedRecords.length === 0) {
        recordsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
              No records found matching your criteria.
            </td>
          </tr>
        `;
        return;
      }
      
      // Add records to the table
      paginatedRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Format timestamp
        const eventDate = new Date(record.timestamp);
        const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = eventDate.toLocaleDateString();
        
        // Determine PPE status
        let ppeStatus = '';
        let ppeBadgeClass = 'badge-info';
        let ppeBadgeText = 'Not scanned';
        
        if (record.ppe_record) {
          if (record.ppe_record.compliant) {
            ppeBadgeClass = 'badge-success';
            ppeBadgeText = 'Compliant';
          } else {
            ppeBadgeClass = 'badge-danger';
            ppeBadgeText = 'Non-compliant';
          }
        } else if (record.event_type === 'clock-in' || record.event_type === 'clock-out') {
          ppeBadgeText = 'Not scanned';
        }
        
        // Determine event type display
        let eventDisplay = '';
        let eventClass = '';
        
        switch(record.event_type) {
          case 'clock-in':
            eventDisplay = 'Clock In';
            eventClass = 'badge-success';
            break;
          case 'clock-out':
            eventDisplay = 'Clock Out';
            eventClass = 'badge-danger';
            break;
          case 'ppe-scan':
            eventDisplay = 'PPE Scan';
            eventClass = 'badge-info';
            break;
          default:
            eventDisplay = record.event_type;
            eventClass = 'badge-warning';
        }
        
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span class="text-emerald-800 font-medium">${record.full_name.charAt(0)}</span>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${record.full_name}</div>
                <div class="text-sm text-gray-500">ID: ${record.worker_id}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="${eventClass} badge">${eventDisplay}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${dateString}</div>
            <div class="text-sm text-gray-500">${timeString}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="${ppeBadgeClass} badge">${ppeBadgeText}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${record.site_name}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-emerald-600 hover:text-emerald-900 mr-3 view-details" data-id="${record.event_id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-blue-600 hover:text-blue-900 export-record" data-id="${record.event_id}">
              <i class="fas fa-file-export"></i>
            </button>
          </td>
        `;
        
        recordsTableBody.appendChild(row);
      });
      
      // Add event listeners to detail buttons
      document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', (e) => {
          const eventId = e.currentTarget.getAttribute('data-id');
          viewRecordDetails(eventId);
        });
      });
    }
    
    // View record details
    function viewRecordDetails(eventId) {
      const record = allRecords.find(r => r.event_id === eventId);
      if (!record) return;
      
      // In a real app, you would show a modal with detailed info
      alert(`Showing details for record: ${eventId}\nWorker: ${record.full_name}\nEvent: ${record.event_type}\nTime: ${new Date(record.timestamp).toLocaleString()}`);
    }
    
    // Render pagination controls
    function renderPagination() {
      const totalPages = Math.ceil(totalRecords / recordsPerPage);
      
      // Update pagination info
      const startRecord = (currentPage - 1) * recordsPerPage + 1;
      const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
      paginationInfo.textContent = `Showing ${startRecord} to ${endRecord} of ${totalRecords} records`;
      
      // Clear existing page numbers
      pageNumbers.innerHTML = '';
      
      // Add page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i ? 'bg-emerald-50 border-emerald-500 text-emerald-600 z-10' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderRecords();
          renderPagination();
        });
        pageNumbers.appendChild(pageBtn);
      }
      
      // Enable/disable previous button
      prevPage.disabled = currentPage === 1;
      prevPageMobile.disabled = currentPage === 1;
      prevPage.classList.toggle('opacity-50', currentPage === 1);
      prevPageMobile.classList.toggle('opacity-50', currentPage === 1);
      
      // Enable/disable next button
      nextPage.disabled = currentPage === totalPages;
      nextPageMobile.disabled = currentPage === totalPages;
      nextPage.classList.toggle('opacity-50', currentPage === totalPages);
      nextPageMobile.classList.toggle('opacity-50', currentPage === totalPages);
    }
    
    // Event listeners
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderRecords();
      renderPagination();
    });
    
    dateFilter.addEventListener('change', () => {
      currentPage = 1;
      renderRecords();
      renderPagination();
    });
    
    eventTypeFilter.addEventListener('change', () => {
      currentPage = 1;
      renderRecords();
      renderPagination();
    });
    
    refreshBtn.addEventListener('click', fetchRecords);
    
    exportBtn.addEventListener('click', () => {
      // In a real app, you would implement export functionality
      alert('Export functionality would be implemented here');
    });
    
    prevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderRecords();
        renderPagination();
      }
    });
    
    nextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(totalRecords / recordsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderRecords();
        renderPagination();
      }
    });
    
    prevPageMobile.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderRecords();
        renderPagination();
      }
    });
    
    nextPageMobile.addEventListener('click', () => {
      const totalPages = Math.ceil(totalRecords / recordsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderRecords();
        renderPagination();
      }
    });
    
    // Initialize
    fetchRecords();
    
    // Set today's date as default in date filter
    const today = new Date();
    dateFilter.valueAsDate = today;
  });