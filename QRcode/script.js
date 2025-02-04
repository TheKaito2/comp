// Constants and Configuration
const CONFIG = {
    STORAGE_KEYS: {
        CART: 'cartItems',
        CALORIE_TRACKER: 'calorieTracker',
        GOALS: 'nutritionGoals'
    },
    DEFAULT_GOALS: {
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 70
    }
};

// Utility Functions
const utils = {
    formatPrice: (price) => `฿${price.toFixed(2)}`,
    
    formatDate: (date) => new Date(date).toLocaleDateString(),
    
    formatTime: (date) => new Date(date).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    }),

    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    getQueryParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
};

// State Management
class AppState {
    constructor() {
        this.products = [];
        this.cart = [];
        this.calorieTracker = [];
        this.loadFromStorage();
    }

    async init() {
        try {
            await this.loadProducts();
            this.loadFromStorage();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('products.json');
            const data = await response.json();
            this.products = data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            utils.showNotification('Error loading products', 'error');
            this.products = [];
        }
    }

    loadFromStorage() {
        try {
            const cartData = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
            const trackerData = localStorage.getItem(CONFIG.STORAGE_KEYS.CALORIE_TRACKER);
            
            this.cart = cartData ? JSON.parse(cartData) : [];
            this.calorieTracker = trackerData ? JSON.parse(trackerData) : [];
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.cart = [];
            this.calorieTracker = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(this.cart));
            localStorage.setItem(CONFIG.STORAGE_KEYS.CALORIE_TRACKER, 
                JSON.stringify(this.calorieTracker));
        } catch (error) {
            console.error('Error saving to storage:', error);
            utils.showNotification('Error saving data', 'error');
        }
    }

    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                ...product,
                quantity,
                timestamp: new Date().toISOString()
            });
        }
        
        this.addToCalorieTracker(product, quantity);
        this.saveToStorage();
        utils.showNotification(`Added ${product.name} to cart`);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveToStorage();
        utils.showNotification('Item removed from cart');
    }

    clearCart() {
        this.cart = [];
        this.saveToStorage();
        utils.showNotification('Cart has been cleared');
    }

    addToCalorieTracker(product, quantity = 1) {
        this.calorieTracker.push({
            id: product.id,
            name: product.name,
            calories: product.calories * quantity,
            nutrients: {
                protein: product.nutrients.protein * quantity,
                carbs: product.nutrients.carbs * quantity,
                fat: product.nutrients.fat * quantity
            },
            timestamp: new Date().toISOString()
        });
        
        this.saveToStorage();
    }

    clearCalorieTracker() {
        this.calorieTracker = [];
        this.saveToStorage();
    }

    updateItemQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveToStorage();
        }
    }
}

// Product Page Controller
class ProductController {
    constructor(appState) {
        this.state = appState;
        this.initializeProducts();
    }

    initializeProducts() {
        const container = document.getElementById('productContainer');
        if (!container) return;

        this.renderProducts(this.state.products);
        this.initializeSearch();
        this.initializeFilters();
    }

    renderProducts(products) {
        const container = document.getElementById('productContainer');
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No products found matching your criteria.</p>
                </div>`;
            return;
        }

        products.forEach(product => {
            const card = this.createProductCard(product);
            container.appendChild(card);
        });
    }

    createProductCard(product) {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <div class="product-image" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${utils.formatPrice(product.price)}</p>
                <p class="calories">${product.calories} calories</p>
                <button class="btn add-to-cart" data-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        `;

        // Event Listeners
        div.querySelector('.product-image').addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
        });

        div.querySelector('.add-to-cart').addEventListener('click', (e) => {
            e.stopPropagation();
            this.state.addToCart(product);
        });

        return div;
    }

    initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.state.products.filter(product => 
                product.name.toLowerCase().includes(query)
            );
            this.renderProducts(filtered);
        });
    }

    initializeFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortProducts');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                const category = e.target.value;
                const filtered = category ? 
                    this.state.products.filter(p => p.category === category) : 
                    this.state.products;
                this.renderProducts(filtered);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const products = [...this.state.products];
                switch (e.target.value) {
                    case 'price-asc':
                        products.sort((a, b) => a.price - b.price);
                        break;
                    case 'price-desc':
                        products.sort((a, b) => b.price - a.price);
                        break;
                    case 'calories-asc':
                        products.sort((a, b) => a.calories - b.calories);
                        break;
                    case 'name-asc':
                        products.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                }
                this.renderProducts(products);
            });
        }
    }
}

// Cart Controller
class CartController {
    constructor(appState) {
        this.state = appState;
        this.initializeCart();
    }

    initializeCart() {
        this.updateCartUI();
        this.setupEventListeners();
    }

