# -*- coding: utf-8 -*-
import pandas as pd
import random
from faker import Faker
import json

# Initialize Faker for generating realistic data
fake = Faker()

# Recipe categories and cuisines
categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Soup', 'Salad', 
    'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage'
]

cuisines = [
    'Italian', 'Mexican', 'Chinese', 'Indian', 'American', 
    'French', 'Japanese', 'Thai', 'Italian', 'Greek',
    'Korean', 'Spanish', 'Mediterranean', 'Middle Eastern', 'Vietnamese'
]

# Sample ingredients by category
ingredients_by_category = {
    'Appetizer': ['cheese', 'crackers', 'olives', 'nuts', 'dips', 'bread'],
    'Main Course': ['chicken', 'beef', 'fish', 'pasta', 'rice', 'vegetables'],
    'Dessert': ['chocolate', 'sugar', 'flour', 'eggs', 'cream', 'fruits'],
    'Soup': ['broth', 'vegetables', 'herbs', 'meat', 'beans', 'grains'],
    'Salad': ['lettuce', 'tomatoes', 'cucumbers', 'dressing', 'nuts', 'cheese'],
    'Breakfast': ['eggs', 'bacon', 'toast', 'cereal', 'milk', 'fruits'],
    'Beverage': ['water', 'juice', 'tea', 'coffee', 'soda', 'alcohol']
}

# Cooking methods
cooking_methods = [
    'Baking', 'Grilling', 'Frying', 'Boiling', 'Steaming', 
    'Sautéing', 'Roasting', 'Slow Cooking', 'Raw', 'Microwaving'
]

# Difficulty levels
difficulty_levels = ['Easy', 'Medium', 'Hard']

def generate_recipe_name(category, cuisine):
    """Generate a realistic recipe name"""
    name_templates = [
        f"{cuisine} {category}",
        f"Classic {cuisine} {category}",
        f"Traditional {cuisine} {category}",
        f"Homestyle {cuisine} {category}",
        f"Authentic {cuisine} {category}"
    ]
    return random.choice(name_templates)

def generate_ingredients(category, num_ingredients=None):
    """Generate a list of ingredients for a recipe"""
    if num_ingredients is None:
        num_ingredients = random.randint(3, 12)
    
    # Base ingredients from category
    base_ingredients = ingredients_by_category.get(category, ingredients_by_category['Main Course'])
    
    # Common ingredients that appear in many recipes
    common_ingredients = ['salt', 'pepper', 'oil', 'butter', 'onion', 'garlic']
    
    # Generate ingredients
    ingredients = []
    
    # Add some common ingredients
    for ingredient in random.sample(common_ingredients, random.randint(1, 3)):
        ingredients.append(ingredient)
    
    # Add category-specific ingredients
    for ingredient in random.sample(base_ingredients, min(num_ingredients - len(ingredients), len(base_ingredients))):
        ingredients.append(ingredient)
    
    # Add some random ingredients
    random_ingredients = [
        'tomatoes', 'onions', 'bell peppers', 'mushrooms', 'spinach',
        'carrots', 'potatoes', 'lemon', 'lime', 'herbs', 'spices'
    ]
    
    while len(ingredients) < num_ingredients:
        ingredient = random.choice(random_ingredients)
        if ingredient not in ingredients:
            ingredients.append(ingredient)
    
    return ingredients[:num_ingredients]

def generate_instructions(ingredients, cooking_method):
    """Generate cooking instructions"""
    steps = [
        f"Prepare all ingredients by washing and chopping as needed.",
        f"Season the main ingredients with salt and pepper.",
        f"Cook using {cooking_method.lower()} method for optimal flavor.",
        f"Taste and adjust seasoning as needed.",
        f"Garnish and serve immediately."
    ]
    
    # Add ingredient-specific steps
    if 'pasta' in ingredients:
        steps.insert(2, "Boil water and cook pasta according to package directions.")
    if 'rice' in ingredients:
        steps.insert(2, "Rinse rice and cook with appropriate liquid ratio.")
    if 'vegetables' in ingredients:
        steps.insert(2, "Sauté vegetables until tender but still crisp.")
    
    return " ".join(steps)

def generate_full_meal_status(category):
    """Determine if recipe is a full meal or half meal"""
    full_meal_categories = ['Main Course', 'Dinner', 'Lunch', 'Breakfast']
    half_meal_categories = ['Appetizer', 'Salad', 'Soup', 'Snack', 'Beverage']
    
    if category in full_meal_categories:
        return random.choice([True, True, True, False])  # 75% chance of being full meal
    elif category in half_meal_categories:
        return random.choice([True, False, False, False])  # 25% chance of being full meal
    else:  # Dessert
        return random.choice([True, False])  # 50% chance

