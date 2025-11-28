document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    // 🟦
    // --------------------------
    // UI state flags for password visibility /used in html file/
    // --------------------------
    showLoginPassword: false,       // Controls if login password is visible
    showRegisterPassword: false,    // Controls if register password is visible
    showConfirmPassword: false,      // Controls if confirm password is visible

    // 🟦
    // --------------------------
    // Log In management
    // --------------------------
    page: 'login', // Current page/view the user is on
    user: null, // Currently logged-in user; null means no user is logged in
    activeTab: 'tab1', // Active tab in a tabbed interface; default is 'tab1'
    // Login form fields
    loginUsername: '',  // Username input for login form
    loginPassword: '',  // Password input for login form
    token: '',          // Token received after login

    // 🟢
    async login() {
      console.log('Login clicked', this.loginUsername, this.loginPassword);

      if (!this.loginUsername || !this.loginPassword) {
        this.showToast('Please enter username and password!');
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
          this.showToast('Invalid username or password:');
        }
      } catch (err) {
        console.error(err);
        this.showToast('Login failed. Please check your credentials.');
      }
    },

    // --------------------------
    // Register management
    // --------------------------
    id: null,
    // Register form fields
    registerUsername: '',   // Username input for registration form
    registerPassword: '',   // Password input for registration form
    confirmPassword: '',    // Confirmation input for registration form

    // 🟢
    async register() {
      console.log('Register clicked', this.registerUsername, this.registerPassword, this.confirmPassword);

      if (!this.registerUsername.trim() || !this.registerPassword.trim()) {
        this.showToast('Please enter username and password!');
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
          this.showToast('Unexpected response format.');
        }
      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Registration failed. Please try again.');
      }
    },

    // --------------------------
    // User Info management
    // --------------------------
    userRole: '',      // User role (e.g., admin, user)

    // 🟢
    async userInfo() {
      //console.log('Register clicked', this.registerUsername, this.registerPassword, this.confirmPassword);

      if (!this.token) {
        this.showToast('Please log in before checking your user information.');
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
          this.showToast('Welcome! Your role: ' + userRole);
        } else {
          this.showToast('Unexpected response format.');
        }
      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Failed to fetch user info. Please try again.');
      }
    },

    // 🟦
    // --------------------------
    // Sale Statistics Graph management  
    // --------------------------
    filters: { year: null, months: [] }, // store the entire API response here
    statistics: null, // store the entire API response here

    // --------------------------
    // Sale Statistics Graph (MODIFIED TO USE time_group AS LABEL)
    // --------------------------

    // 🟢
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
        this.showToast(err.message || 'Failed to fetch sale statistics.');
      }
    },

    // -----------------------------------------------------------
    // 🚀 NEW FUNCTION: initSalesChart (Corrected Axes Configuration)
    // -----------------------------------------------------------

    // 🟢
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
    // Add Category Logic (Modified to include ID)
    // --------------------------
    // Helper to generate a unique ID (NOTE: In a real app, this should come from the server)

    //🔴 DELETE !!!!!!!!!!!!!!!!!!!!!!!!!
    getNextCategoryId() {
      return this.products.length > 0
        ? Math.max(...this.products.map(p => p.id)) + 1
        : 1;
    },

    // 🟦
    // --------------------------
    // Category Management
    // --------------------------

    // --------------------------
    // Category Fetching Management (Refactored to include products)
    // --------------------------
    async fetchCategories() {
      if (!this.token) {
        console.log('Token missing, cannot fetch categories/products.');
        return;
      }

      try {
        // 1️⃣ Fetch categories
        const catResponse = await fetch('https://ftlcafe.pythonanywhere.com/Categories/', {
          method: 'GET',
          headers: { 'accept': 'application/json' }
        });

        if (!catResponse.ok) throw new Error('Failed to fetch categories');
        const categories = await catResponse.json();

        // 2️⃣ Fetch all products
        await this.fetchAllProducts();

        // 3️⃣ Sort allProducts by category (grouped) and newest first
        this.allProducts.sort((a, b) => {
          if (a.category_id === b.category_id) {
            return b.id - a.id; // newest first inside each category
          }
          return a.category_id - b.category_id; // group by category
        });

        // 4️⃣ Combine categories and their related (sorted) products
        const combinedData = categories.map(category => {
          const relatedProducts = this.allProducts.filter(
            product => product.category_id === category.id
          );
          return {
            ...category,
            products: relatedProducts
          };
        });

        // 5️⃣ Save the final combined structure
        this.products = combinedData;
        console.log('✅ Combined & sorted categories/products:', this.products);

      } catch (err) {
        console.error('Category fetch error:', err);
        this.showToast('Failed to fetch categories.');
      }
    },


    // --------------------------
    // Function to handle the creation of the new category
    // --------------------------
    showAddCategory: false,
    newCategory: '',

    // Add this new method to reset the category form
    resetAddCategoryForm() {
      this.showAddCategory = false; // Hide the modal
      this.newCategory = '';        // Clear the input field text
    },

    // 🟢
    async createCategory() {
      if (!this.newCategory.trim()) {
        this.showToast('Please enter a category name.');
        return;
      }
      if (!this.token) {
        this.showToast('You must be logged in to create a category.');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Categories/', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token, // Must include token for POST
          },
          body: JSON.stringify({
            name: this.newCategory.trim()
          })
        });

        const text = await response.text();

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to create category');
          } catch {
            throw new Error('Failed to create category: ' + text);
          }
        }

        const newCategoryData = JSON.parse(text);
        console.log('✅ Category created:', newCategoryData);
        this.showToast(`Category "${this.newCategory}" created successfully!`);

        this.resetAddCategoryForm();
        // ⭐️ NEW: Refresh the category list after a successful creation
        await this.fetchCategories();

      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Category creation failed. Please try again.');
      }
    },


    // --------------------------
    // Product management
    // --------------------------
    products: [],      // ⭐️ Now stores categories with NESTED products
    allProducts: [],   // ⭐️ NEW: Stores the raw list of ALL products

    // ⭐️ NEW Add Product Modal State ⭐️
    showAddProduct: false, // Flag to show the add product modal/form
    addProductCategoryId: null, // Stores the ID of the category being added to
    addProductTempName: '',
    addProductTempPrice: null,
    addProductTempOrderNumber: null,
    addProductFile: null, // Stores the file object for the image upload
    // "https://ftlcafe.pythonanywhere.com" + image

    // ⭐️ NEW: Fetch All Products
    async fetchAllProducts() {
      if (!this.token) {
        console.log('Token missing, cannot fetch products.');
        return;
      }

      console.log('Fetching all products...');
      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Products/', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            // The API requires the token for product fetching
            'Authorization': 'Bearer ' + this.token,
          }
        });

        const text = await response.text();

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to fetch products');
          } catch {
            throw new Error('Failed to fetch products: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('✅ All products fetched:', data);

        // Store the raw list
        this.allProducts = data;

      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Failed to fetch products. Please try again.');
      }
    },

    // 🔴 showFormIndex: null,

    // --------------------------
    // Add Product Modal & Submission (NEW/REFACTORED)
    // --------------------------

    // 🟢 Step 1: Opens the modal and sets the category context
    showAddProductForm(categoryId) {
      this.addProductCategoryId = categoryId;
      this.addProductTempName = '';
      this.addProductTempPrice = null;
      this.addProductTempOrderNumber = null;
      this.newProductImagePreview = '';
      this.addProductFile = null; // Clear previous file

      // Reset file input element manually (matches the ID in the HTML modal)
      const fileInput = document.getElementById('newProductImage');
      if (fileInput) fileInput.value = '';

      this.showAddProduct = true;
    },

    // 🟢 Step 2: Stores the selected file from the <input type="file">
    setNewProductFile(file) {
      this.addProductFile = file;
    },


    newProductImageFile: null,       // Stores the actual File object
    newProductImagePreview: '',      // Stores the URL for the image preview

    resetAddProductForm() {
      this.showAddProduct = false; // Hide the modal

      // Clear the image-related properties
      this.newProductImageFile = null;
      this.newProductImagePreview = '';

      // Clear other form fields for a complete reset
      this.addProductTempName = '';
      this.addProductTempPrice = '';
      this.addProductTempOrderNumber = '';
    },

    // New method to handle image selection and create a preview
    handleImageSelection(file) {
      this.newProductImageFile = file;
      if (file) {
        // Create a URL for the selected image to display it
        this.newProductImagePreview = URL.createObjectURL(file);
      } else {
        this.newProductImagePreview = ''; // Clear preview if no file selected
      }
    },

    // 🟢 Step 3: Submits the product data using modal state
    orderCounter: 6, // Start from 6

    // Initialize orderCounter from localStorage (if exists) or start from 6
    orderCounter: Number(localStorage.getItem('orderCounter')) || 6,

    async addNewProduct() {
      if (!this.addProductTempName || !this.addProductTempPrice || !this.addProductCategoryId || !this.newProductImageFile) {
        this.showToast('Please fill all product details and select an image.');
        return;
      }

      if (!this.token) {
        this.showToast('You must be logged in to add a product.');
        return;
      }

      try {
        // Convert image file to Base64 string
        const base64Image = await this.toBase64(this.newProductImageFile);

        const body = {
          name: this.addProductTempName,
          price: Number(this.addProductTempPrice),
          order_number: this.orderCounter,
          category_id: Number(this.addProductCategoryId),
          image: base64Image.split(',')[1] // ✅ send only raw Base64
        };

        const response = await fetch('https://ftlcafe.pythonanywhere.com/Products/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(body)
        });

        const text = await response.text();
        console.log('Raw response body:', text);

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to add product');
          } catch {
            throw new Error('Failed to add product: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('✅ Product created:', data);
        this.showToast('Product added successfully!');

        // Increment order counter and save it
        this.orderCounter++;
        localStorage.setItem('orderCounter', this.orderCounter);

        // Reset form and refresh
        this.resetAddProductForm();
        await this.fetchCategories();

      } catch (err) {
        console.error(err);
        this.showToast('Failed to add product: ' + err.message);
      }
    },

    // Helper function to convert file → Base64
    toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },



    // --------------------------
    // Orders Management
    // --------------------------
    orders: [],   // store the fetched orders here

    // 🟢 Fetch Orders
    async fetchOrders() {
      if (!this.token) {
        //alert('Please log in to load orders.');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Orders/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.token
          }
        });

        const text = await response.text();
        console.log('Raw Orders response:', text);

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Failed to fetch orders');
          } catch {
            throw new Error('Failed to fetch orders: ' + text);
          }
        }

        const data = JSON.parse(text);
        console.log('Orders fetched:', data);

        this.orders = data;

      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Orders fetch failed.');
      }
    },

    async deleteOrder(id) {
      if (!confirm("Are you sure you want to delete this order?")) return;

      try {
        const res = await fetch(`https://ftlcafe.pythonanywhere.com/Orders/${id}`, {
          method: 'DELETE',
          headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer ' + this.token
          }
        });

        if (res.ok) {
          // Remove deleted order from the array
          this.orders = this.orders.filter(o => o.id !== id);

          // Access global Alpine toast
          this.showToast("Order deleted successfully")

          // Auto-hide toast


        } else {
          // Toast error
          this.showToast("Failed to delete order")

          console.error(await res.text());
        }
      } catch (err) {
        console.error(err);

        this.showToast("Error deleting order")
      }
    },

    // 🟦
    // --------------------------
    // Show Toast
    // --------------------------
    showToast: false,
    message: "",
    toastType: "error",

    showToast(message) {
  // If previous toast exists — remove it
  const oldToast = document.getElementById('toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '9999';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(toast);

  // fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);

  // fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
},



  }));
});

// 🟦
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

// 🔷
// Represents a single stat entry
class SaleStatistic {
  constructor(timeGroup, totalSales, totalQuantity) {
    this.timeGroup = timeGroup;
    this.totalSales = totalSales;
    this.totalQuantity = totalQuantity;
  }
}

// 🔷
// Represents filters used in the request
class Filters {
  constructor(year, month = null, sellerId = null, categoryId = null) {
    this.year = year;
    this.month = month;
    this.sellerId = sellerId;
    this.categoryId = categoryId;
  }
}