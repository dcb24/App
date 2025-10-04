// Global variables
var recipes = [];
var filteredRecipes = [];
var mealPlan = {};
var selectedRecipe = null;

// DOM elements
var navButtons = document.querySelectorAll('.nav-btn');
var sections = document.querySelectorAll('.section');
var recipesList = document.getElementById('recipesList');
var loading = document.getElementById('loading');
var searchInput = document.getElementById('searchInput');
var categoryFilter = document.getElementById('categoryFilter');
var cuisineFilter = document.getElementById('cuisineFilter');
var recipeForm = document.getElementById('recipeForm');
var generateRandomBtn = document.getElementById('generateRandom');
var randomRecipeDisplay = document.getElementById('randomRecipeDisplay');
var generateMealPlanBtn = document.getElementById('generateMealPlan');
var clearMealPlanBtn = document.getElementById('clearMealPlan');
var mealPlanDisplay = document.getElementById('mealPlanDisplay');
var ingredientList = document.getElementById('ingredientList');

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
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener('click', function() {
            switchSection(this.dataset.section);
        });
    }

    // Search and filters
    searchInput.addEventListener('input', filterRecipes);
    categoryFilter.addEventListener('change', filterRecipes);
    cuisineFilter.addEventListener('change', filterRecipes);

    // Form submission
    recipeForm.addEventListener('submit', handleFormSubmit);

    // Random recipe generation
    generateRandomBtn.addEventListener('click', generateRandomRecipe);

    // Meal planning
    generateMealPlanBtn.addEventListener('click', generateMealPlan);
    clearMealPlanBtn.addEventListener('click', clearMealPlan);
}

function switchSection(sectionId) {
    // Update navigation
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.toggle('active', navButtons[i].dataset.section === sectionId);
    }

    // Update sections
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.toggle('active', sections[i].id === sectionId);
    }

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

    var html = '';
    for (var i = 0; i < filteredRecipes.length; i++) {
        var recipe = filteredRecipes[i];
        html += '<div class="recipe-card" onclick="showRecipeDetails(\'' + recipe.recipe_id + '\')">';
        html += '<h3>' + recipe.name + '</h3>';
        html += '<div class="recipe-meta">';
        html += '<span>' + recipe.category + '</span>';
        html += '<span>' + recipe.cuisine + '</span>';
        html += '</div>';
        html += '</div>';
    }
    recipesList.innerHTML = html;
}

function filterRecipes() {
    var searchTerm = searchInput.value.toLowerCase();
    var selectedCategory = categoryFilter.value;
    var selectedCuisine = cuisineFilter.value;

    filteredRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        var matchesSearch = recipe.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                           recipe.ingredients.toLowerCase().indexOf(searchTerm) !== -1 ||
                           recipe.author.toLowerCase().indexOf(searchTerm) !== -1;
        var matchesCategory = !selectedCategory || recipe.category === selectedCategory;
        var matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;

        if (matchesSearch && matchesCategory && matchesCuisine) {
            filteredRecipes.push(recipe);
        }
    }

    displayRecipes();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    var newRecipe = {
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
        is_dairy_free: document.getElementById('recipeDairyFree').checked.toString(),
        is_full_meal: 'True', // Default to full meal for user-added recipes
        is_lunch: 'True', // Default to suitable for lunch
        is_dinner: 'True', // Default to suitable for dinner
        is_sweet: 'False' // Default to not sweet
    };

    // Add to recipes array
    recipes.push(newRecipe);
    filteredRecipes = recipes.slice(); // Safari-compatible array copy

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

    var randomIndex = Math.floor(Math.random() * recipes.length);
    var recipe = recipes[randomIndex];

    var html = '<h3>' + recipe.name + '</h3>';
    html += '<div class="recipe-details">';
    html += '<div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">' + recipe.category + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Cuisine</div><div class="detail-value">' + recipe.cuisine + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Difficulty</div><div class="detail-value">' + recipe.difficulty + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Cooking Method</div><div class="detail-value">' + recipe.cooking_method + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Prep Time</div><div class="detail-value">' + recipe.prep_time_minutes + ' minutes</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Cook Time</div><div class="detail-value">' + recipe.cook_time_minutes + ' minutes</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Total Time</div><div class="detail-value">' + recipe.total_time_minutes + ' minutes</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Servings</div><div class="detail-value">' + recipe.servings + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Calories per Serving</div><div class="detail-value">' + recipe.calories_per_serving + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Rating</div><div class="detail-value">★ ' + recipe.rating + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Author</div><div class="detail-value">' + recipe.author + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Date Created</div><div class="detail-value">' + recipe.date_created + '</div></div>';
    html += '</div>';
    html += '<div class="ingredients-section"><h4>Ingredients</h4><div class="ingredients-list">' + recipe.ingredients + '</div></div>';
    html += '<div class="instructions-section"><h4>Instructions</h4><div class="instructions-text">' + recipe.instructions + '</div></div>';
    html += '<div class="dietary-info" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">';
    html += '<h4>Dietary Information</h4><div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">';
    if (recipe.is_vegetarian === 'True') html += '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Vegetarian</span>';
    if (recipe.is_vegan === 'True') html += '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Vegan</span>';
    if (recipe.is_gluten_free === 'True') html += '<span style="background: #17a2b8; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Gluten Free</span>';
    if (recipe.is_dairy_free === 'True') html += '<span style="background: #ffc107; color: #333; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">Dairy Free</span>';
    html += '</div></div>';
    
    randomRecipeDisplay.innerHTML = html;
}