def generate_meal_time_status(category, meal_time):
    """Determine if recipe is suitable for lunch or dinner"""
    if meal_time == 'lunch':
        lunch_categories = ['Lunch', 'Main Course', 'Salad', 'Soup', 'Appetizer']
        return category in lunch_categories or random.choice([True, False])
    else:  # dinner
        dinner_categories = ['Dinner', 'Main Course', 'Soup', 'Appetizer']
        return category in dinner_categories or random.choice([True, False])

def generate_sweet_status(category):
    """Determine if recipe is sweet/dessert"""
    if category == 'Dessert':
        return True
    elif category in ['Appetizer', 'Salad', 'Soup']:
        return False
    else:
        return random.choice([True, False, False, False])  # 25% chance of being sweet

def generate_recipe_data(num_recipes=100):
    """Generate fake recipe dataset"""
    recipes = []
    
    for i in range(num_recipes):
        category = random.choice(categories)
        cuisine = random.choice(cuisines)
        cooking_method = random.choice(cooking_methods)
        difficulty = random.choice(difficulty_levels)
        
        # Generate recipe data
        recipe = {
            'recipe_id': i + 1,
            'name': generate_recipe_name(category, cuisine),
            'category': category,
            'cuisine': cuisine,
            'cooking_method': cooking_method,
            'difficulty': difficulty,
            'prep_time_minutes': random.randint(5, 60),
            'cook_time_minutes': random.randint(10, 180),
            'total_time_minutes': 0,  # Will be calculated
            'servings': random.randint(1, 12),
            'calories_per_serving': random.randint(150, 800),
            'rating': round(random.uniform(3.0, 5.0), 1),
            'ingredients': generate_ingredients(category),
            'instructions': "",
            'author': fake.name(),
            'date_created': fake.date_between(start_date='-2y', end_date='today').strftime('%Y-%m-%d'),
            'is_vegetarian': random.choice([True, False]),
            'is_vegan': random.choice([True, False]),
            'is_gluten_free': random.choice([True, False]),
            'is_dairy_free': random.choice([True, False]),
            'is_full_meal': generate_full_meal_status(category),
            'is_lunch': generate_meal_time_status(category, 'lunch'),
            'is_dinner': generate_meal_time_status(category, 'dinner'),
            'is_sweet': generate_sweet_status(category)
        }
        
        # Calculate total time
        recipe['total_time_minutes'] = recipe['prep_time_minutes'] + recipe['cook_time_minutes']
        
        # Generate instructions
        recipe['instructions'] = generate_instructions(recipe['ingredients'], cooking_method)
        
        # Convert ingredients list to string for CSV
        recipe['ingredients'] = ', '.join(recipe['ingredients'])
        
        recipes.append(recipe)
    
    return recipes

def main():
    """Main function to generate and save the dataset"""
    print("Generating fake recipe dataset...")
    
    # Generate 500 recipes for a substantial dataset
    recipes = generate_recipe_data(500)
    
    # Create DataFrame
    df = pd.DataFrame(recipes)
    
    # Save to CSV
    csv_filename = '/Users/Diego/Desktop/App/App/recipe_dataset.csv'
    df.to_csv(csv_filename, index=False)
    print(f"Dataset saved to {csv_filename}")
    
    # Save to JSON for alternative format
    json_filename = '/Users/Diego/Desktop/App/App/recipe_dataset.json'
    df.to_json(json_filename, orient='records', indent=2)
    print(f"Dataset also saved to {json_filename}")
    
    # Display basic statistics
    print(f"\nDataset Statistics:")
    print(f"Total recipes: {len(df)}")
    print(f"Categories: {df['category'].nunique()}")
    print(f"Cuisines: {df['cuisine'].nunique()}")
    print(f"Average rating: {df['rating'].mean():.2f}")
    print(f"Average prep time: {df['prep_time_minutes'].mean():.1f} minutes")
    print(f"Average cook time: {df['cook_time_minutes'].mean():.1f} minutes")
    
    # Show sample data
    print(f"\nSample recipes:")
    print(df[['name', 'category', 'cuisine', 'difficulty', 'rating']].head(10).to_string(index=False))

if __name__ == "__main__":
    main()
