
const CONFIG = {
    DAILY_CALORIE_LIMIT: 2000,
    TAX_RATE: 0.07,
    STORAGE_KEYS: {
        CART: 'cartItems',
        CALORIES: 'calorieTracker',
        PREFERENCES: 'userPreferences',
        ALLERGENS: 'userAllergens'
    },
    NUTRIENT_GOALS: {
        protein: 50,
        carbs: 250,
        fat: 70
    }
};

const utils = {
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    setLoading: function(isLoading) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = isLoading ? 'flex' : 'none';
        }
    },

    formatDate: function(date) {
        return new Date(date).toLocaleDateString();
    },

    formatTime: function(date) {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    checkAllergens: function(productAllergens = [], userAllergens = []) {
        return productAllergens.some(allergen => userAllergens.includes(allergen));
    }
};

// State Management
class AppState {
    constructor() {
        this.products = [
            {
                id: "lays-001",
                name: "Lays",
                price: 20,
                calories: 150,
                nutrients: {
                    protein: 2,
                    carbs: 15,
                    fat: 10,
                    fiber: 1,
                    sugar: 0
                },
                allergens: ["wheat", "soy"],
                ingredients: ["potatoes", "vegetable oil", "salt"],
                image: "/lays.jpg"
            },
            {
                id: "hanami-001",
                name: "Hanami Shrimp Chips (Original Flavor)",
                price: 25,
                calories: 200,
                nutrients: {
                    protein: 3,
                    carbs: 18,
                    fat: 12,
                    fiber: 1,
                    sugar: 1
                },
                allergens: ["crustaceans", "soy"],
                ingredients: ["tapioca starch", "shrimp powder", "salt"],
                image: "/hanami.jpg"
            },
            {
                id: "betagen-001",
                name: "Betagen (Probiotic Drink)",
                price: 15,
                calories: 120,
                nutrients: {
                    protein: 5,
                    carbs: 20,
                    fat: 1,
                    fiber: 0,
                    sugar: 10
                },
                allergens: ["milk"],
                ingredients: ["milk", "probiotics", "sugar"],
                image: "/betagen.jpg"
            },
            {
                id: "meji-001",
                name: "Meji Chocolate Milk",
                price: 30,
                calories: 180,
                nutrients: {
                    protein: 4,
                    carbs: 25,
                    fat: 5,
                    fiber: 1,
                    sugar: 15
                },
                allergens: ["milk", "soy"],
                ingredients: ["milk", "cocoa", "sugar"],
                image: "/milk.png"
            },
            {
                id: "mama-001",
                name: "Mama Instant Noodles (Tom Yum namkon)",
                price: 12,
                calories: 330,
                nutrients: {
                    protein: 7,
                    carbs: 45,
                    fat: 15,
                    fiber: 2,
                    sugar: 2
                },
                allergens: ["wheat", "crustaceans", "soy"],
                ingredients: ["wheat flour", "shrimp powder", "chili"],
                image: "/mama.jpg"
            }
        ];
        this.cart = [];
        this.calorieTracker = [];
        this.userAllergens = [];
        this.preferences = {
            dailyGoal: CONFIG.DAILY_CALORIE_LIMIT,
            nutrientGoals: { ...CONFIG.NUTRIENT_GOALS }
        };
    }