// Recipe Details Functions
function showRecipeDetails(recipeId) {
    var recipe = null;
    for (var i = 0; i < recipes.length; i++) {
        if (recipes[i].recipe_id === recipeId) {
            recipe = recipes[i];
            break;
        }
    }
    if (!recipe) return;

    selectedRecipe = recipe;
    
    // Create modal or detailed view
    var modal = document.createElement('div');
    modal.className = 'recipe-modal';
    
    var html = '<div class="modal-content">';
    html += '<div class="modal-header">';
    html += '<h2>' + recipe.name + '</h2>';
    html += '<button class="close-btn" onclick="closeRecipeModal()">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="recipe-details-grid">';
    html += '<div class="detail-section">';
    html += '<h3>Basic Information</h3>';
    html += '<p><strong>Category:</strong> ' + recipe.category + '</p>';
    html += '<p><strong>Cuisine:</strong> ' + recipe.cuisine + '</p>';
    html += '<p><strong>Difficulty:</strong> ' + recipe.difficulty + '</p>';
    html += '<p><strong>Cooking Method:</strong> ' + recipe.cooking_method + '</p>';
    html += '<p><strong>Rating:</strong> ★ ' + recipe.rating + '</p>';
    html += '</div>';
    html += '<div class="detail-section">';
    html += '<h3>Timing & Nutrition</h3>';
    html += '<p><strong>Prep Time:</strong> ' + recipe.prep_time_minutes + ' minutes</p>';
    html += '<p><strong>Cook Time:</strong> ' + recipe.cook_time_minutes + ' minutes</p>';
    html += '<p><strong>Total Time:</strong> ' + recipe.total_time_minutes + ' minutes</p>';
    html += '<p><strong>Servings:</strong> ' + recipe.servings + '</p>';
    html += '<p><strong>Calories per Serving:</strong> ' + recipe.calories_per_serving + '</p>';
    html += '</div>';
    html += '<div class="detail-section">';
    html += '<h3>Dietary Information</h3>';
    html += '<div class="dietary-tags">';
    if (recipe.is_vegetarian === 'True') html += '<span class="dietary-tag vegetarian">Vegetarian</span>';
    if (recipe.is_vegan === 'True') html += '<span class="dietary-tag vegan">Vegan</span>';
    if (recipe.is_gluten_free === 'True') html += '<span class="dietary-tag gluten-free">Gluten Free</span>';
    if (recipe.is_dairy_free === 'True') html += '<span class="dietary-tag dairy-free">Dairy Free</span>';
    if (recipe.is_full_meal === 'True') html += '<span class="dietary-tag full-meal">Full Meal</span>';
    else html += '<span class="dietary-tag half-meal">Half Meal</span>';
    if (recipe.is_lunch === 'True') html += '<span class="dietary-tag lunch">Lunch</span>';
    if (recipe.is_dinner === 'True') html += '<span class="dietary-tag dinner">Dinner</span>';
    if (recipe.is_sweet === 'True') html += '<span class="dietary-tag sweet">Sweet</span>';
    html += '</div></div></div>';
    html += '<div class="ingredients-section">';
    html += '<h3>Ingredients</h3>';
    html += '<div class="ingredients-list">' + recipe.ingredients + '</div>';
    html += '</div>';
    html += '<div class="instructions-section">';
    html += '<h3>Instructions</h3>';
    html += '<div class="instructions-text">' + recipe.instructions + '</div>';
    html += '</div>';
    html += '<div class="recipe-meta-info">';
    html += '<p><strong>Author:</strong> ' + recipe.author + '</p>';
    html += '<p><strong>Date Created:</strong> ' + recipe.date_created + '</p>';
    html += '</div></div></div>';
    
    modal.innerHTML = html;
    
    document.body.appendChild(modal);
}

