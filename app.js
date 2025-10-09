document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    page: 'login',
    user: null,
    id: null,
    activeTab: 'tab1',
    loginUsername: '',
    loginPassword: '',
    token: '',
    userRole: '',
    registerUsername: '',
    registerPassword: '',
    confirmPassword: '',
    showLoginPassword: false,
    showRegisterPassword: false,
    showConfirmPassword: false,
    showAddCategory: false,
    newCategory: '',
    products: [],
    filters: null,
    statistics: [],

    // --------------------------
    // Login
    // --------------------------
    async login() {
      if (!this.loginUsername || !this.loginPassword) {
        alert('Please enter username and password!');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/login', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.loginUsername,
            password: this.loginPassword
          })
        });

        const text = await response.text();
        if (!response.ok) {
          try {
            const errData = JSON.parse(text);
            throw new Error(errData.detail || 'Login failed');
          } catch {
            throw new Error('Login failed: ' + text);
          }
        }

        const data = JSON.parse(text);
        this.token = data["access token"];
        if (this.token) {
          this.user = this.loginUsername;
          this.page = 'main';
          this.activeTab = 'tab1';
          await this.userInfo();
        } else {
          alert('Invalid username or password.');
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'Login failed.');
      }
    },

    // --------------------------
    // Register
    // --------------------------
    async register() {
      if (!this.registerUsername.trim() || !this.registerPassword.trim()) {
        alert('Please enter username and password!');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/register', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.registerUsername,
            password: this.registerPassword
          })
        });

        const text = await response.text();
        if (!response.ok) throw new Error(text);

        const data = JSON.parse(text);
        if (data.id && data.email) {
          this.id = data.id;
          this.user = data.email;
          this.page = 'registerResponse';
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'Registration failed.');
      }
    },

    // --------------------------
    // User Info
    // --------------------------
    async userInfo() {
      if (!this.token) {
        alert('Please log in first.');
        return;
      }

      try {
        const response = await fetch('https://ftlcafe.pythonanywhere.com/Users/user/info', {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.token,
          }
        });

        const text = await response.text();
        const data = JSON.parse(text);
        this.userRole = data.user_role || '';
        alert('Welcome! Your role: ' + this.userRole);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch user info.');
      }
    },

    // --------------------------
    // Sale Statistics Graph
    // --------------------------
    async saleStatisticsGraph() {
      if (!this.token) {
        alert('Please log in before fetching sale statistics.');
        return;
      }

      const baseURL = "https://ftlcafe.pythonanywhere.com/Sale/statistics/graph";
      const params = { YEAR: 2025, MONTH: 0, SELLER: 0, CATEGORY: 0 };
      const query = new URLSearchParams();
      query.append("year", params.YEAR);
      if (params.MONTH > 0) query.append("month", params.MONTH);
      if (params.SELLER > 0) query.append("seller_id", params.SELLER);
      if (params.CATEGORY > 0) query.append("category_id", params.CATEGORY);

      const finalURL = `${baseURL}?${query.toString()}`;
      console.log("Fetching:", finalURL);

      try {
        const response = await fetch(finalURL, {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.token,
          }
        });

        const data = await response.json();
        console.log('API response:', data);

        // ✅ Convert all values to numbers
        this.statistics = data.statistics.map(
          s => new SaleStatistic(s.time_group, Number(s.total_sales), Number(s.total_quantity))
        );

        console.log("Parsed statistics:", this.statistics);

        // ✅ Render the chart
        this.renderChart(this.statistics);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch sale statistics.');
      }
    },

    // --------------------------
    // Chart rendering
    // --------------------------
    renderChart(statistics) {
      const canvas = document.getElementById("salesChart");
      if (!canvas) {
        console.warn("No salesChart canvas found");
        return;
      }

      const ctx = canvas.getContext("2d");

      if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
      }

      const labels = statistics.map(s => s.timeGroup);
      const values = statistics.map(s => s.totalSales);

      console.log("Chart Labels:", labels);
      console.log("Chart Values:", values);

      window.salesChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Total Sales",
            data: values,
            borderColor: "black",
            backgroundColor: "transparent",
            borderWidth: 2,
            fill: false,
            tension: 0.0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: { title: { display: true, text: "Time Group" } },
            y: {
              title: { display: true, text: "Sales" },
              beginAtZero: true
            }
          }
        }
      });
    },
    

  }));
});

// --------------------------
// Classes
// --------------------------
class SaleStatistic {
  constructor(timeGroup, totalSales, totalQuantity) {
    this.timeGroup = timeGroup;
    this.totalSales = totalSales;
    this.totalQuantity = totalQuantity;
  }
}

class Filters {
  constructor(year, month = null, sellerId = null, categoryId = null) {
    this.year = year;
    this.month = month;
    this.sellerId = sellerId;
    this.categoryId = categoryId;
  }
}