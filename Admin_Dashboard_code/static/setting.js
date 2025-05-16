// Toggle mobile sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("mobileSidebar");
  sidebar.classList.toggle("hidden");
}

// Dark mode functionality
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

// Check for saved user preference or system preference
if (localStorage.getItem('darkMode') === 'true') {
  html.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

// Toggle dark mode
darkModeToggle.addEventListener('change', () => {
  if (darkModeToggle.checked) {
    html.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
  } else {
    html.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
  }
});

// Theme color selection
const themeColorBtns = document.querySelectorAll('.theme-color-btn');
themeColorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove border from all buttons
    themeColorBtns.forEach(b => {
      b.classList.remove('border-emerald-700', 'border-blue-700', 'border-indigo-700', 'border-purple-700');
      b.classList.add('border-transparent');
    });
    
    // Add border to selected button
    const color = btn.dataset.color;
    btn.classList.remove('border-transparent');
    btn.classList.add(`border-${color}-700`);
    
    // Save preference
    localStorage.setItem('themeColor', color);
    
    // In a real app, you would update the CSS variables or Tailwind config
    alert(`Theme color changed to ${color}. In a real app, this would update the color scheme.`);
  });
});

// Initialize theme color from localStorage
const savedColor = localStorage.getItem('themeColor') || 'emerald';
const activeColorBtn = document.querySelector(`.theme-color-btn[data-color="${savedColor}"]`);
if (activeColorBtn) {
  activeColorBtn.classList.remove('border-transparent');
  activeColorBtn.classList.add(`border-${savedColor}-700`);
}

// Initialize other settings from localStorage
document.getElementById('languageSelect').value = localStorage.getItem('language') || 'en';
document.getElementById('timezoneSelect').value = localStorage.getItem('timezone') || 'GMT';
document.querySelector(`input[name="dateFormat"][value="${localStorage.getItem('dateFormat') || 'MM/DD/YYYY'}"]`).checked = true;
document.getElementById('emailNotificationsToggle').checked = localStorage.getItem('emailNotifications') !== 'false';
document.getElementById('pushNotificationsToggle').checked = localStorage.getItem('pushNotifications') !== 'false';
document.getElementById('twoFactorToggle').checked = localStorage.getItem('twoFactor') === 'true';

// Save all settings
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  localStorage.setItem('language', document.getElementById('languageSelect').value);
  localStorage.setItem('timezone', document.getElementById('timezoneSelect').value);
  localStorage.setItem('dateFormat', document.querySelector('input[name="dateFormat"]:checked').value);
  localStorage.setItem('emailNotifications', document.getElementById('emailNotificationsToggle').checked);
  localStorage.setItem('pushNotifications', document.getElementById('pushNotificationsToggle').checked);
  localStorage.setItem('twoFactor', document.getElementById('twoFactorToggle').checked);
  
  // Show success message
  alert('Settings saved successfully!');
});

// Add confirmation for delete account
document.querySelector('button.bg-red-100').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    alert('Account deletion requested. In a real app, this would trigger the deletion process.');
  }
});