function closeRecipeModal() {
    const modal = document.querySelector('.recipe-modal');
    if (modal) {
        modal.remove();
    }
}

// Meal Planning Functions
function generateMealPlan() {
    if (recipes.length === 0) {
        alert('No recipes available. Please add some recipes first.');
        return;
    }

    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    mealPlan = {};

    for (var i = 0; i < days.length; i++) {
        var day = days[i];
        mealPlan[day] = {
            lunch: generateMealForTime('lunch'),
            dinner: generateMealForTime('dinner')
        };
    }

    displayMealPlan();
    generateIngredientList();
}

function generateMealForTime(mealTime) {
    var suitableRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
            suitableRecipes.push(recipe);
        } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
            suitableRecipes.push(recipe);
        }
    }

    if (suitableRecipes.length === 0) {
        return null;
    }

    var randomRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
    
    if (randomRecipe.is_full_meal === 'True') {
        return [randomRecipe];
    } else {
        // For half meals, we need two recipes
        var secondRecipe = null;
        for (var i = 0; i < suitableRecipes.length; i++) {
            if (suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                secondRecipe = suitableRecipes[i];
                break;
            }
        }
        return secondRecipe ? [randomRecipe, secondRecipe] : [randomRecipe];
    }
}

function displayMealPlan() {
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var html = '<div class="meal-plan-list">';
    for (var i = 0; i < days.length; i++) {
        var day = days[i];
        html += '<div class="day-section">';
        html += '<h3 class="day-title">' + day + '</h3>';
        
        // Lunch section
        html += '<div class="meal-section">';
        html += '<h4 class="meal-title">Lunch</h4>';
        if (mealPlan[day].lunch) {
            for (var j = 0; j < mealPlan[day].lunch.length; j++) {
                var recipe = mealPlan[day].lunch[j];
                html += '<div class="meal-recipe-item">';
                html += '<div class="recipe-info">';
                html += '<div class="recipe-name">' + recipe.name + '</div>';
                html += '<div class="recipe-tags">';
                html += '<span class="tag">' + recipe.category + '</span>';
                html += '<span class="tag">' + recipe.cuisine + '</span>';
                html += '<span class="tag">' + (recipe.is_full_meal === 'True' ? 'Full Meal' : 'Half Meal') + '</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
            html += '<button class="replace-meal-btn" onclick="showMealReplacement(\'' + day + '\', \'lunch\')">Replace Lunch</button>';
        } else {
            html += '<div class="no-meal">No lunch planned</div>';
            html += '<button class="replace-meal-btn" onclick="showMealReplacement(\'' + day + '\', \'lunch\')">Add Lunch</button>';
        }
        html += '</div>';
        
        // Dinner section
        html += '<div class="meal-section">';
        html += '<h4 class="meal-title">Dinner</h4>';
        if (mealPlan[day].dinner) {
            for (var j = 0; j < mealPlan[day].dinner.length; j++) {
                var recipe = mealPlan[day].dinner[j];
                html += '<div class="meal-recipe-item">';
                html += '<div class="recipe-info">';
                html += '<div class="recipe-name">' + recipe.name + '</div>';
                html += '<div class="recipe-tags">';
                html += '<span class="tag">' + recipe.category + '</span>';
                html += '<span class="tag">' + recipe.cuisine + '</span>';
                html += '<span class="tag">' + (recipe.is_full_meal === 'True' ? 'Full Meal' : 'Half Meal') + '</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
            html += '<button class="replace-meal-btn" onclick="showMealReplacement(\'' + day + '\', \'dinner\')">Replace Dinner</button>';
        } else {
            html += '<div class="no-meal">No dinner planned</div>';
            html += '<button class="replace-meal-btn" onclick="showMealReplacement(\'' + day + '\', \'dinner\')">Add Dinner</button>';
        }
        html += '</div>';
        
        html += '</div>';
    }
    html += '</div>';
    
    mealPlanDisplay.innerHTML = html;
}

function showMealReplacement(day, mealTime) {
    var suitableRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
            suitableRecipes.push(recipe);
        } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
            suitableRecipes.push(recipe);
        }
    }

    if (suitableRecipes.length === 0) {
        alert('No recipes available for ' + mealTime + '.');
        return;
    }

    // Create modal for recipe selection
    var modal = document.createElement('div');
    modal.className = 'meal-replacement-modal';
    modal.innerHTML = '<div class="modal-overlay" onclick="closeMealReplacement()"></div>';
    
    var modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    var html = '<div class="modal-header">';
    html += '<h2>Choose ' + mealTime + ' for ' + day + '</h2>';
    html += '<button class="close-btn" onclick="closeMealReplacement()">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="replacement-options">';
    html += '<button class="random-option-btn" onclick="selectRandomMeal(\'' + day + '\', \'' + mealTime + '\')">';
    html += '<i class="fas fa-random"></i> Random Recipe';
    html += '</button>';
    html += '<h3>Or choose from list:</h3>';
    html += '<div class="recipe-options-list">';
    
    for (var i = 0; i < suitableRecipes.length; i++) {
        var recipe = suitableRecipes[i];
        html += '<div class="recipe-option" onclick="selectMealRecipe(\'' + day + '\', \'' + mealTime + '\', \'' + recipe.recipe_id + '\')">';
        html += '<div class="recipe-option-name">' + recipe.name + '</div>';
        html += '<div class="recipe-option-tags">';
        html += '<span class="tag">' + recipe.category + '</span>';
        html += '<span class="tag">' + recipe.cuisine + '</span>';
        html += '<span class="tag">' + (recipe.is_full_meal === 'True' ? 'Full Meal' : 'Half Meal') + '</span>';
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div></div></div>';
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function closeMealReplacement() {
    var modal = document.querySelector('.meal-replacement-modal');
    if (modal) {
        modal.remove();
    }
}

function selectRandomMeal(day, mealTime) {
    var suitableRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
            suitableRecipes.push(recipe);
        } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
            suitableRecipes.push(recipe);
        }
    }

    if (suitableRecipes.length === 0) {
        alert('No recipes available for ' + mealTime + '.');
        return;
    }

    var randomRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
    
    if (randomRecipe.is_full_meal === 'True') {
        mealPlan[day][mealTime] = [randomRecipe];
    } else {
        // For half meals, try to find a second recipe
        var secondRecipe = null;
        for (var i = 0; i < suitableRecipes.length; i++) {
            if (suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                secondRecipe = suitableRecipes[i];
                break;
            }
        }
        mealPlan[day][mealTime] = secondRecipe ? [randomRecipe, secondRecipe] : [randomRecipe];
    }

    closeMealReplacement();
    displayMealPlan();
    generateIngredientList();
}

