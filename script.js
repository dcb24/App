// Global variables
var recipes = [];
var filteredRecipes = [];
var mealPlan = {};
var selectedRecipe = null;
var currentIngredientRequirements = {};

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

    // Cancel edit button
    var cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
    }

    // Random recipe generation
    generateRandomBtn.addEventListener('click', generateRandomRecipe);

    // Meal planning
    generateMealPlanBtn.addEventListener('click', generateMealPlan);
    clearMealPlanBtn.addEventListener('click', clearMealPlan);
    
    // Meal planning with ingredients
    var generateMealPlanWithIngredientsBtn = document.getElementById('generateMealPlanWithIngredients');
    if (generateMealPlanWithIngredientsBtn) {
        generateMealPlanWithIngredientsBtn.addEventListener('click', showIngredientInputModal);
    }
    
    // Download CSV
    var downloadCSVBtn = document.getElementById('downloadCSV');
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener('click', downloadRecipesCSV);
    }
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
        // First, load from CSV file with cache-busting
        var timestamp = new Date().getTime();
        var response = await fetch('recipe_dataset.csv?v=' + timestamp);
        if (!response.ok) {
            throw new Error('CSV file not found');
        }
        
        var csvText = await response.text();
        recipes = parseCSV(csvText);
        
        // Keep track of CSV recipe IDs to prevent conflicts
        var csvRecipeIds = {};
        for (var i = 0; i < recipes.length; i++) {
            csvRecipeIds[recipes[i].recipe_id] = true;
        }
        
        console.log('Loaded ' + recipes.length + ' recipes from CSV');
        
        // Then, load any user-added recipes from localStorage
        var storedRecipes = localStorage.getItem('userRecipes');
        if (storedRecipes) {
            try {
                var userRecipes = JSON.parse(storedRecipes);
                var addedCount = 0;
                // Merge user recipes with CSV recipes, but skip any with IDs that match CSV recipes
                for (var i = 0; i < userRecipes.length; i++) {
                    // Only add user recipes that don't conflict with CSV recipe IDs
                    if (!csvRecipeIds[userRecipes[i].recipe_id]) {
                        recipes.push(userRecipes[i]);
                        addedCount++;
                    } else {
                        console.warn('Skipping localStorage recipe with conflicting ID: ' + userRecipes[i].recipe_id);
                    }
                }
                console.log('Added ' + addedCount + ' user recipes from localStorage');
            } catch (e) {
                console.error('Error parsing stored recipes:', e);
            }
        }
        
        filteredRecipes = recipes.slice(); // Safari-compatible array copy
        
        showLoading(false);
        displayRecipes();
    } catch (error) {
        console.error('Error loading recipes:', error);
        // Fallback: create some sample recipes
        recipes = createSampleRecipes();
        filteredRecipes = recipes.slice();
        showLoading(false);
        displayRecipes();
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    
    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(delimiter);
    const recipes = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i], delimiter);
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

function parseCSVLine(line, delimiter) {
    delimiter = delimiter || ','; // Default to comma if not specified
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
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
        html += '<span class="category-tag">' + recipe.category + '</span>';
        
        // Display multiple cuisine tags
        if (recipe.cuisine) {
            var cuisineTags = recipe.cuisine.split(',').map(function(tag) {
                return tag.trim();
            });
            for (var j = 0; j < cuisineTags.length; j++) {
                if (cuisineTags[j]) {
                    html += '<span class="cuisine-tag">' + cuisineTags[j] + '</span>';
                }
            }
        }
        
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
        
        // Support multiple cuisine tags separated by commas
        var matchesCuisine = !selectedCuisine;
        if (selectedCuisine && recipe.cuisine) {
            var cuisineTags = recipe.cuisine.split(',').map(function(tag) {
                return tag.trim();
            });
            for (var j = 0; j < cuisineTags.length; j++) {
                if (cuisineTags[j] === selectedCuisine) {
                    matchesCuisine = true;
                    break;
                }
            }
        }

        if (matchesSearch && matchesCategory && matchesCuisine) {
            filteredRecipes.push(recipe);
        }
    }

    displayRecipes();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Check if we're editing an existing recipe
    var editingRecipeId = recipeForm.dataset.editingRecipeId;
    var isEditing = editingRecipeId !== undefined && editingRecipeId !== '';
    
    // Get form data
    // Collect selected cuisine tags
    var cuisineCheckboxes = document.querySelectorAll('.cuisine-checkbox:checked');
    var selectedCuisines = [];
    for (var i = 0; i < cuisineCheckboxes.length; i++) {
        selectedCuisines.push(cuisineCheckboxes[i].value);
    }
    
    // Validate at least one cuisine is selected
    if (selectedCuisines.length === 0) {
        alert('Please select at least one cuisine tag.');
        return;
    }
    
    var recipeData = {
        name: document.getElementById('recipeName').value,
        category: document.getElementById('recipeCategory').value,
        cuisine: selectedCuisines.join(', '),
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
        is_vegetarian: document.getElementById('recipeVegetarian').checked ? 'True' : 'False',
        is_vegan: document.getElementById('recipeVegan').checked ? 'True' : 'False',
        is_gluten_free: document.getElementById('recipeGlutenFree').checked ? 'True' : 'False',
        is_dairy_free: document.getElementById('recipeDairyFree').checked ? 'True' : 'False',
        is_full_meal: 'True',
        is_lunch: 'True',
        is_dinner: 'True',
        is_sweet: 'False'
    };
    
    if (isEditing) {
        // Update existing recipe
        for (var i = 0; i < recipes.length; i++) {
            if (recipes[i].recipe_id === editingRecipeId) {
                // Keep the original recipe_id, date_created, and other preserved fields
                recipeData.recipe_id = recipes[i].recipe_id;
                recipeData.date_created = recipes[i].date_created;
                
                // Update the recipe
                recipes[i] = recipeData;
                break;
            }
        }
        filteredRecipes = recipes.slice();
        
        // Save user recipes to localStorage
        saveUserRecipes();
        
        // Reset form and editing state
        recipeForm.reset();
        delete recipeForm.dataset.editingRecipeId;
        
        // Reset submit button text
        var submitBtn = recipeForm.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Recipe';
        }
        
        // Hide cancel button
        var cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        
        // Show success message
        alert('Recipe updated successfully!');
    } else {
        // Add new recipe
        recipeData.recipe_id = 'user_' + Date.now().toString();
        recipeData.date_created = new Date().toISOString().split('T')[0];
        
        // Add to recipes array
        recipes.push(recipeData);
        filteredRecipes = recipes.slice();
        
        // Save user recipes to localStorage
        saveUserRecipes();
        
        // Reset form
        recipeForm.reset();
        
        // Show success message
        alert('Recipe added successfully and saved!');
    }

    // Switch to recipes view
    switchSection('recipes');
}