    async init() {
        try {
            this.loadFromStorage();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    loadFromStorage() {
        try {
            const cartData = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
            const calorieData = localStorage.getItem(CONFIG.STORAGE_KEYS.CALORIES);
            const preferencesData = localStorage.getItem(CONFIG.STORAGE_KEYS.PREFERENCES);
            const allergenData = localStorage.getItem(CONFIG.STORAGE_KEYS.ALLERGENS);

            if (cartData) this.cart = JSON.parse(cartData);
            if (calorieData) this.calorieTracker = JSON.parse(calorieData);
            if (preferencesData) this.preferences = JSON.parse(preferencesData);
            if (allergenData) this.userAllergens = JSON.parse(allergenData);
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(this.cart));
            localStorage.setItem(CONFIG.STORAGE_KEYS.CALORIES, JSON.stringify(this.calorieTracker));
            localStorage.setItem(CONFIG.STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
            localStorage.setItem(CONFIG.STORAGE_KEYS.ALLERGENS, JSON.stringify(this.userAllergens));
        } catch (error) {
            console.error('Error saving to storage:', error);
            utils.showNotification('Error saving data', 'error');
        }
    }

    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    addToCartAndTracker(product, quantity = 1) {
        // Check for allergens
        if (utils.checkAllergens(product.allergens, this.userAllergens)) {
            if (!confirm(`Warning: This product contains allergens (${product.allergens.join(', ')}). Add anyway?`)) {
                return;
            }
        }

        const timestamp = new Date().toISOString();
        
        // Add to cart
        this.cart.push({
            ...product,
            quantity,
            timestamp
        });

        // Add to calorie tracker
        this.calorieTracker.push({
            name: product.name,
            calories: product.calories * quantity,
            nutrients: {
                protein: product.nutrients.protein * quantity,
                carbs: product.nutrients.carbs * quantity,
                fat: product.nutrients.fat * quantity,
                fiber: product.nutrients.fiber * quantity,
                sugar: product.nutrients.sugar * quantity
            },
            allergens: product.allergens,
            timestamp
        });

        this.saveToStorage();
        utils.showNotification(`Added ${product.name} to cart and tracker`);
    }

    updateUserAllergens(allergens) {
        this.userAllergens = allergens;
        this.saveToStorage();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveToStorage();
    }

    removeFromTracker(timestamp) {
        this.calorieTracker = this.calorieTracker.filter(item => item.timestamp !== timestamp);
        this.saveToStorage();
    }
}

// UI Controller
class UIController {
    constructor(appState) {
        this.state = appState;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (document.getElementById('productContainer')) {
            this.initializeProductPage();
        }
        if (document.getElementById('cartItems')) {
            this.initializeCartPage();
        }
        if (document.getElementById('allergenSettings')) {
            this.initializeAllergenSettings();
        }
    }

    initializeProductPage() {
        this.renderProducts(this.state.products);
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    initializeCartPage() {
        this.updateCartUI();
    }

    initializeAllergenSettings() {
        const allergenForm = document.getElementById('allergenForm');
        if (allergenForm) {
            allergenForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const selectedAllergens = Array.from(allergenForm.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(input => input.value);
                this.state.updateUserAllergens(selectedAllergens);
                utils.showNotification('Allergen preferences updated');
            });
        }
    }

    renderProducts(products) {
        const container = document.getElementById('productContainer');
        if (!container) return;

        container.innerHTML = products.map(product => {
            const hasAllergens = utils.checkAllergens(product.allergens, this.state.userAllergens);
            return `
                <div class="product ${hasAllergens ? 'has-allergens' : ''}">
                    <div class="product-image" data-id="${product.id}">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        ${hasAllergens ? '<div class="allergen-warning">Contains Allergens</div>' : ''}
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">฿${product.price.toFixed(2)}</p>
                        <p class="calories">${product.calories} calories</p>
                        <p class="allergens">Allergens: ${product.allergens.join(', ') || 'None'}</p>
                        <button class="btn add-to-cart" data-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        container.querySelectorAll('.product-image').forEach(el => {
            el.addEventListener('click', () => {
                window.location.href = `product.html?id=${el.dataset.id}`;
            });
        });

        container.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const product = this.state.getProduct(button.dataset.id);
                if (product) {
                    this.state.addToCartAndTracker(product);
                }
            });
        });
    }

    handleSearch(query) {
        const filteredProducts = this.state.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderProducts(filteredProducts);
    }

    updateCartUI() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (this.state.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <a href="index.html" class="btn">Continue Shopping</a>
                </div>
            `;
            return;
        }

        let subtotal = 0;
        cartItems.innerHTML = `
            <div class="cart-items">
                ${this.state.cart.map(item => {
                    subtotal += item.price;
                    const hasAllergens = utils.checkAllergens(item.allergens, this.state.userAllergens);
                    return `
                        <div class="cart-item ${hasAllergens ? 'has-allergens' : ''}">
                            <img class="cart-item-image" src="${item.image}" alt="${item.name}">
                            <div class="cart-item-details">
                                <span class="cart-item-name">${item.name}</span>
                                <span class="cart-item-price">฿${item.price.toFixed(2)}</span>
                                <span class="cart-item-calories">${item.calories} calories</span>
                                ${hasAllergens ? '<span class="allergen-warning">Contains Allergens</span>' : ''}
                            </div>
                            <button class="remove-item" data-id="${item.id}">×</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="cart-summary">
                <h2>Order Summary</h2>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>฿${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (7%)</span>
                    <span>฿${(subtotal * 0.07).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>฿${(subtotal * 1.07).toFixed(2)}</span>
                </div>
                <button class="checkout-btn">Proceed to Checkout</button>
            </div>
        `;

        // Add remove button listeners
        cartItems.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                this.state.removeFromCart(button.dataset.id);
                this.updateCartUI();
            });
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    utils.setLoading(true);
    
    try {
        const appState = new AppState();
        await appState.init();
        
        // Initialize based on current page
        if (window.location.pathname.includes('calorie_tracker.html')) {
            new CalorieTracker(appState);
        } else if (window.location.pathname.includes('product.html')) {
            new ProductPageHandler(appState);
        } else {
            new UIController(appState);
        }
        
        utils.setLoading(false);
        utils.showNotification('Welcome to Smart Inventory System', 'success');
    } catch (error) {
        console.error('Application initialization error:', error);
        utils.setLoading(false);
        utils.showNotification('Error initializing application', 'error');
    }
});// CalorieTracker Class
class CalorieTracker {
    constructor(appState) {
        this.state = appState;
        this.initializeTracker();
    }

    initializeTracker() {
        this.updateTrackerUI();
        this.initializeCharts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reset button
        const resetBtn = document.getElementById('resetTracker');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTracker());
        }

        // Date filter buttons
        document.querySelectorAll('.date-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.date-btn').forEach(btn => 
                    btn.classList.remove('active')
                );
                button.classList.add('active');
                this.filterByDate(button.dataset.period);
            });
        });

        // Allergen warning toggle
        const allergenToggle = document.getElementById('allergenWarning');
        if (allergenToggle) {
            allergenToggle.checked = localStorage.getItem('showAllergenWarnings') === 'true';
            allergenToggle.addEventListener('change', (e) => {
                localStorage.setItem('showAllergenWarnings', e.target.checked);
                this.updateTrackerUI();
            });
        }
    }

    updateTrackerUI() {
        const today = new Date().toISOString().split('T')[0];
        const todaysItems = this.state.calorieTracker.filter(item => 
            item.timestamp.startsWith(today)
        );

        const totalCalories = todaysItems.reduce((sum, item) => sum + item.calories, 0);
        const remainingCalories = Math.max(0, this.state.preferences.dailyGoal - totalCalories);

        // Update displays
        document.getElementById('totalCalories').textContent = totalCalories;
        document.getElementById('remainingCalories').textContent = remainingCalories;

        // Update progress ring
        const progressRing = document.querySelector('.progress-ring-circle');
        if (progressRing) {
            const percentage = Math.min((totalCalories / this.state.preferences.dailyGoal) * 100, 100);
            const circumference = 2 * Math.PI * 54;
            progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRing.style.strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            const progressText = document.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${Math.round(percentage)}%`;
            }
        }

        this.updateNutrientBars(todaysItems);
        this.updateConsumedList(todaysItems);
        this.updateCharts(todaysItems);
    }

    updateNutrientBars(items) {
        const nutrients = items.reduce((acc, item) => {
            if (item.nutrients) {
                acc.protein += item.nutrients.protein || 0;
                acc.carbs += item.nutrients.carbs || 0;
                acc.fat += item.nutrients.fat || 0;
            }
            return acc;
        }, { protein: 0, carbs: 0, fat: 0 });

        Object.entries(nutrients).forEach(([nutrient, amount]) => {
            const progressBar = document.getElementById(`${nutrient}Progress`);
            const amountElement = document.getElementById(`${nutrient}Amount`);
            
            if (progressBar && amountElement) {
                const percentage = (amount / this.state.preferences.nutrientGoals[nutrient]) * 100;
                progressBar.style.width = `${Math.min(percentage, 100)}%`;
                amountElement.textContent = `${amount.toFixed(1)}g/${this.state.preferences.nutrientGoals[nutrient]}g`;
            }
        });
    }

    updateConsumedList(items) {
        const container = document.getElementById('consumedItems');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No items consumed today</p>
                    <a href="index.html" class="btn">Add Items</a>
                </div>
            `;
            return;
        }

        const showAllergenWarnings = localStorage.getItem('showAllergenWarnings') === 'true';

        container.innerHTML = items
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(item => {
                const hasAllergens = utils.checkAllergens(item.allergens, this.state.userAllergens);
                return `
                    <div class="consumed-item ${hasAllergens && showAllergenWarnings ? 'has-allergens' : ''}">
                        <div class="item-time">${utils.formatTime(item.timestamp)}</div>
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>${item.calories} calories</p>
                            ${hasAllergens && showAllergenWarnings ? 
                                `<p class="allergen-warning">Contains: ${item.allergens.join(', ')}</p>` : 
                                ''
                            }
                            <div class="nutrient-info">
                                <span>P: ${item.nutrients.protein}g</span>
                                <span>C: ${item.nutrients.carbs}g</span>
                                <span>F: ${item.nutrients.fat}g</span>
                            </div>
                        </div>
                        <button class="remove-item" data-timestamp="${item.timestamp}">&times;</button>
                    </div>
                `;
            }).join('');

        // Add remove button listeners
        container.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                this.removeConsumedItem(button.dataset.timestamp);
            });
        });
    }

    initializeCharts() {
        const ctx = document.getElementById('calorieTrendChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Calories',
                        data: [],
                        borderColor: '#06402B',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        const nutrientCtx = document.getElementById('nutrientChart')?.getContext('2d');
        if (nutrientCtx) {
            new Chart(nutrientCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fat'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
    }

    updateCharts(items) {
        this.updateCalorieTrendChart(items);
        this.updateNutrientChart(items);
    }

    updateCalorieTrendChart(items) {
        const chart = Chart.getChart('calorieTrendChart');
        if (!chart) return;

        const dates = this.getLast7Days();
        const dailyCalories = dates.map(date => ({
            date,
            calories: items
                .filter(item => item.timestamp.startsWith(date))
                .reduce((sum, item) => sum + item.calories, 0)
        }));

        chart.data.labels = dailyCalories.map(d => utils.formatDate(d.date));
        chart.data.datasets[0].data = dailyCalories.map(d => d.calories);
        chart.update();
    }

    updateNutrientChart(items) {
        const chart = Chart.getChart('nutrientChart');
        if (!chart) return;

        const nutrients = items.reduce((acc, item) => {
            if (item.nutrients) {
                acc.protein += item.nutrients.protein || 0;
                acc.carbs += item.nutrients.carbs || 0;
                acc.fat += item.nutrients.fat || 0;
            }
            return acc;
        }, { protein: 0, carbs: 0, fat: 0 });

        chart.data.datasets[0].data = [
            nutrients.protein,
            nutrients.carbs,
            nutrients.fat
        ];
        chart.update();
    }

    getLast7Days() {
        return [...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();
    }

    removeConsumedItem(timestamp) {
        this.state.removeFromTracker(timestamp);
        this.updateTrackerUI();
        utils.showNotification('Item removed from tracker');
    }

    resetTracker() {
        if (confirm('Are you sure you want to reset today\'s tracking?')) {
            const today = new Date().toISOString().split('T')[0];
            this.state.calorieTracker = this.state.calorieTracker
                .filter(item => !item.timestamp.startsWith(today));
            this.state.saveToStorage();
            this.updateTrackerUI();
            utils.showNotification('Tracker reset for today');
        }
    }

    filterByDate(period) {
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default: // today
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const filteredItems = this.state.calorieTracker
            .filter(item => new Date(item.timestamp) >= startDate);
        
        this.updateConsumedList(filteredItems);
        this.updateCharts(filteredItems);
    }
}

// ProductPageHandler Class
class ProductPageHandler {
    constructor(appState) {
        this.state = appState;
        this.initializeProductPage();
    }

    initializeProductPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            const product = this.state.getProduct(productId);
            if (product) {
                this.displayProductDetails(product);
            }
        }
    }

    displayProductDetails(product) {
        const hasAllergens = utils.checkAllergens(product.allergens, this.state.userAllergens);

        // Update basic info
        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productImage').src = product.image;
        document.getElementById('productPrice').textContent = `฿${product.price.toFixed(2)}`;
        document.getElementById('calories').textContent = `${product.calories} cal`;

        // Update allergen information
        const allergenInfo = document.getElementById('allergenInfo');
        if (allergenInfo) {
            allergenInfo.innerHTML = `
                <h3>Allergen Information</h3>
                ${hasAllergens ? 
                    `<p class="allergen-warning">Warning: Contains ${product.allergens.join(', ')}</p>` :
                    '<p>No allergen warnings for your preferences</p>'
                }
                <p>Ingredients: ${product.ingredients.join(', ')}</p>
            `;
        }

        // Update nutrients
        if (product.nutrients) {
            Object.entries(product.nutrients).forEach(([nutrient, value]) => {
                const element = document.getElementById(nutrient);
                if (element) {
                    element.textContent = `${value}g`;
                }
            });
        }

        // Add to cart functionality
        const addToCartBtn = document.getElementById('addToCart');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
                this.state.addToCartAndTracker(product, quantity);
            };
        }
    }
}// Helper functions for handling charts
const ChartHelper = {
    getDefaultOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };
    },

    createCalorieChart(canvas, data) {
        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Calories',
                    data: data.values,
                    borderColor: '#06402B',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(6, 64, 43, 0.1)'
                }]
            },
            options: this.getDefaultOptions()
        });
    },

    createNutrientChart(canvas, data) {
        return new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
};

// Export functionality
const ExportHelper = {
    exportToCSV(data, filename = 'export.csv') {
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    },

    exportTrackerData(calorieTracker) {
        const exportData = calorieTracker.map(item => ({
            Date: new Date(item.timestamp).toLocaleDateString(),
            Time: new Date(item.timestamp).toLocaleTimeString(),
            Item: item.name,
            Calories: item.calories,
            Protein: item.nutrients.protein || 0,
            Carbs: item.nutrients.carbs || 0,
            Fat: item.nutrients.fat || 0,
            Allergens: item.allergens ? item.allergens.join(', ') : 'None'
        }));

        this.exportToCSV(exportData, 'calorie-tracker-export.csv');
    }
};

// Print functionality
const PrintHelper = {
    printReport() {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Calorie Tracker Report</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(this.generateReportHTML());
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    },

    generateReportHTML() {
        const today = new Date().toLocaleDateString();
        return `
            <div class="header">
                <h1>Calorie Tracker Report</h1>
                <p>Generated on ${today}</p>
            </div>
            ${this.generateSummaryHTML()}
            ${this.generateConsumedItemsHTML()}
        `;
    },

    generateSummaryHTML() {
        // Add summary generation logic here
        return '';
    },

    generateConsumedItemsHTML() {
        // Add consumed items table generation logic here
        return '';
    }
};

// Settings Handler
class SettingsHandler {
    constructor(appState) {
        this.state = appState;
        this.initializeSettings();
    }

    initializeSettings() {
        this.loadPreferences();
        this.setupEventListeners();
    }

    loadPreferences() {
        const calorieGoalInput = document.getElementById('calorieGoal');
        if (calorieGoalInput) {
            calorieGoalInput.value = this.state.preferences.dailyGoal;
        }

        // Load nutrient goals
        Object.entries(this.state.preferences.nutrientGoals).forEach(([nutrient, goal]) => {
            const input = document.getElementById(`${nutrient}Goal`);
            if (input) {
                input.value = goal;
            }
        });

        // Load allergen settings
        this.state.userAllergens.forEach(allergen => {
            const checkbox = document.querySelector(`input[value="${allergen}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    setupEventListeners() {
        const savePreferences = document.getElementById('savePreferences');
        if (savePreferences) {
            savePreferences.addEventListener('click', () => this.savePreferences());
        }
    }

    savePreferences() {
        // Save calorie goal
        const calorieGoal = parseInt(document.getElementById('calorieGoal').value);
        if (calorieGoal >= 500 && calorieGoal <= 5000) {
            this.state.preferences.dailyGoal = calorieGoal;
        }

        // Save nutrient goals
        const nutrientGoals = {};
        Object.keys(CONFIG.NUTRIENT_GOALS).forEach(nutrient => {
            const input = document.getElementById(`${nutrient}Goal`);
            if (input) {
                nutrientGoals[nutrient] = parseInt(input.value) || CONFIG.NUTRIENT_GOALS[nutrient];
            }
        });
        this.state.preferences.nutrientGoals = nutrientGoals;

        // Save allergen preferences
        const allergenCheckboxes = document.querySelectorAll('input[name="allergens"]:checked');
        this.state.userAllergens = Array.from(allergenCheckboxes).map(cb => cb.value);

        this.state.saveToStorage();
        utils.showNotification('Preferences saved successfully');
    }
}

// Initialize all functionality when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    utils.setLoading(true);
    
    try {
        const appState = new AppState();
        await appState.init();
        
        // Initialize appropriate handler based on current page
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('calorie_tracker.html')) {
            new CalorieTracker(appState);
        } else if (currentPath.includes('product.html')) {
            new ProductPageHandler(appState);
        } else if (currentPath.includes('settings.html')) {
            new SettingsHandler(appState);
        } else {
            new UIController(appState);
        }

        utils.setLoading(false);
    } catch (error) {
        console.error('Application initialization error:', error);
        utils.setLoading(false);
        utils.showNotification('Error initializing application', 'error');
    }
});// Event Handlers for interactive features
const EventHandlers = {
    handleQuantityChange(input, direction) {
        let value = parseInt(input.value) || 1;
        if (direction === 'up' && value < 99) {
            value++;
        } else if (direction === 'down' && value > 1) {
            value--;
        }
        input.value = value;
        return value;
    },

    setupModalClosers() {
        document.querySelectorAll('[data-close-modal]').forEach(element => {
            element.addEventListener('click', () => {
                const modal = element.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });
    },

    setupImageZoom() {
        const productImages = document.querySelectorAll('.product-image img');
        const zoomModal = document.getElementById('imageZoomModal');
        const zoomedImage = document.getElementById('zoomedImage');

        productImages.forEach(img => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (zoomModal && zoomedImage) {
                    zoomedImage.src = img.src;
                    zoomModal.classList.remove('hidden');
                }
            });
        });
    },

    setupFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortProducts');
        const searchInput = document.getElementById('searchInput');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }
};

// Analytics Helper
const AnalyticsHelper = {
    trackPageView(pageName) {
        // Add analytics tracking here if needed
        console.log(`Page viewed: ${pageName}`);
    },

    trackEvent(category, action, label) {
        // Add event tracking here if needed
        console.log(`Event tracked: ${category} - ${action} - ${label}`);
    },

    trackAddToCart(product) {
        this.trackEvent('Cart', 'Add Item', product.name);
    },

    trackRemoveFromCart(product) {
        this.trackEvent('Cart', 'Remove Item', product.name);
    }
};

// Form Validation Helper
const ValidationHelper = {
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone(phone) {
        const re = /^\d{10}$/;
        return re.test(phone.replace(/[^0-9]/g, ''));
    },

    validateCardNumber(number) {
        return /^\d{16}$/.test(number);
    },

    validateExpiry(expiry) {
        const [month, year] = expiry.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        return month >= 1 && month <= 12 && 
               year >= currentYear && 
               (year > currentYear || month >= currentMonth);
    },

    validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }
};

// Checkout Handler
class CheckoutHandler {
    constructor(appState) {
        this.state = appState;
        this.initializeCheckout();
    }

    initializeCheckout() {
        this.setupForm();
        this.setupPaymentMethod();
    }