function selectMealRecipe(day, mealTime, recipeId) {
    var recipe = null;
    for (var i = 0; i < recipes.length; i++) {
        if (recipes[i].recipe_id === recipeId) {
            recipe = recipes[i];
            break;
        }
    }

    if (!recipe) return;

    if (recipe.is_full_meal === 'True') {
        mealPlan[day][mealTime] = [recipe];
    } else {
        // For half meals, try to find a second recipe
        var suitableRecipes = [];
        for (var i = 0; i < recipes.length; i++) {
            var r = recipes[i];
            if (mealTime === 'lunch' && r.is_lunch === 'True' && r.recipe_id !== recipe.recipe_id) {
                suitableRecipes.push(r);
            } else if (mealTime === 'dinner' && r.is_dinner === 'True' && r.recipe_id !== recipe.recipe_id) {
                suitableRecipes.push(r);
            }
        }
        
        var secondRecipe = null;
        for (var i = 0; i < suitableRecipes.length; i++) {
            if (suitableRecipes[i].is_full_meal === 'False') {
                secondRecipe = suitableRecipes[i];
                break;
            }
        }
        mealPlan[day][mealTime] = secondRecipe ? [recipe, secondRecipe] : [recipe];
    }

    closeMealReplacement();
    displayMealPlan();
    generateIngredientList();
}