function saveUserRecipes() {
    // Get all user-added recipes (those with recipe_id starting with 'user_')
    var userRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        if (recipes[i].recipe_id.indexOf('user_') === 0) {
            userRecipes.push(recipes[i]);
        }
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('userRecipes', JSON.stringify(userRecipes));
    } catch (e) {
        console.error('Error saving recipes to localStorage:', e);
        alert('Warning: Could not save recipe to browser storage. Your recipe will be lost on page refresh.');
    }
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
    
    // Display multiple cuisine tags
    var cuisineDisplay = recipe.cuisine;
    if (recipe.cuisine) {
        var cuisineTags = recipe.cuisine.split(',').map(function(tag) {
            return tag.trim();
        }).filter(function(tag) { return tag; });
        cuisineDisplay = cuisineTags.join(', ');
    }
    html += '<div class="detail-item"><div class="detail-label">Cuisine</div><div class="detail-value">' + cuisineDisplay + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Difficulty</div><div class="detail-value">' + recipe.difficulty + '</div></div>';
    //html += '<div class="detail-item"><div class="detail-label">Cooking Method</div><div class="detail-value">' + recipe.cooking_method + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Prep Time</div><div class="detail-value">' + recipe.prep_time_minutes + ' minutes</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Cook Time</div><div class="detail-value">' + recipe.cook_time_minutes + ' minutes</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Total Time</div><div class="detail-value">' + recipe.total_time_minutes + ' minutes</div></div>';
    //html += '<div class="detail-item"><div class="detail-label">Servings</div><div class="detail-value">' + recipe.servings + '</div></div>';
    //html += '<div class="detail-item"><div class="detail-label">Calories per Serving</div><div class="detail-value">' + recipe.calories_per_serving + '</div></div>';
    html += '<div class="detail-item"><div class="detail-label">Rating</div><div class="detail-value">★ ' + recipe.rating + '</div></div>';
    //html += '<div class="detail-item"><div class="detail-label">Author</div><div class="detail-value">' + recipe.author + '</div></div>';
    //html += '<div class="detail-item"><div class="detail-label">Date Created</div><div class="detail-value">' + recipe.date_created + '</div></div>';
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
    html += '<div class="modal-header-buttons">';
    html += '<button class="edit-recipe-btn-header" onclick="editRecipe(\'' + recipe.recipe_id + '\')"><i class="fas fa-edit"></i> Edit</button>';
    html += '<button class="close-btn" onclick="closeRecipeModal()">&times;</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="recipe-details-grid">';
    html += '<div class="detail-section">';
    html += '<h3>Basic Information</h3>';
    html += '<p><strong>Category:</strong> ' + recipe.category + '</p>';
    
    // Display multiple cuisine tags
    var cuisineDisplay = recipe.cuisine;
    if (recipe.cuisine) {
        var cuisineTags = recipe.cuisine.split(',').map(function(tag) {
            return tag.trim();
        }).filter(function(tag) { return tag; });
        cuisineDisplay = cuisineTags.join(', ');
    }
    html += '<p><strong>Cuisine:</strong> ' + cuisineDisplay + '</p>';
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

function editRecipe(recipeId) {
    // Find the recipe
    var recipe = null;
    for (var i = 0; i < recipes.length; i++) {
        if (recipes[i].recipe_id === recipeId) {
            recipe = recipes[i];
            break;
        }
    }
    
    if (!recipe) {
        alert('Recipe not found!');
        return;
    }
    
    // Close the modal
    closeRecipeModal();
    
    // Switch to add-recipe section
    switchSection('add-recipe');
    
    // Populate the form with recipe data
    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('recipeCategory').value = recipe.category;
    
    // Handle cuisine checkboxes
    var cuisineTags = recipe.cuisine ? recipe.cuisine.split(',').map(function(tag) {
        return tag.trim();
    }) : [];
    var allCuisineCheckboxes = document.querySelectorAll('.cuisine-checkbox');
    for (var i = 0; i < allCuisineCheckboxes.length; i++) {
        var checkbox = allCuisineCheckboxes[i];
        checkbox.checked = false; // Reset all first
        for (var j = 0; j < cuisineTags.length; j++) {
            if (checkbox.value === cuisineTags[j]) {
                checkbox.checked = true;
                break;
            }
        }
    }
    
    document.getElementById('recipeCookingMethod').value = recipe.cooking_method;
    document.getElementById('recipeDifficulty').value = recipe.difficulty;
    document.getElementById('recipePrepTime').value = recipe.prep_time_minutes;
    document.getElementById('recipeCookTime').value = recipe.cook_time_minutes;
    document.getElementById('recipeServings').value = recipe.servings;
    document.getElementById('recipeCalories').value = recipe.calories_per_serving;
    document.getElementById('recipeRating').value = recipe.rating;
    document.getElementById('recipeIngredients').value = recipe.ingredients;
    document.getElementById('recipeInstructions').value = recipe.instructions;
    document.getElementById('recipeAuthor').value = recipe.author;
    document.getElementById('recipeVegetarian').checked = recipe.is_vegetarian === 'True';
    document.getElementById('recipeVegan').checked = recipe.is_vegan === 'True';
    document.getElementById('recipeGlutenFree').checked = recipe.is_gluten_free === 'True';
    document.getElementById('recipeDairyFree').checked = recipe.is_dairy_free === 'True';
    
    // Store the recipe ID being edited
    recipeForm.dataset.editingRecipeId = recipeId;
    
    // Change the submit button text
    var submitBtn = recipeForm.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Recipe';
    }
    
    // Show cancel button
    var cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-flex';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function cancelEdit() {
    // Reset form
    recipeForm.reset();
    
    // Reset cuisine checkboxes
    var allCuisineCheckboxes = document.querySelectorAll('.cuisine-checkbox');
    for (var i = 0; i < allCuisineCheckboxes.length; i++) {
        allCuisineCheckboxes[i].checked = false;
    }
    
    // Clear editing state
    delete recipeForm.dataset.editingRecipeId;
    
    // Reset submit button text
    var submitBtn = recipeForm.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Recipe';
    }
    
    // Hide cancel button
    var cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // Switch to recipes view
    switchSection('recipes');
}