    setupForm() {
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    setupPaymentMethod() {
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        const creditCardFields = document.getElementById('creditCardFields');
        const promptpayFields = document.getElementById('promptpayFields');

        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                if (e.target.value === 'creditCard') {
                    creditCardFields.classList.remove('hidden');
                    promptpayFields.classList.add('hidden');
                } else {
                    creditCardFields.classList.add('hidden');
                    promptpayFields.classList.remove('hidden');
                }
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateForm(data)) {
            return;
        }

        utils.setLoading(true);
        try {
            // Simulate order processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Clear cart after successful order
            this.state.cart = [];
            this.state.saveToStorage();
            
            // Show success message and redirect
            utils.showNotification('Order placed successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'order-confirmation.html';
            }, 2000);
        } catch (error) {
            utils.showNotification('Error processing order. Please try again.', 'error');
        } finally {
            utils.setLoading(false);
        }
    }

    validateForm(data) {
        if (!ValidationHelper.validateEmail(data.email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!ValidationHelper.validatePhone(data.phone)) {
            utils.showNotification('Please enter a valid phone number', 'error');
            return false;
        }

        if (data.paymentMethod === 'creditCard') {
            if (!ValidationHelper.validateCardNumber(data.cardNumber)) {
                utils.showNotification('Please enter a valid card number', 'error');
                return false;
            }

            if (!ValidationHelper.validateExpiry(data.expiry)) {
                utils.showNotification('Please enter a valid expiry date', 'error');
                return false;
            }

            if (!ValidationHelper.validateCVV(data.cvv)) {
                utils.showNotification('Please enter a valid CVV', 'error');
                return false;
            }
        }

        return true;
    }
}