    updateCartUI() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (this.state.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <a href="index.html" class="btn">Continue Shopping</a>
                </div>`;
            return;
        }

        let subtotal = 0;
        const itemsHtml = this.state.cart.map(item => {
            subtotal += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>${utils.formatPrice(item.price)}</p>
                        <p>${item.calories} calories</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <input type="number" value="${item.quantity}" min="1" max="99" 
                            class="quantity-input" data-id="${item.id}">
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}">&times;</button>
                </div>
            `;
        }).join('');

        const tax = subtotal * 0.07;
        const total = subtotal + tax;

        cartItems.innerHTML = `
            <div class="cart-items">
                ${itemsHtml}
            </div>
            <div class="cart-summary">
                <h2>Order Summary</h2>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${utils.formatPrice(subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (7%)</span>
                    <span>${utils.formatPrice(tax)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>${utils.formatPrice(total)}</span>
                </div>
                <button class="btn checkout-btn">Proceed to Checkout</button>
                <button id="clearCart" class="btn btn-warning">Clear Cart</button>
            </div>
        `;

        this.setupCartEventListeners();
    }

    setupCartEventListeners() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        // Quantity controls
        cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.parentNode.querySelector('.quantity-input');
                const currentValue = parseInt(input.value);
                const isPlus = e.target.classList.contains('plus');
                
                if (isPlus && currentValue < 99) {
                    input.value = currentValue + 1;
                } else if (!isPlus && currentValue > 1) {
                    input.value = currentValue - 1;
                }
                
                this.state.updateItemQuantity(
                    e.target.dataset.id, 
                    parseInt(input.value)
                );
                this.updateCartUI();
            });
        });

        // Remove items
        cartItems.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.removeFromCart(btn.dataset.id);
                this.updateCartUI();
            });
        });

        // Clear cart
        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your cart?')) {
                    this.state.clearCart();
                    this.updateCartUI();
                }
            });
        }
    }
}

// Product Details Controller
class ProductDetailsController {
    constructor(appState) {
        this.state = appState;
        this.initializeProductPage();
    }

    initializeProductPage() {
        const productId = utils.getQueryParam('id');
        if (!productId) return;

        const product = this.state.getProduct(productId);
        if (product) {
            this.displayProductDetails(product);
            this.setupEventListeners(product);
        }
    }

    displayProductDetails(product) {
        document.getElementById('productImage').src = product.image;
        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productPrice').textContent = utils.formatPrice(product.price);
        document.getElementById('calories').textContent = `${product.calories} cal`;
        
        if (product.nutrients) {
            document.getElementById('protein').textContent = `${product.nutrients.protein}g`;
            document.getElementById('carbs').textContent = `${product.nutrients.carbs}g`;
            document.getElementById('fat').textContent = `${product.nutrients.fat}g`;
            document.getElementById('fiber').textContent = `${product.nutrients.fiber}g`;
            document.getElementById('sugar').textContent = `${product.nutrients.sugar}g`;
        }
    }

    setupEventListeners(product) {
        // Quantity controls
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('quantity');
                const currentValue = parseInt(input.value);
                
                if (btn.classList.contains('decrease') && currentValue > 1) {
                    input.value = currentValue - 1;
                } else if (btn.classList.contains('increase') && currentValue < 99) {
                    input.value = currentValue + 1;
                }
            });
        });

        // Add to cart button
        const addToCartBtn = document.getElementById('addToCart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(document.getElementById('quantity').value) || 1;
                this.state.addToCart(product, quantity);
                this.showSuccessModal();
            });
        }
    }

    showSuccessModal() {
        const modal = document.getElementById('cartSuccessModal');
        if (modal) {
            modal.removeAttribute('aria-hidden');
            
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(btn => {
                btn.onclick = () => modal.setAttribute('aria-hidden', 'true');
            });
        }
    }
}

// Initialize application
// Calorie Tracker Controller
class CalorieTrackerController {
    constructor(appState) {
        this.state = appState;
        this.currentPeriod = 'today';
        this.goals = this.loadGoals();
        this.initializeTracker();
    }

    loadGoals() {
        const savedGoals = localStorage.getItem(CONFIG.STORAGE_KEYS.GOALS);
        return savedGoals ? JSON.parse(savedGoals) : CONFIG.DEFAULT_GOALS;
    }