// Meal Planning Functions
function generateMealPlan() {
    if (recipes.length === 0) {
        alert('No recipes available. Please add some recipes first.');
        return;
    }

    var days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    mealPlan = {};
    var usedRecipes = []; // Track used recipes to avoid repetition

    for (var i = 0; i < days.length; i++) {
        var day = days[i];
        mealPlan[day] = {
            lunch: generateMealForTime('lunch', usedRecipes),
            dinner: generateMealForTime('dinner', usedRecipes)
        };
    }

    displayMealPlan();
    generateIngredientList();
    
    // Clear ingredient requirements for regular plan
    currentIngredientRequirements = {};
    
    // Remove ingredient warning if present
    var existingWarning = document.getElementById('ingredientWarning');
    if (existingWarning) {
        existingWarning.remove();
    }
}

function generateMealForTime(mealTime, usedRecipes) {
    usedRecipes = usedRecipes || [];
    
    // First try to find recipes that haven't been used yet
    var suitableRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        var isUsed = false;
        for (var j = 0; j < usedRecipes.length; j++) {
            if (usedRecipes[j] === recipe.recipe_id) {
                isUsed = true;
                break;
            }
        }
        
        if (!isUsed) {
            if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
                suitableRecipes.push(recipe);
            } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
                suitableRecipes.push(recipe);
            }
        }
    }

    // If we don't have enough unused recipes, fall back to all recipes
    if (suitableRecipes.length === 0) {
        for (var i = 0; i < recipes.length; i++) {
            var recipe = recipes[i];
            if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
                suitableRecipes.push(recipe);
            } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
                suitableRecipes.push(recipe);
            }
        }
    }

    if (suitableRecipes.length === 0) {
        return null;
    }

    var randomRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
    usedRecipes.push(randomRecipe.recipe_id);
    
    if (randomRecipe.is_full_meal === 'True') {
        return [randomRecipe];
    } else {
        // For half meals, we need two recipes - try to find an unused one
        var secondRecipe = null;
        for (var i = 0; i < suitableRecipes.length; i++) {
            var isSecondUsed = false;
            for (var j = 0; j < usedRecipes.length; j++) {
                if (usedRecipes[j] === suitableRecipes[i].recipe_id) {
                    isSecondUsed = true;
                    break;
                }
            }
            if (!isSecondUsed && suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                secondRecipe = suitableRecipes[i];
                break;
            }
        }
        
        // If no unused half meal found, try any other half meal
        if (!secondRecipe) {
            for (var i = 0; i < suitableRecipes.length; i++) {
                if (suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                    secondRecipe = suitableRecipes[i];
                    break;
                }
            }
        }
        
        if (secondRecipe) {
            usedRecipes.push(secondRecipe.recipe_id);
        }
        
        return secondRecipe ? [randomRecipe, secondRecipe] : [randomRecipe];
    }
}

function displayMealPlan() {
    var days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    
    var html = '<div class="meal-plan-week">';
    for (var i = 0; i < days.length; i++) {
        var day = days[i];
        html += '<div class="day-card">';
        html += '<div class="day-header">' + day + '</div>';
        
        // Lunch section
        html += '<div class="meal-slot lunch">';
        //html += '<h4>Lunch</h4>';
        if (mealPlan[day].lunch) {
            for (var j = 0; j < mealPlan[day].lunch.length; j++) {
                var recipe = mealPlan[day].lunch[j];
                html += '<div class="meal-item">';
                html += '<div class="meal-item-name">' + recipe.name + '</div>';
                html += '</div>';
            }
            html += '<button class="replace-btn" onclick="showMealReplacement(\'' + day + '\', \'lunch\')">Replace Lunch</button>';
        } else {
            html += '<div class="meal-item"><div class="meal-item-name">No lunch planned</div></div>';
            html += '<button class="replace-btn" onclick="showMealReplacement(\'' + day + '\', \'lunch\')">Add Lunch</button>';
        }
        html += '</div>';
        
        // Dinner section
        html += '<div class="meal-slot dinner">';
        //html += '<h4>Dinner</h4>';
        if (mealPlan[day].dinner) {
            for (var j = 0; j < mealPlan[day].dinner.length; j++) {
                var recipe = mealPlan[day].dinner[j];
                html += '<div class="meal-item">';
                html += '<div class="meal-item-name">' + recipe.name + '</div>';
                html += '</div>';
            }
            html += '<button class="replace-btn" onclick="showMealReplacement(\'' + day + '\', \'dinner\')">Replace Dinner</button>';
        } else {
            html += '<div class="meal-item"><div class="meal-item-name">No dinner planned</div></div>';
            html += '<button class="replace-btn" onclick="showMealReplacement(\'' + day + '\', \'dinner\')">Add Dinner</button>';
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
    
    var modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    var html = '<div class="modal-header">';
    html += '<h2>Choose ' + mealTime + ' for ' + day + '</h2>';
    html += '<button class="close-btn" onclick="closeMealReplacement()">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="replacement-options">';
    html += '<button class="random-option-btn" id="randomMealBtn">';
    html += '<i class="fas fa-random"></i> Random Recipe';
    html += '</button>';
    html += '<h3 style="margin-top: 20px; margin-bottom: 15px;">Or choose from dropdown:</h3>';
    html += '<div class="meal-replacement-dropdown-container">';
    html += '<select class="meal-replacement-select" id="mealReplacementSelect">';
    html += '<option value="">Choose a recipe...</option>';
    
    for (var i = 0; i < suitableRecipes.length; i++) {
        var recipe = suitableRecipes[i];
        html += '<option value="' + recipe.recipe_id + '">' + recipe.name + '</option>';
    }
    
    html += '</select>';
    html += '<button class="confirm-replacement-btn" id="confirmReplacementBtn">';
    html += '<i class="fas fa-check"></i> Confirm';
    html += '</button>';
    html += '</div>';
    html += '</div></div>';
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add overlay behind content that closes on tap/click (iOS Safari friendly)
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    modal.insertBefore(overlay, modalContent);
    
    var overlayClose = function(e) {
        e.stopPropagation();
        closeMealReplacement();
    };
    overlay.addEventListener('click', overlayClose);
    overlay.addEventListener('touchstart', overlayClose, { passive: true });
    
    var randomBtn = document.getElementById('randomMealBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectRandomMeal(day, mealTime);
        });
    }
    
    var confirmBtn = document.getElementById('confirmReplacementBtn');
    var selectElement = document.getElementById('mealReplacementSelect');
    
    if (confirmBtn && selectElement) {
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var recipeId = selectElement.value;
            if (recipeId) {
                selectMealRecipe(day, mealTime, recipeId);
            } else {
                alert('Please select a recipe first.');
            }
        });
    }
}

