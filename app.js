const themeToggleBtn = document.getElementById('themeToggleBtn');

// Check if the user has previously selected a theme and apply it
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
  document.body.classList.add(currentTheme);
}

// Toggle between light and dark theme
themeToggleBtn.addEventListener('click', () => {
  // Toggle the 'dark-theme' class
  document.body.classList.toggle('dark-theme');

  // Save the current theme in localStorage
  if (document.body.classList.contains('dark-theme')) {
    localStorage.setItem('theme', 'dark-theme');
  } else {
    localStorage.removeItem('theme');
  }
});
