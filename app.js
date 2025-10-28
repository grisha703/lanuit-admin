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
    id: null,

    // --------------------------
    // Active tab in a tabbed interface; default is 'tab1'
    // --------------------------
    activeTab: 'tab1',

    // --------------------------
    // Login form fields
    // --------------------------
    loginUsername: '',  // Username input for login form
    loginPassword: '',  // Password input for login form
    token: '',          // Token received after login
    userRole: '',      // User role (e.g., admin, user)

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

        this.token = data["access token"];
        if (this.token) { // Check for a token or specific success indicator
          // Use this.page and this.activeTab only if needed for navigation to a specific page
          //alert('User token: ' + token);
          this.user = this.loginUsername;
          this.page = 'main';
          this.activeTab = 'tab1';
          console.log('Login successful');

          // ✅ Fetch user info right after login
          await this.userInfo();
        } else {
          alert('Invalid username or password:');
        }
      } catch (err) {
        console.error(err);
        alert('Login failed. Please check your credentials.');
      }
    },

    // --------------------------
    // Register management
    // --------------------------
    async register() {
      console.log('Register clicked', this.registerUsername, this.registerPassword, this.confirmPassword);

      if (!this.registerUsername.trim() || !this.registerPassword.trim()) {
        alert('Please enter username and password!');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.registerUsername,
            password: this.registerPassword
          })
        });

        console.log('Status:', response.status);

        const text = await response.text();
        console.log('Raw response body:', text);

        if (!response.ok) {
          // Try to parse JSON error if possible
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Registration failed');
          } catch {
            throw new Error('Registration failed: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('API response:', data);

        // ✅ Validate the returned data based on response
        if (data.id && data.email) {
          this.id = data.id;
          this.user = data.email;
          this.page = 'registerResponse';
          console.log('Registration successful for user ID:', data.id);
        } else {
          alert('Unexpected response format.');
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'Registration failed. Please try again.');
      }
    },

    // --------------------------
    // User Info management
    // --------------------------
    async userInfo() {
      //console.log('Register clicked', this.registerUsername, this.registerPassword, this.confirmPassword);

      if (!this.token) {
        alert('Please log in before checking your user information.');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/user/info', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.token,
          }
        });

        console.log('Status:', response.status);

        const text = await response.text();
        console.log('Raw response body:', text);

        if (!response.ok) {
          // Try to parse JSON error if possible
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to fetch user info');
          } catch {
            throw new Error('Failed to fetch user info: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('API response:', data);
        let userRole = data["user_role"];

        // ✅ Validate the returned data based on response
        if (userRole) {
          this.userRole = userRole;
          //this.page = 'registerResponse';
          //console.log('Successfully fetched user info for token:', token);
          alert('Welcome! Your role: ' + userRole);
        } else {
          alert('Unexpected response format.');
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to fetch user info. Please try again.');
      }
    },

    // --------------------------
    // Sale Statistics Graph management  
    // --------------------------
    filters: { year: null, months: [] }, // store the entire API response here
    statistics: null, // store the entire API response here

    // --------------------------
    // Sale Statistics Graph (MODIFIED TO USE time_group AS LABEL)
    // --------------------------
    async saleStatisticsGraph() {
      if (!this.token) {
        console.log('Token missing, skipping stat fetch.');
        return;
      }

      const baseURL = "https://ftlcafe.pythonanywhere.com/Sale/statistics/graph";

      // --- URL Construction ---
      const params = { YEAR: 2025, MONTH: 0, SELLER: 0, CATEGORY: 0 };
      const query = new URLSearchParams();
      query.append("year", params.YEAR);
      if (params.MONTH > 0) query.append("month", params.MONTH);
      if (params.SELLER > 0) query.append("seller_id", params.SELLER);
      if (params.CATEGORY > 0) query.append("category_id", params.CATEGORY);

      const finalURL = `${baseURL}?${query.toString()}`;
      console.log("Fetching:", finalURL);
      // ------------------------

      try {
        const response = await fetch(finalURL, {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.token,
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        // Save filters and statistics
        this.filters = {
          year: data.filters.year,
          months: data.filters.months || [], // Keep for reference, but not used as labels
          sellerId: data.filters.seller_id,
          categoryId: data.filters.category_id
        };

        this.statistics = data.statistics.map(
          s => new SaleStatistic(s.time_group, s.total_sales, s.total_quantity)
        );

        // -----------------------------------------------------------
        // 🚀 THE FIX: Use time_group for Labels
        // -----------------------------------------------------------

        // 1. Get the time_group strings for labels (e.g., "2025-01", "2025-02")
        const labels = this.statistics.map(s => s.timeGroup);

        // 2. Get the total sales for the data points
        const salesData = this.statistics.map(s => s.totalSales);

        console.log("Chart Labels (time_group):", labels);
        console.log("Chart Data (Sales):", salesData);

        // 3. Initialize/Update the Chart
        this.initSalesChart(labels, salesData);

      } catch (err) {
        console.error('Sale statistics fetch failed:', err);
        alert(err.message || 'Failed to fetch sale statistics.');
      }
    },

    // -----------------------------------------------------------
    // 🚀 NEW FUNCTION: initSalesChart (Corrected Axes Configuration)
    // -----------------------------------------------------------
    initSalesChart(labels, data) {
      if (!this.$refs.salesChart) {
        console.error("Chart canvas reference not found.");
        return;
      }

      // ... (Existing chart update logic for when chart exists) ...
      if (this.$refs.salesChart.chart) {
        this.$refs.salesChart.chart.data.labels = labels;
        this.$refs.salesChart.chart.data.datasets[0].data = data;
        this.$refs.salesChart.chart.update();
        return;
      }

      // Create a new chart instance and store it on the canvas element
      this.$refs.salesChart.chart = new Chart(this.$refs.salesChart, {
        type: 'line',
        data: {
          labels: labels, // This holds your month names
          datasets: [{
            label: 'Sales',
            data: data,
            borderColor: 'black',
            backgroundColor: 'rgba(154, 133, 104, 0.2)',
            fill: true,
            tension: 0.0,
            borderWidth: 2, // Added to ensure line is visible
            showLine: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true }
          },
          scales: {
            x: {
              type: 'category', // <-- MUST be 'category' for string labels
              title: {
                display: true,
                // You might want to change this title:
                text: 'Period (time_group)'
              },
              ticks: {
                display: true
              }
            },
            y: {
              title: { display: true, text: 'Sales ($)' },
              beginAtZero: true
            }
          }
        }
      });
    },

    // --------------------------
    // New product's fields
    // --------------------------
    name: '', // Product name input for the new product form
    price: 0, // Product price input for the new product form
    order_number: 0, // Order number input for the new product form
    category_id: 0, // Category ID input for the new product form
    image: '', // Product image URL input for the new product form
    // "https://ftlcafe.pythonanywhere.com" + image

    showFormIndex: null,

    // --------------------------
    // Add Category Logic (Modified to include ID)
    // --------------------------
    // Helper to generate a unique ID (NOTE: In a real app, this should come from the server)
    getNextCategoryId() {
      return this.products.length > 0
        ? Math.max(...this.products.map(p => p.id)) + 1
        : 1;
    },

    // Function to handle the creation of the new category
    createCategory() {
      if (this.newCategory.trim() !== '') {
        // **Creates object with ID and Name**
        this.products.push({
          id: this.getNextCategoryId(),
          name: this.newCategory.trim()
        });
        this.newCategory = '';
        this.showAddCategory = false;
      }
    },

    // --------------------------
    // Add new product
    // --------------------------
    async addNewProduct() {
      console.log(
        'Add new product clicked',
        this.name,
        this.price,
        this.order_number,
        this.category_id
      );

      // Validate fields
      if (
        !this.name.trim() ||
        !this.price.toString().trim() ||
        !this.order_number.toString().trim() ||
        !this.category_id.toString().trim()
      ) {
        alert('Please fill in all fields: Name, Price, Order Number, Category ID, and Image.');
        return;
      }

      const fileInput = document.getElementById('productImage');
      const file = fileInput?.files[0];
      if (!file) {
        alert('Please select an image.');
        return;
      }

      // Convert image to Base64
      const base64 = await this.toBase64(file);

      // Build the request payload
      const payload = {
        name: this.name,
        price: Number(this.price),
        order_number: Number(this.order_number),
        category_id: Number(this.category_id),
        image: base64 // ✅ API expects Base64 string
      };

      console.log("📦 Sending product payload:", payload);

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Products/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token, // ✅ include token
          },
          body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log('Server raw response:', text);

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to add product');
          } catch {
            throw new Error('Failed to add product: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('✅ Product added successfully:', data);
        alert('✅ Product added successfully!');

        // Optional: refresh product list
        this.products.push(data);
        this.name = '';
        this.price = 0;
        this.order_number = 0;
        this.category_id = 0;
        fileInput.value = '';

      } catch (err) {
        console.error(err);
        alert(err.message || 'Product upload failed.');
      }
    },

    toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result.split(',')[1]; // remove "data:image/jpeg;base64,"
          resolve(result);
        };
        reader.onerror = error => reject(error);
      });
    },



  }));
});

// --------------------------
// Animated image
// --------------------------
const img = document.getElementById('animatedImage');
if (img) {
  img.addEventListener('animationend', () => {
    document.body.classList.add('show-new-screen');
    img.style.display = 'none';
  });
}

// Represents a single stat entry
class SaleStatistic {
  constructor(timeGroup, totalSales, totalQuantity) {
    this.timeGroup = timeGroup;
    this.totalSales = totalSales;
    this.totalQuantity = totalQuantity;
  }
}

// Represents filters used in the request
class Filters {
  constructor(year, month = null, sellerId = null, categoryId = null) {
    this.year = year;
    this.month = month;
    this.sellerId = sellerId;
    this.categoryId = categoryId;
  }
}