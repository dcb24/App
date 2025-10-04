// Global variables
let recipes = [];
let filteredRecipes = [];

// DOM elements
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const recipesList = document.getElementById('recipesList');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cuisineFilter = document.getElementById('cuisineFilter');
const recipeForm = document.getElementById('recipeForm');
const generateRandomBtn = document.getElementById('generateRandom');
const randomRecipeDisplay = document.getElementById('randomRecipeDisplay');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Load recipes from CSV
    loadRecipes();
    
    // Show loading state
    showLoading(true);
}

function setupEventListeners() {
    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Search and filters
    searchInput.addEventListener('input', filterRecipes);
    categoryFilter.addEventListener('change', filterRecipes);
    cuisineFilter.addEventListener('change', filterRecipes);

    // Form submission
    recipeForm.addEventListener('submit', handleFormSubmit);

    // Random recipe generation
    generateRandomBtn.addEventListener('click', generateRandomRecipe);
}

function switchSection(sectionId) {
    // Update navigation
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Update sections
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    // Load content for the active section
    if (sectionId === 'recipes') {
        displayRecipes();
    }
}

async function loadRecipes() {
    try {
        // Try to load from CSV file
        const response = await fetch('recipe_dataset.csv');
        if (!response.ok) {
            throw new Error('CSV file not found');
        }
        
        const csvText = await response.text();
        recipes = parseCSV(csvText);
        filteredRecipes = [...recipes];
        
        showLoading(false);
        displayRecipes();
    } catch (error) {
        console.error('Error loading recipes:', error);
        // Fallback: create some sample recipes
        recipes = createSampleRecipes();
        filteredRecipes = [...recipes];
        showLoading(false);
        displayRecipes();
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const recipes = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const recipe = {};
                headers.forEach((header, index) => {
                    recipe[header.trim()] = values[index].trim();
                });
                recipes.push(recipe);
            }
        }
    }

    return recipes;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function createSampleRecipes() {
    return [
        {
            recipe_id: '1',
            name: 'Classic Spaghetti Carbonara',
            category: 'Main Course',
            cuisine: 'Italian',
            cooking_method: 'Boiling',
            difficulty: 'Medium',
            prep_time_minutes: '15',
            cook_time_minutes: '20',
            total_time_minutes: '35',
            servings: '4',
            calories_per_serving: '450',
            rating: '4.5',
            ingredients: 'spaghetti, eggs, pancetta, parmesan cheese, black pepper, salt',
            instructions: 'Cook spaghetti according to package directions. Meanwhile, cook pancetta until crispy. Beat eggs with parmesan and pepper. Toss hot pasta with pancetta, then with egg mixture. Serve immediately.',
            author: 'Chef Mario',
            date_created: '2024-01-15',
            is_vegetarian: 'False',
            is_vegan: 'False',
            is_gluten_free: 'False',
            is_dairy_free: 'False'
        },
        {
            recipe_id: '2',
            name: 'Chocolate Chip Cookies',
            category: 'Dessert',
            cuisine: 'American',
            cooking_method: 'Baking',
            difficulty: 'Easy',
            prep_time_minutes: '15',
            cook_time_minutes: '12',
            total_time_minutes: '27',
            servings: '24',
            calories_per_serving: '120',
            rating: '4.8',
            ingredients: 'flour, butter, sugar, eggs, chocolate chips, vanilla, baking soda, salt',
            instructions: 'Preheat oven to 375°F. Mix dry ingredients. Cream butter and sugars. Add eggs and vanilla. Combine wet and dry ingredients. Fold in chocolate chips. Bake for 9-11 minutes.',
            author: 'Baker Sarah',
            date_created: '2024-02-10',
            is_vegetarian: 'True',
            is_vegan: 'False',
            is_gluten_free: 'False',
            is_dairy_free: 'False'
        }
    ];
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    recipesList.style.display = show ? 'none' : 'grid';
}