// Order Confirmation Handler
class OrderConfirmationHandler {
    constructor(appState) {
        this.state = appState;
        this.initializeConfirmation();
    }

    initializeConfirmation() {
        this.displayOrderSummary();
        this.setupTracking();
    }

    displayOrderSummary() {
        const summaryContainer = document.getElementById('orderSummary');
        if (!summaryContainer) return;

        const orderDetails = this.getOrderDetails();
        summaryContainer.innerHTML = `
            <div class="order-confirmation">
                <h2>Order Confirmed!</h2>
                <p class="order-number">Order #${this.generateOrderNumber()}</p>
                <div class="order-details">
                    <h3>Order Summary</h3>
                    ${this.generateOrderSummaryHTML(orderDetails)}
                </div>
                <div class="delivery-info">
                    <h3>Estimated Delivery</h3>
                    <p>${this.getEstimatedDelivery()}</p>
                </div>
                <button class="btn" onclick="window.print()">Print Receipt</button>
            </div>
        `;
    }

    generateOrderNumber() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    getOrderDetails() {
        // Implementation for getting order details
        return {};
    }

    generateOrderSummaryHTML(details) {
        // Implementation for generating order summary HTML
        return '';
    }

    getEstimatedDelivery() {
        const delivery = new Date();
        delivery.setDate(delivery.getDate() + 3);
        return delivery.toLocaleDateString();
    }

