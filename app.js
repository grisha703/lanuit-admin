document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    // --------------------------
    // Current page/view the user is on
    // --------------------------
    page: 'login',

    // --------------------------
    // Currently logged-in user; null means no user is logged in
    // --------------------------
    user: null,

    // --------------------------
    // Active tab in a tabbed interface; default is 'tab1'
    // --------------------------
    activeTab: 'tab1',

    // --------------------------
    // Login form fields
    // --------------------------
    loginUsername: '',  // Username input for login form
    loginPassword: '',  // Password input for login form

    // --------------------------
    // Register form fields
    // --------------------------
    registerUsername: '',   // Username input for registration form
    registerPassword: '',   // Password input for registration form
    confirmPassword: '',    // Confirmation input for registration form

    // --------------------------
    // UI state flags for password visibility
    // --------------------------
    showLoginPassword: false,       // Controls if login password is visible
    showRegisterPassword: false,    // Controls if register password is visible
    showConfirmPassword: false,      // Controls if confirm password is visible

    showAddCategory: false,
    newCategory: '',

    // --------------------------
    // Product management
    // --------------------------
    products: [], // product list

    // --------------------------
    // Log In management
    // --------------------------
    async login() {
      console.log('Login clicked', this.loginUsername, this.loginPassword);

      if (!this.loginUsername || !this.loginPassword) {
        alert('Please enter username and password!');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.loginUsername,
            password: this.loginPassword
          })
        });

        console.log('Status:', response.status);
        console.log('Headers:', [...response.headers]);
        const text = await response.text(); // Get raw text first
        console.log('Raw response body:', text);

        // Check if the response was successful before trying to parse JSON
        if (!response.ok) {
          // You can parse the text to get a more specific error message if it's JSON
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Login failed');
          } catch {
            throw new Error('Login failed: ' + text);
          }
        }

        const data = JSON.parse(text); // Now parse the text as JSON
        console.log('API response:', data);

        if (typeof data.token === 'string') { // Check for a token or specific success indicator
          this.user = this.loginUsername;
          this.page = 'main';
          this.activeTab = 'tab1';
          console.log('Login successful');
        } else {
          alert('Invalid username or password');
        }
      } catch (err) {
        // Use this.page and this.activeTab only if needed for navigation to a specific page
        //this.page = 'main';
        //this.activeTab = 'tab1';
        console.error(err);
        alert('Login failed. Please check your credentials.');
      }
    },

    // --------------------------
    async testRequest() {
      //fetch('https://jsonplaceholder.typicode.com/users')
      fetch('https://ftlcafe.pythonanywhere.com/Users/login')
        .then(res => {
          // The .json() method reads the response stream and returns a promise
          return res.json();
        })
        .then(data => {
          // This second .then() receives the parsed JSON data
          console.log(data);
        })
        .catch(error => {
          // A good practice is to add a .catch() for error handling
          console.error('There was an error fetching the data:', error);
        });
    }





  }));
});

// --------------------------
// Animated image
// --------------------------
const img = document.getElementById('animatedImage');
img.addEventListener('animationend', () => {
  document.body.classList.add('show-new-screen');
  img.style.display = 'none';
});