function displayRecipes() {
    if (filteredRecipes.length === 0) {
        recipesList.innerHTML = '<div class="text-center mt-20">No recipes found matching your criteria.</div>';
        return;
    }

    recipesList.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card">
            <h3>${recipe.name}</h3>
            <div class="recipe-meta">
                <span>${recipe.category}</span>
                <span>${recipe.cuisine}</span>
                <span>${recipe.difficulty}</span>
                <span class="rating">★ ${recipe.rating}</span>
            </div>
            <div class="recipe-info">
                <p><strong>Cooking Method:</strong> ${recipe.cooking_method}</p>
                <p><strong>Prep Time:</strong> ${recipe.prep_time_minutes} min</p>
                <p><strong>Cook Time:</strong> ${recipe.cook_time_minutes} min</p>
                <p><strong>Servings:</strong> ${recipe.servings}</p>
                <p><strong>Calories:</strong> ${recipe.calories_per_serving} per serving</p>
                <p><strong>Author:</strong> ${recipe.author}</p>
                <p><strong>Ingredients:</strong> ${recipe.ingredients}</p>
            </div>
        </div>
    `).join('');
}

function filterRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedCuisine = cuisineFilter.value;

    filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                            recipe.ingredients.toLowerCase().includes(searchTerm) ||
                            recipe.author.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
        const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;

        return matchesSearch && matchesCategory && matchesCuisine;
    });

    displayRecipes();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(recipeForm);
    const newRecipe = {
        recipe_id: (recipes.length + 1).toString(),
        name: document.getElementById('recipeName').value,
        category: document.getElementById('recipeCategory').value,
        cuisine: document.getElementById('recipeCuisine').value,
        cooking_method: document.getElementById('recipeCookingMethod').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        prep_time_minutes: document.getElementById('recipePrepTime').value,
        cook_time_minutes: document.getElementById('recipeCookTime').value,
        total_time_minutes: (parseInt(document.getElementById('recipePrepTime').value) + parseInt(document.getElementById('recipeCookTime').value)).toString(),
        servings: document.getElementById('recipeServings').value,
        calories_per_serving: document.getElementById('recipeCalories').value,
        rating: document.getElementById('recipeRating').value,
        ingredients: document.getElementById('recipeIngredients').value,
        instructions: document.getElementById('recipeInstructions').value,
        author: document.getElementById('recipeAuthor').value,
        date_created: new Date().toISOString().split('T')[0],
        is_vegetarian: document.getElementById('recipeVegetarian').checked.toString(),
        is_vegan: document.getElementById('recipeVegan').checked.toString(),
        is_gluten_free: document.getElementById('recipeGlutenFree').checked.toString(),
        is_dairy_free: document.getElementById('recipeDairyFree').checked.toString()
    };

    // Add to recipes array
    recipes.push(newRecipe);
    filteredRecipes = [...recipes];

    // Reset form
    recipeForm.reset();

    // Show success message
    alert('Recipe added successfully!');

    // Switch to recipes view
    switchSection('recipes');
}

function generateRandomRecipe() {
    if (recipes.length === 0) {
        randomRecipeDisplay.innerHTML = '<div class="text-center">No recipes available. Please add some recipes first.</div>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * recipes.length);
    const recipe = recipes[randomIndex];

    randomRecipeDisplay.innerHTML = `
        <h3>${recipe.name}</h3>
        <div class="recipe-details">
            <div class="detail-item">
                <div class="detail-label">Category</div>
                <div class="detail-value">${recipe.category}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Cuisine</div>
                <div class="detail-value">${recipe.cuisine}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Difficulty</div>
                <div class="detail-value">${recipe.difficulty}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Cooking Method</div>
                <div class="detail-value">${recipe.cooking_method}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Prep Time</div>
                <div class="detail-value">${recipe.prep_time_minutes} minutes</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Cook Time</div>
                <div class="detail-value">${recipe.cook_time_minutes} minutes</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Total Time</div>
                <div class="detail-value">${recipe.total_time_minutes} minutes</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Servings</div>
                <div class="detail-value">${recipe.servings}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Calories per Serving</div>
                <div class="detail-value">${recipe.calories_per_serving}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Rating</div>
                <div class="detail-value">★ ${recipe.rating}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Author</div>
                <div class="detail-value">${recipe.author}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Date Created</div>
                <div class="detail-value">${recipe.date_created}</div>
            </div>
        </div>
        <div class="ingredients-section">
            <h4>Ingredients</h4>
            <div class="ingredients-list">
                ${recipe.ingredients}
            </div>
        </div>
        <div class="instructions-section">
            <h4>Instructions</h4>
            <div class="instructions-text">
                ${recipe.instructions}
            </div>
        </div>
        <div class="dietary-info" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4>Dietary Information</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                ${recipe.is_vegetarian === 'True' ? '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Vegetarian</span>' : ''}
                ${recipe.is_vegan === 'True' ? '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Vegan</span>' : ''}
                ${recipe.is_gluten_free === 'True' ? '<span style="background: #17a2b8; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Gluten Free</span>' : ''}
                ${recipe.is_dairy_free === 'True' ? '<span style="background: #ffc107; color: #333; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Dairy Free</span>' : ''}
            </div>
        </div>
    `;
}