    setupTracking() {
        // Implementation for order tracking setup
    }
}

// Error Handler
const ErrorHandler = {
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        utils.showNotification(
            `An error occurred${context ? ' in ' + context : ''}. Please try again.`,
            'error'
        );
    },

    async wrapAsync(func, context) {
        try {
            await func();
        } catch (error) {
            this.handleError(error, context);
        }
    }
};

// Initialize application with error handling
document.addEventListener('DOMContentLoaded', () => {
    ErrorHandler.wrapAsync(async () => {
        utils.setLoading(true);
        
        const appState = new AppState();
        await appState.init();
        
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('calorie_tracker.html')) {
            new CalorieTracker(appState);
        } else if (currentPath.includes('product.html')) {
            new ProductPageHandler(appState);
        } else if (currentPath.includes('settings.html')) {
            new SettingsHandler(appState);
        } else if (currentPath.includes('checkout.html')) {
            new CheckoutHandler(appState);
        } else if (currentPath.includes('order-confirmation.html')) {
            new OrderConfirmationHandler(appState);
        } else {
            new UIController(appState);
        }

        EventHandlers.setupModalClosers();
        EventHandlers.setupImageZoom();
        EventHandlers.setupFilters();
        
        utils.setLoading(false);
        AnalyticsHelper.trackPageView(currentPath);
    }, 'application initialization');
});