function closeMealReplacement() {
    var modal = document.querySelector('.meal-replacement-modal');
    if (modal) {
        modal.remove();
    }
}

function selectRandomMeal(day, mealTime) {
    // Get all recipes already in the meal plan
    var usedRecipeIds = [];
    var days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    for (var d = 0; d < days.length; d++) {
        var currentDay = days[d];
        if (mealPlan[currentDay]) {
            if (mealPlan[currentDay].lunch) {
                for (var m = 0; m < mealPlan[currentDay].lunch.length; m++) {
                    usedRecipeIds.push(mealPlan[currentDay].lunch[m].recipe_id);
                }
            }
            if (mealPlan[currentDay].dinner) {
                for (var m = 0; m < mealPlan[currentDay].dinner.length; m++) {
                    usedRecipeIds.push(mealPlan[currentDay].dinner[m].recipe_id);
                }
            }
        }
    }
    
    // First try to find recipes that aren't already in the plan
    var suitableRecipes = [];
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        var isUsed = false;
        for (var j = 0; j < usedRecipeIds.length; j++) {
            if (usedRecipeIds[j] === recipe.recipe_id) {
                isUsed = true;
                break;
            }
        }
        
        if (!isUsed) {
            if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
                suitableRecipes.push(recipe);
            } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
                suitableRecipes.push(recipe);
            }
        }
    }
    
    // If no unused recipes, fall back to all suitable recipes
    if (suitableRecipes.length === 0) {
        for (var i = 0; i < recipes.length; i++) {
            var recipe = recipes[i];
            if (mealTime === 'lunch' && recipe.is_lunch === 'True') {
                suitableRecipes.push(recipe);
            } else if (mealTime === 'dinner' && recipe.is_dinner === 'True') {
                suitableRecipes.push(recipe);
            }
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
        // For half meals, try to find a second unused recipe
        var secondRecipe = null;
        for (var i = 0; i < suitableRecipes.length; i++) {
            var isUsed = false;
            for (var j = 0; j < usedRecipeIds.length; j++) {
                if (usedRecipeIds[j] === suitableRecipes[i].recipe_id) {
                    isUsed = true;
                    break;
                }
            }
            if (!isUsed && suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                secondRecipe = suitableRecipes[i];
                break;
            }
        }
        
        // If no unused half meal, try any other half meal
        if (!secondRecipe) {
            for (var i = 0; i < suitableRecipes.length; i++) {
                if (suitableRecipes[i].recipe_id !== randomRecipe.recipe_id && suitableRecipes[i].is_full_meal === 'False') {
                    secondRecipe = suitableRecipes[i];
                    break;
                }
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
        // Normalize ids to strings to avoid type mismatches
        if (String(recipes[i].recipe_id) === String(recipeId)) {
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
    currentIngredientRequirements = {};
    mealPlanDisplay.innerHTML = '<div class="text-center">No meal plan generated yet. Click "Generate Weekly Plan" to create one.</div>';
    ingredientList.innerHTML = '';
    
    // Remove ingredient warning if present
    var existingWarning = document.getElementById('ingredientWarning');
    if (existingWarning) {
        existingWarning.remove();
    }
}

function generateIngredientList() {
    var ingredientCounts = {};
    var ingredientRecipes = {}; // Track which recipes use each ingredient
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
                            
                            // Track which recipes use this ingredient
                            if (!ingredientRecipes[ingredient]) {
                                ingredientRecipes[ingredient] = [];
                            }
                            ingredientRecipes[ingredient].push({
                                name: recipe.name,
                                day: day,
                                mealTime: mealTime
                            });
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
    
    // Add legend if there are ingredient requirements
    if (Object.keys(currentIngredientRequirements).length > 0) {
        html += '<div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem;">';
        html += '<span style="color: #666;">Legend: </span>';
        html += '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 8px; margin: 0 5px;">Green</span> = Used in plan';
        html += '<span style="background: #ff8c00; color: white; padding: 2px 6px; border-radius: 8px; margin: 0 5px;">Orange</span> = Required count';
        html += '</div>';
    }
    
    html += '<div class="ingredient-grid">';
    for (var i = 0; i < sortedIngredients.length; i++) {
        var ingredientName = sortedIngredients[i][0];
        var actualCount = sortedIngredients[i][1];
        
        html += '<div class="ingredient-item-wrapper">';
        html += '<div class="ingredient-item">';
        html += '<span class="ingredient-name">' + ingredientName + '</span>';
        html += '<div class="ingredient-counts">';
        html += '<span class="ingredient-count">' + actualCount + '</span>';
        
        // Check if this ingredient was in the requirements
        var requiredCount = null;
        for (var reqIngredient in currentIngredientRequirements) {
            if (currentIngredientRequirements.hasOwnProperty(reqIngredient)) {
                // Check if the shopping list ingredient contains the required ingredient
                if (ingredientName.toLowerCase().indexOf(reqIngredient) !== -1 || 
                    reqIngredient.indexOf(ingredientName.toLowerCase()) !== -1) {
                    requiredCount = currentIngredientRequirements[reqIngredient];
                    break;
                }
            }
        }
        
        // Display required count in orange if this was a requested ingredient
        if (requiredCount !== null) {
            html += '<span class="ingredient-count-required">' + requiredCount + '</span>';
        }
        
        html += '</div>';
        html += '</div>';
        
        // Display recipes that use this ingredient
        if (ingredientRecipes[ingredientName]) {
            html += '<div class="ingredient-recipes-list">';
            html += '<span class="ingredient-recipes-label">Used in: </span>';
            for (var r = 0; r < ingredientRecipes[ingredientName].length; r++) {
                var recipeInfo = ingredientRecipes[ingredientName][r];
                html += '<span class="ingredient-recipe-tag">' + recipeInfo.name +'</span>';
                //html += ' <small>(' + recipeInfo.day + ' ' + recipeInfo.mealTime + ')</small></span>';
                if (r < ingredientRecipes[ingredientName].length - 1) {
                    html += ', ';
                }
            }
            html += '</div>';
        }
        
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="recipe-list">';
    html += '<h4>Recipes in this plan:</h4>';
    // Group recipes by day and mealTime
    var daysOfWeek = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    var dayMeals = {};
    for (var i = 0; i < daysOfWeek.length; i++) {
        dayMeals[daysOfWeek[i]] = { lunch: [], dinner: [] };
    }
    for (var i = 0; i < allRecipes.length; i++) {
        var rec = allRecipes[i];
        if (rec.day && rec.mealTime && dayMeals[rec.day]) {
            if (rec.mealTime === 'lunch' || rec.mealTime === 'dinner') {
                dayMeals[rec.day][rec.mealTime].push(rec.name);
            }
        }
    }
    // Render each day in a vertical stack, with pretty SVG bullets for lunch and dinner
    html += '<div class="plan-days-grid" style="display: flex; flex-direction: column; gap: 16px;">';
    for (var i = 0; i < daysOfWeek.length; i++) {
        var day = daysOfWeek[i];
        html += '<div class="plan-day-box" style="background:#f8f8f8;border-radius:8px;padding:16px;min-width:220px;box-shadow:0 1px 4px #0001;display:flex;flex-direction:column;align-items:flex-start;">';
        html += '<div class="plan-day-title" style="font-weight:bold;font-size:1.15em;margin-bottom:8px;letter-spacing:0.5px;">' + day + ':</div>';
        // Lunch
        html += '<div class="plan-meal-row" style="margin-bottom:6px;display:flex;align-items:flex-start;">';
        html += '<span style="display:inline-flex;align-items:center;margin-right:8px;">';
        html += '<svg width="18" height="18" style="vertical-align:bottom;" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3" fill="#e0894c" /></svg>';
        html += '</span>';
        if (dayMeals[day].lunch.length > 0) {
            html += '<span>' + dayMeals[day].lunch.map(function(name) {
                return '<span style="font-weight:500;">' + name + '</span>';
            }).join('<span style="color:#bbb;"> &amp; </span>') + '</span>';
        } else {
            html += '<span style="color:#bbb;">(No lunch planned)</span>';
        }
        html += '</div>';
        // Dinner
        html += '<div class="plan-meal-row" style="display:flex;align-items:flex-start;">';
        html += '<span style="display:inline-flex;align-items:center;margin-right:8px;">';
        html += '<svg width="18" height="18" style="vertical-align:middle;" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3" fill="#a93046" /></svg>';
        html += '</span>';
        if (dayMeals[day].dinner.length > 0) {
            html += '<span>' + dayMeals[day].dinner.map(function(name) {
                return '<span style="font-weight:500;">' + name + '</span>';
            }).join('<span style="color:#bbb;"> &amp; </span>') + '</span>';
        } else {
            html += '<span style="color:#bbb;">(No dinner planned)</span>';
        }
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    // Add copy meal plan button
    html += '<div style="text-align: center; margin-top: 20px;">';
    html += '<button id="copyMealPlanBtn" class="copy-meal-plan-btn" style="padding: 12px 24px; background-color: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    html += '<i class="fas fa-copy"></i> Copy Meal Plan';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    
    ingredientList.innerHTML = html;
    
    // Add event listener to copy button
    var copyBtn = document.getElementById('copyMealPlanBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            // Use pretty bullets in the copied text
            var bulletLunch = '•';
            var bulletDinner = '•';
            var daysOfWeek = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
            var textOutput = '';
            for (var i = 0; i < daysOfWeek.length; i++) {
                var day = daysOfWeek[i];
                textOutput += day + '\n';
                // Lunch
                if (dayMeals[day].lunch.length > 0) {
                    textOutput += '  ' + bulletLunch + ' ' + dayMeals[day].lunch.join(' & ') + '\n';
                } else {
                    textOutput += '  ' + bulletLunch + ' (No lunch planned)\n';
                }
                // Dinner
                if (dayMeals[day].dinner.length > 0) {
                    textOutput += '  ' + bulletDinner + ' ' + dayMeals[day].dinner.join(' & ') + '\n';
                } else {
                    textOutput += '  ' + bulletDinner + ' (No dinner planned)\n';
                }
                // Add blank line between days except for the last day
                if (i < daysOfWeek.length - 1) {
                    textOutput += '\n';
                }
            }
            navigator.clipboard.writeText(textOutput).then(function() {
                // Show success message
                var btn = document.getElementById('copyMealPlanBtn');
                if (btn) {
                    var originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    btn.style.backgroundColor = '#28a745';
                    setTimeout(function() {
                        btn.innerHTML = originalHTML;
                        btn.style.backgroundColor = '#007bff';
                    }, 2000);
                }
            }).catch(function(err) {
                alert('Failed to copy to clipboard: ' + err);
            });
        });
    }
}

function copyMealPlanToClipboard(dayMeals) {
    var daysOfWeek = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    var textOutput = '';
    
    for (var i = 0; i < daysOfWeek.length; i++) {
        var day = daysOfWeek[i];
        textOutput += day + '\n';
        
        // Lunch
        if (dayMeals[day].lunch.length > 0) {
            textOutput += dayMeals[day].lunch.join(' and ') + '\n';
        } else {
            textOutput += '(No lunch planned)\n';
        }
        
        // Dinner
        if (dayMeals[day].dinner.length > 0) {
            textOutput += dayMeals[day].dinner.join(' and ') + '\n';
        } else {
            textOutput += '(No dinner planned)\n';
        }
        
        // Add blank line between days except for the last day
        if (i < daysOfWeek.length - 1) {
            textOutput += '\n';
        }
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(textOutput).then(function() {
        // Show success message
        var btn = document.getElementById('copyMealPlanBtn');
        if (btn) {
            var originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.backgroundColor = '#28a745';
            
            setTimeout(function() {
                btn.innerHTML = originalHTML;
                btn.style.backgroundColor = '#007bff';
            }, 2000);
        }
    }).catch(function(err) {
        alert('Failed to copy to clipboard: ' + err);
    });
}

function downloadRecipesCSV() {
    if (recipes.length === 0) {
        alert('No recipes to export!');
        return;
    }
    
    // Define CSV headers based on recipe structure
    var headers = [
        'recipe_id', 'name', 'category', 'cuisine', 'cooking_method', 'difficulty',
        'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes', 'servings',
        'calories_per_serving', 'rating', 'ingredients', 'instructions', 'author',
        'date_created', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'is_dairy_free',
        'is_full_meal', 'is_lunch', 'is_dinner', 'is_sweet'
    ];
    
    // Create CSV content
    var csvContent = headers.join(',') + '\n';
    
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        var row = [];
        
        for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
            var value = recipe[header] || '';
            
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (value.toString().indexOf(',') !== -1 || 
                value.toString().indexOf('"') !== -1 || 
                value.toString().indexOf('\n') !== -1) {
                value = '"' + value.toString().replace(/"/g, '""') + '"';
            }
            
            row.push(value);
        }
        
        csvContent += row.join(',') + '\n';
    }
    
    // Create download link
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'recipes_' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Recipes exported successfully!');
}

// Ingredient-based meal planning functions
function showIngredientInputModal() {
    var modal = document.createElement('div');
    modal.className = 'ingredient-input-modal';
    modal.id = 'ingredientInputModal';
    
    var html = '<div class="modal-content">';
    html += '<div class="modal-header">';
    html += '<h2>Generate Meal Plan Using Ingredients</h2>';
    html += '<button class="close-btn" onclick="closeIngredientInputModal()">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-carrot"></i> Ingredients</h3>';
    html += '<p style="margin-bottom: 20px; color: #666;">Specify which ingredients should appear in your weekly meal plan and how many times. Click the <strong style="color: #28a745;">+</strong> button to add more:</p>';
    html += '<div class="ingredient-input-container" id="ingredientInputContainer">';
    html += '<div class="ingredient-input-row">';
    html += '<input type="text" class="ingredient-input-field" placeholder="Enter ingredient (e.g., carrot)" />';
    html += '<input type="number" class="ingredient-count-field" placeholder="Times" min="1" max="14" value="1" />';
    html += '<button class="add-ingredient-btn" onclick="addIngredientRow()"><i class="fas fa-plus"></i></button>';
    html += '</div>';
    html += '</div>';
    html += '<hr style="margin: 30px 0; border: none; border-top: 2px solid #e9ecef;">';
    html += '<h3 style="color: #667eea; margin-bottom: 15px;"><i class="fas fa-utensils"></i> Required Meals</h3>';
    html += '<p style="margin-bottom: 20px; color: #666;">Select specific recipes that must be included in your plan. Click the <strong style="color: #28a745;">+</strong> button to add more:</p>';
    html += '<div class="required-meals-container" id="requiredMealsContainer">';
    html += '<div class="required-meal-row">';
    html += '<select class="required-meal-select">';
    html += '<option value="">Choose a recipe...</option>';
    
    // Add all recipes as options
    for (var i = 0; i < recipes.length; i++) {
        html += '<option value="' + recipes[i].recipe_id + '">' + recipes[i].name + '</option>';
    }
    
    html += '</select>';
    html += '<button class="add-ingredient-btn" onclick="addRequiredMealRow()"><i class="fas fa-plus"></i></button>';
    html += '</div>';
    html += '</div>';
    html += '<button class="generate-ingredients-plan-btn" onclick="generateMealPlanWithIngredients()">';
    html += '<i class="fas fa-magic"></i> Generate Plan';
    html += '</button>';
    html += '</div></div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function closeIngredientInputModal() {
    var modal = document.getElementById('ingredientInputModal');
    if (modal) {
        modal.remove();
    }
}

function addIngredientRow() {
    var container = document.getElementById('ingredientInputContainer');
    var newRow = document.createElement('div');
    newRow.className = 'ingredient-input-row';
    
    var html = '<input type="text" class="ingredient-input-field" placeholder="Enter ingredient (e.g., tomatoes)" />';
    html += '<input type="number" class="ingredient-count-field" placeholder="Times" min="1" max="14" value="1" />';
    html += '<button class="remove-ingredient-btn" onclick="removeIngredientRow(this)"><i class="fas fa-minus"></i></button>';
    
    newRow.innerHTML = html;
    container.appendChild(newRow);
}

function removeIngredientRow(button) {
    var row = button.parentElement;
    row.remove();
}

function addRequiredMealRow() {
    var container = document.getElementById('requiredMealsContainer');
    var newRow = document.createElement('div');
    newRow.className = 'required-meal-row';
    
    var html = '<select class="required-meal-select">';
    html += '<option value="">Choose a recipe...</option>';
    
    // Add all recipes as options
    for (var i = 0; i < recipes.length; i++) {
        html += '<option value="' + recipes[i].recipe_id + '">' + recipes[i].name + '</option>';
    }
    
    html += '</select>';
    html += '<button class="remove-ingredient-btn" onclick="removeRequiredMealRow(this)"><i class="fas fa-minus"></i></button>';
    
    newRow.innerHTML = html;
    container.appendChild(newRow);
}

function removeRequiredMealRow(button) {
    var row = button.parentElement;
    row.remove();
}

function generateMealPlanWithIngredients() {
    if (recipes.length === 0) {
        alert('No recipes available. Please add some recipes first.');
        return;
    }
    
    // Collect ingredient requirements
    var ingredientRequirements = {};
    var rows = document.querySelectorAll('.ingredient-input-row');
    
    for (var i = 0; i < rows.length; i++) {
        var ingredientInput = rows[i].querySelector('.ingredient-input-field');
        var countInput = rows[i].querySelector('.ingredient-count-field');
        
        var ingredient = ingredientInput.value.trim().toLowerCase();
        var count = parseInt(countInput.value) || 0;
        
        if (ingredient && count > 0) {
            ingredientRequirements[ingredient] = count;
        }
    }
    
    // Collect required meals
    var requiredMealIds = [];
    var mealRows = document.querySelectorAll('.required-meal-row');
    
    for (var i = 0; i < mealRows.length; i++) {
        var mealSelect = mealRows[i].querySelector('.required-meal-select');
        var mealId = mealSelect.value;
        
        if (mealId) {
            requiredMealIds.push(mealId);
        }
    }
    
    // Check if at least one requirement is specified
    if (Object.keys(ingredientRequirements).length === 0 && requiredMealIds.length === 0) {
        alert('Please enter at least one ingredient or select at least one required meal.');
        return;
    }
    
    // Close the modal
    closeIngredientInputModal();
    
    // Store ingredient requirements globally for shopping list display
    currentIngredientRequirements = ingredientRequirements;
    
    // Generate meal plan based on ingredients and required meals
    var result = createMealPlanWithIngredients(ingredientRequirements, requiredMealIds);
    
    // Display the meal plan
    mealPlan = result.mealPlan;
    displayMealPlan();
    generateIngredientList();
    
    // Show warning if some ingredients weren't fully used
    if (result.unusedIngredients.length > 0 || result.unusedMeals.length > 0) {
        displayUnusedIngredientsWarning(result.unusedIngredients, result.unusedMeals);
    }
}

// Helper function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function createMealPlanWithIngredients(ingredientRequirements, requiredMealIds) {
    var days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    var newMealPlan = {};
    var usedRecipeIds = [];
    var ingredientUsage = {};
    var requiredMealsToPlace = [];
    var placedRequiredMeals = [];
    
    // Initialize ingredient usage tracking
    for (var ingredient in ingredientRequirements) {
        if (ingredientRequirements.hasOwnProperty(ingredient)) {
            ingredientUsage[ingredient] = {
                required: ingredientRequirements[ingredient],
                used: 0
            };
        }
    }
    
    // Get required meal recipes
    if (requiredMealIds && requiredMealIds.length > 0) {
        for (var i = 0; i < requiredMealIds.length; i++) {
            var mealId = requiredMealIds[i];
            for (var j = 0; j < recipes.length; j++) {
                if (recipes[j].recipe_id === mealId) {
                    requiredMealsToPlace.push(recipes[j]);
                    break;
                }
            }
        }
    }
    
    // Get all available recipes for lunch and dinner
    var lunchRecipes = [];
    var dinnerRecipes = [];
    
    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        if (recipe.is_lunch === 'True' || recipe.is_lunch === true) {
            lunchRecipes.push(recipe);
        }
        if (recipe.is_dinner === 'True' || recipe.is_dinner === true) {
            dinnerRecipes.push(recipe);
        }
    }
    
    // Create meal plan for each day
    var dayIdx = 0;
    var mealSlots = [];
    
    // Create all meal slots
    for (var i = 0; i < days.length; i++) {
        mealSlots.push({ day: days[i], mealTime: 'lunch' });
        mealSlots.push({ day: days[i], mealTime: 'dinner' });
    }
    
    // Shuffle meal slots to randomize placement
    shuffleArray(mealSlots);
    
    // First, place required meals in random slots
    for (var i = 0; i < requiredMealsToPlace.length; i++) {
        var meal = requiredMealsToPlace[i];
        var placed = false;
        
        // Find a suitable slot for this meal
        for (var j = 0; j < mealSlots.length; j++) {
            var slot = mealSlots[j];
            
            // Check if this meal is suitable for this time
            var isSuitable = false;
            if (slot.mealTime === 'lunch' && (meal.is_lunch === 'True' || meal.is_lunch === true)) {
                isSuitable = true;
            } else if (slot.mealTime === 'dinner' && (meal.is_dinner === 'True' || meal.is_dinner === true)) {
                isSuitable = true;
            }
            
            if (isSuitable) {
                // Initialize day if needed
                if (!newMealPlan[slot.day]) {
                    newMealPlan[slot.day] = { lunch: null, dinner: null };
                }
                
                // Place the meal
                if (meal.is_full_meal === 'True' || meal.is_full_meal === true) {
                    newMealPlan[slot.day][slot.mealTime] = [meal];
                } else {
                    newMealPlan[slot.day][slot.mealTime] = [meal];
                }
                
                usedRecipeIds.push(meal.recipe_id);
                placedRequiredMeals.push(meal.recipe_id);
                
                // Update ingredient usage
                updateIngredientUsage(meal, ingredientUsage);
                
                // Remove this slot
                mealSlots.splice(j, 1);
                placed = true;
                break;
            }
        }
    }
    
    // Initialize all days
    for (var i = 0; i < days.length; i++) {
        if (!newMealPlan[days[i]]) {
            newMealPlan[days[i]] = { lunch: null, dinner: null };
        }
    }
    
    // Create list of remaining slots
    var remainingLunchSlots = [];
    var remainingDinnerSlots = [];
    for (var i = 0; i < days.length; i++) {
        var day = days[i];
        if (!newMealPlan[day].lunch) {
            remainingLunchSlots.push(day);
        }
        if (!newMealPlan[day].dinner) {
            remainingDinnerSlots.push(day);
        }
    }
    
    // Pre-select all recipes for lunch
    var selectedLunchMeals = [];
    for (var i = 0; i < remainingLunchSlots.length; i++) {
        var meal = selectMealWithIngredientPriority(lunchRecipes, ingredientUsage, usedRecipeIds, 'lunch');
        selectedLunchMeals.push(meal);
    }
    
    // Pre-select all recipes for dinner
    var selectedDinnerMeals = [];
    for (var i = 0; i < remainingDinnerSlots.length; i++) {
        var meal = selectMealWithIngredientPriority(dinnerRecipes, ingredientUsage, usedRecipeIds, 'dinner');
        selectedDinnerMeals.push(meal);
    }
    
    // Shuffle the selected meals to randomize their placement
    shuffleArray(selectedLunchMeals);
    shuffleArray(selectedDinnerMeals);
    
    // Assign shuffled meals to slots
    for (var i = 0; i < remainingLunchSlots.length; i++) {
        newMealPlan[remainingLunchSlots[i]].lunch = selectedLunchMeals[i];
    }
    
    for (var i = 0; i < remainingDinnerSlots.length; i++) {
        newMealPlan[remainingDinnerSlots[i]].dinner = selectedDinnerMeals[i];
    }
    
    // Check for unused ingredients
    var unusedIngredients = [];
    for (var ingredient in ingredientUsage) {
        if (ingredientUsage.hasOwnProperty(ingredient)) {
            var usage = ingredientUsage[ingredient];
            if (usage.used < usage.required) {
                unusedIngredients.push({
                    ingredient: ingredient,
                    remaining: usage.required - usage.used
                });
            }
        }
    }
    
    // Check for required meals that weren't placed
    var unusedMeals = [];
    for (var i = 0; i < requiredMealsToPlace.length; i++) {
        var mealId = requiredMealsToPlace[i].recipe_id;
        if (placedRequiredMeals.indexOf(mealId) === -1) {
            unusedMeals.push(requiredMealsToPlace[i].name);
        }
    }
    
    return {
        mealPlan: newMealPlan,
        unusedIngredients: unusedIngredients,
        unusedMeals: unusedMeals
    };
}

function updateIngredientUsage(recipe, ingredientUsage) {
    var recipeIngredients = recipe.ingredients.toLowerCase().split(',').map(function(ing) {
        return ing.trim();
    });
    
    for (var ingredient in ingredientUsage) {
        if (ingredientUsage.hasOwnProperty(ingredient)) {
            var usage = ingredientUsage[ingredient];
            if (usage.used < usage.required) {
                // Check if recipe contains this ingredient
                for (var j = 0; j < recipeIngredients.length; j++) {
                    if (recipeIngredients[j].indexOf(ingredient) !== -1 || ingredient.indexOf(recipeIngredients[j]) !== -1) {
                        usage.used++;
                        break;
                    }
                }
            }
        }
    }
}

function selectMealWithIngredientPriority(availableRecipes, ingredientUsage, usedRecipeIds, mealType) {
    if (availableRecipes.length === 0) {
        return null;
    }
    
    // First, try to find a recipe that contains an ingredient we still need
    var priorityRecipes = [];
    
    for (var i = 0; i < availableRecipes.length; i++) {
        var recipe = availableRecipes[i];
        
        // Skip if already used
        if (usedRecipeIds.indexOf(recipe.recipe_id) !== -1) {
            continue;
        }
        
        var recipeIngredients = recipe.ingredients.toLowerCase().split(',').map(function(ing) {
            return ing.trim();
        });
        
        // Check if this recipe contains any needed ingredients
        var hasNeededIngredient = false;
        for (var ingredient in ingredientUsage) {
            if (ingredientUsage.hasOwnProperty(ingredient)) {
                var usage = ingredientUsage[ingredient];
                if (usage.used < usage.required) {
                    // Check if recipe contains this ingredient
                    for (var j = 0; j < recipeIngredients.length; j++) {
                        if (recipeIngredients[j].indexOf(ingredient) !== -1 || ingredient.indexOf(recipeIngredients[j]) !== -1) {
                            hasNeededIngredient = true;
                            break;
                        }
                    }
                }
                if (hasNeededIngredient) break;
            }
        }
        
        if (hasNeededIngredient) {
            priorityRecipes.push(recipe);
        }
    }
    
    // Select from priority recipes first
    var selectedRecipe = null;
    if (priorityRecipes.length > 0) {
        selectedRecipe = priorityRecipes[Math.floor(Math.random() * priorityRecipes.length)];
    } else {
        // If no priority recipes, select any unused recipe
        var unusedRecipes = [];
        for (var i = 0; i < availableRecipes.length; i++) {
            if (usedRecipeIds.indexOf(availableRecipes[i].recipe_id) === -1) {
                unusedRecipes.push(availableRecipes[i]);
            }
        }
        if (unusedRecipes.length > 0) {
            selectedRecipe = unusedRecipes[Math.floor(Math.random() * unusedRecipes.length)];
        }
    }
    
    if (!selectedRecipe) {
        return null;
    }
    
    // Mark recipe as used
    usedRecipeIds.push(selectedRecipe.recipe_id);
    
    // Update ingredient usage
    var recipeIngredients = selectedRecipe.ingredients.toLowerCase().split(',').map(function(ing) {
        return ing.trim();
    });
    
    for (var ingredient in ingredientUsage) {
        if (ingredientUsage.hasOwnProperty(ingredient)) {
            var usage = ingredientUsage[ingredient];
            if (usage.used < usage.required) {
                // Check if recipe contains this ingredient
                for (var j = 0; j < recipeIngredients.length; j++) {
                    if (recipeIngredients[j].indexOf(ingredient) !== -1 || ingredient.indexOf(recipeIngredients[j]) !== -1) {
                        usage.used++;
                        break;
                    }
                }
            }
        }
    }
    
    // Handle full meal vs half meal
    if (selectedRecipe.is_full_meal === 'True' || selectedRecipe.is_full_meal === true) {
        return [selectedRecipe];
    } else {
        // For half meals, try to find a second recipe
        var secondRecipe = null;
        for (var i = 0; i < availableRecipes.length; i++) {
            var recipe = availableRecipes[i];
            if (usedRecipeIds.indexOf(recipe.recipe_id) === -1 && 
                (recipe.is_full_meal === 'False' || recipe.is_full_meal === false)) {
                secondRecipe = recipe;
                usedRecipeIds.push(recipe.recipe_id);
                break;
            }
        }
        return secondRecipe ? [selectedRecipe, secondRecipe] : [selectedRecipe];
    }
}

function displayUnusedIngredientsWarning(unusedIngredients, unusedMeals) {
    // Only show warning if there are unused items
    if ((!unusedIngredients || unusedIngredients.length === 0) && (!unusedMeals || unusedMeals.length === 0)) {
        return;
    }
    
    var warningDiv = document.createElement('div');
    warningDiv.className = 'ingredient-warning';
    warningDiv.id = 'ingredientWarning';
    
    var html = '<h4><i class="fas fa-exclamation-triangle"></i> Warning:</h4>';
    
    if (unusedIngredients && unusedIngredients.length > 0) {
        html += '<p style="margin-bottom: 10px;"><strong>Some ingredients could not be fully used:</strong></p>';
        html += '<ul style="margin-bottom: 15px;">';
        for (var i = 0; i < unusedIngredients.length; i++) {
            var item = unusedIngredients[i];
            html += '<li><strong>' + item.ingredient + '</strong>: ' + item.remaining + ' remaining (not enough recipes found)</li>';
        }
        html += '</ul>';
    }
    
    if (unusedMeals && unusedMeals.length > 0) {
        html += '<p style="margin-bottom: 10px;"><strong>Some required meals could not be placed:</strong></p>';
        html += '<ul>';
        for (var i = 0; i < unusedMeals.length; i++) {
            html += '<li><strong>' + unusedMeals[i] + '</strong> (not suitable for any remaining time slot)</li>';
        }
        html += '</ul>';
    }
    
    warningDiv.innerHTML = html;
    
    // Remove existing warning if present
    var existingWarning = document.getElementById('ingredientWarning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // Insert warning after meal plan display
    var mealPlanDisplay = document.getElementById('mealPlanDisplay');
    if (mealPlanDisplay && mealPlanDisplay.nextSibling) {
        mealPlanDisplay.parentNode.insertBefore(warningDiv, mealPlanDisplay.nextSibling);
    } else if (mealPlanDisplay) {
        mealPlanDisplay.parentNode.appendChild(warningDiv);
    }
}