    saveGoals() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    }

    initializeTracker() {
        this.setupEventListeners();
        this.updateTrackerUI();
    }

    setupEventListeners() {
        // Reset tracker
        const resetBtn = document.getElementById('resetTracker');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.handleReset());
        }

        // Date filter buttons
        document.querySelectorAll('.date-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.date-btn').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.updateTrackerUI();
            });
        });

        // Remove consumed items
        document.addEventListener('click', (e) => {
            if (e.target.matches('.remove-item')) {
                this.removeConsumedItem(e.target.dataset.timestamp);
            }
        });
    }

    handleReset() {
        if (confirm('Are you sure you want to reset your calorie tracker? This will remove all tracked items.')) {
            this.state.clearCalorieTracker();
            this.updateTrackerUI();
            utils.showNotification('Calorie tracker has been reset', 'success');
        }
    }

    updateTrackerUI() {
        const totals = this.calculateTotals();
        
        // Update total calories
        const totalCaloriesEl = document.getElementById('totalCalories');
        if (totalCaloriesEl) {
            totalCaloriesEl.textContent = Math.round(totals.calories);
        }

        // Update remaining calories
        const remainingCaloriesEl = document.getElementById('remainingCalories');
        if (remainingCaloriesEl) {
            remainingCaloriesEl.textContent = 
                Math.max(0, this.goals.calories - totals.calories);
        }

        // Update daily goal
        const dailyGoalEl = document.getElementById('dailyGoal');
        if (dailyGoalEl) {
            dailyGoalEl.textContent = this.goals.calories;
        }

        // Update progress ring
        this.updateProgressRing(totals.calories);

        // Update nutrient bars
        this.updateNutrientBars(totals.nutrients);

        // Update consumed items list
        this.updateConsumedItems();
    }

    updateProgressRing(calories) {
        const progressRing = document.querySelector('.progress-ring-circle');
        const progressText = document.querySelector('.progress-text');
        
        if (progressRing && progressText) {
            const percentage = Math.min((calories / this.goals.calories) * 100, 100);
            const circumference = 2 * Math.PI * 54;
            progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRing.style.strokeDashoffset = 
                circumference - (percentage / 100) * circumference;
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    updateNutrientBars(nutrients) {
        ['protein', 'carbs', 'fat'].forEach(nutrient => {
            const progressBar = document.getElementById(`${nutrient}Progress`);
            const amountEl = document.getElementById(`${nutrient}Amount`);
            
            if (progressBar && amountEl) {
                const amount = nutrients[nutrient];
                const percentage = (amount / this.goals[nutrient]) * 100;
                progressBar.style.width = `${Math.min(percentage, 100)}%`;
                amountEl.textContent = 
                    `${amount.toFixed(1)}g/${this.goals[nutrient]}g`;
            }
        });
    }

    updateConsumedItems() {
        const container = document.getElementById('consumedItems');
        if (!container) return;

        const items = this.getFilteredItems();
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No items consumed for this period</p>
                    <a href="index.html" class="btn">Add Items</a>
                </div>`;
            return;
        }

        container.innerHTML = items
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(item => `
                <div class="consumed-item">
                    <div class="item-time">
                        ${utils.formatTime(item.timestamp)}
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-calories">${item.calories} calories</div>
                        <div class="item-nutrients">
                            <span>P: ${item.nutrients.protein}g</span>
                            <span>C: ${item.nutrients.carbs}g</span>
                            <span>F: ${item.nutrients.fat}g</span>
                        </div>
                    </div>
                    <button class="remove-item" data-timestamp="${item.timestamp}">×</button>
                </div>
            `).join('');
    }

    calculateTotals() {
        return this.getFilteredItems().reduce((acc, item) => ({
            calories: acc.calories + item.calories,
            nutrients: {
                protein: acc.nutrients.protein + (item.nutrients?.protein || 0),
                carbs: acc.nutrients.carbs + (item.nutrients?.carbs || 0),
                fat: acc.nutrients.fat + (item.nutrients?.fat || 0)
            }
        }), {
            calories: 0,
            nutrients: { protein: 0, carbs: 0, fat: 0 }
        });
    }

    getFilteredItems() {
        const now = new Date();
        const startDate = new Date();

        switch (this.currentPeriod) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default: // today
                startDate.setHours(0, 0, 0, 0);
        }

        return this.state.calorieTracker.filter(item => 
            new Date(item.timestamp) >= startDate &&
            new Date(item.timestamp) <= now
        );
    }

    removeConsumedItem(timestamp) {
        this.state.calorieTracker = this.state.calorieTracker
            .filter(item => item.timestamp !== timestamp);
        this.state.saveToStorage();
        this.updateTrackerUI();
        utils.showNotification('Item removed', 'success');
    }
}

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const appState = new AppState();
        await appState.init();

        // Initialize appropriate controller based on current page
        const currentPage = window.location.pathname;

        if (currentPage.includes('product.html')) {
            new ProductDetailsController(appState);
        } else if (currentPage.includes('cart.html')) {
            new CartController(appState);
        } else if (currentPage.includes('calorie_tracker.html')) {
            new CalorieTrackerController(appState);
        } else {
            // Default to product list page (index.html)
            new ProductController(appState);
        }

        // Success notification for page load
        utils.showNotification('Welcome to Smart Inventory System');
    } catch (error) {
        console.error('Application initialization error:', error);
        utils.showNotification('Error initializing application', 'error');
    }
});