function clearMealPlan() {
    mealPlan = {};
    mealPlanDisplay.innerHTML = '<div class="text-center">No meal plan generated yet. Click "Generate Weekly Plan" to create one.</div>';
    ingredientList.innerHTML = '';
}

function generateIngredientList() {
    var ingredientCounts = {};
    var allRecipes = [];

    for (var day in mealPlan) {
        if (mealPlan.hasOwnProperty(day)) {
            var mealTimes = ['lunch', 'dinner'];
            for (var i = 0; i < mealTimes.length; i++) {
                var mealTime = mealTimes[i];
                if (mealPlan[day][mealTime]) {
                    for (var j = 0; j < mealPlan[day][mealTime].length; j++) {
                        var recipe = mealPlan[day][mealTime][j];
                        var recipeWithDay = {};
                        for (var key in recipe) {
                            if (recipe.hasOwnProperty(key)) {
                                recipeWithDay[key] = recipe[key];
                            }
                        }
                        recipeWithDay.day = day;
                        recipeWithDay.mealTime = mealTime;
                        allRecipes.push(recipeWithDay);
                        
                        var ingredients = recipe.ingredients.split(',');
                        for (var k = 0; k < ingredients.length; k++) {
                            var ingredient = ingredients[k].trim();
                            ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
                        }
                    }
                }
            }
        }
    }

    var sortedIngredients = [];
    for (var ingredient in ingredientCounts) {
        if (ingredientCounts.hasOwnProperty(ingredient)) {
            sortedIngredients.push([ingredient, ingredientCounts[ingredient]]);
        }
    }
    sortedIngredients.sort(function(a, b) { return b[1] - a[1]; });

    var html = '<h3>Shopping List</h3>';
    html += '<div class="ingredient-grid">';
    for (var i = 0; i < sortedIngredients.length; i++) {
        html += '<div class="ingredient-item">';
        html += '<span class="ingredient-name">' + sortedIngredients[i][0] + '</span>';
        html += '<span class="ingredient-count">' + sortedIngredients[i][1] + '</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="recipe-list">';
    html += '<h4>Recipes in this plan:</h4>';
    for (var i = 0; i < allRecipes.length; i++) {
        html += '<div class="recipe-item">';
        html += '<span class="recipe-item-name">' + allRecipes[i].name + '</span>';
        html += '<span class="recipe-item-day">' + allRecipes[i].day + ' ' + allRecipes[i].mealTime + '</span>';
        html += '</div>';
    }
    html += '</div>';
    
    ingredientList.innerHTML = html;
}
