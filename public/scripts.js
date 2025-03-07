// scripts.js

async function fetchFoodInventory(callback, jsonPath) {
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const inventory = await response.json();
        localStorage.setItem('foodInventory', JSON.stringify(inventory));
        callback(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('output').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function loadInventory(callback, jsonPath) {
    const storedInventory = localStorage.getItem('foodInventory');
    if (storedInventory) {
        callback(JSON.parse(storedInventory));
    } else {
        fetchFoodInventory(callback, jsonPath);
    }
}

function savePreferences(event) {
    event.preventDefault();
    const preferences = Array.from(document.querySelectorAll("input[name='preference']:checked"))
                            .map(input => input.value);
    localStorage.setItem('dietPreferences', JSON.stringify(preferences));
    alert('Preferences saved!');
    loadInventory(generateRecommendations, 'db/foodinventory.json');
}

function generateRecommendations(inventory) {
    if (!inventory || inventory.length === 0) {
        document.getElementById('output').innerHTML = "<p>No food items found in inventory.</p>";
        return;
    }

    // Retrieve saved dietary preferences
    const savedPreferences = JSON.parse(localStorage.getItem('dietPreferences')) || [];

    // Define recommendations for each category
    const categories = {
        "Fruits": "Make a fresh fruit salad 🍓🍌🍎",
        "Vegetables": "Prepare a vegetable stir-fry 🥦🥕",
        "Snacks": "Have a snack break with some healthy options 🍫🍿",
        "Dairy": "Make a smoothie with dairy and fruits 🥛🍓",
        "Grains": "Prepare a healthy grain bowl 🍚🥑",
        "Meat": "Cook a protein-packed meal with meat 🍗🥩",
        "Seafood": "Try a seafood dish with fresh ingredients 🦐🐟",
        "Beverages": "Enjoy a refreshing beverage 🍵🥤",
        "Sweets": "Make a homemade dessert 🍪🍰"
    };

    // Exclude categories based on dietary preferences
    let excludedCategories = [];
    if (savedPreferences.includes("Vegetarian")) {
        excludedCategories.push("Meat", "Seafood");
    }
    if (savedPreferences.includes("Dairy-Free")) {
        excludedCategories.push("Dairy");
    }
    if (savedPreferences.includes("Low-Carb")) {
        excludedCategories.push("Grains");
    }
    if (savedPreferences.includes("Gluten-Free") && !excludedCategories.includes("Grains")) {
        excludedCategories.push("Grains");
    }

    let recommendations = [];
    for (let category in categories) {
        if (!excludedCategories.includes(category) && inventory.some(item => item.category === category)) {
            recommendations.push(categories[category]);
        }
    }

    if (recommendations.length === 0) {
        recommendations.push("No specific meals found. Try mixing what you have! 🍽");
    }

    document.getElementById('output').innerHTML = `
        <p><strong>Suggested Meals:</strong></p>
        <ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
    `;
}

function displayInventory(inventory) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <button onclick="removeFoodItem(${index})">Remove</button>
            <hr>
        `;
        outputDiv.appendChild(itemDiv);
    });
}

function addFoodItem(event) {
    event.preventDefault();
    const name = document.getElementById('foodName').value;
    const quantity = parseInt(document.getElementById('foodQuantity').value);
    const category = document.getElementById('foodCategory').value;

    if (!name || !quantity || !category) {
        alert('Please fill in all fields.');
        return;
    }

    let inventory = JSON.parse(localStorage.getItem('foodInventory')) || [];
    inventory.push({ name, quantity, category });
    localStorage.setItem('foodInventory', JSON.stringify(inventory));
    displayInventory(inventory);
    document.getElementById('foodForm').reset();
}

function removeFoodItem(index) {
    let inventory = JSON.parse(localStorage.getItem('foodInventory'));
    inventory.splice(index, 1);
    localStorage.setItem('foodInventory', JSON.stringify(inventory));
    displayInventory(inventory);
}

// Auto-detect which page is loaded and execute the correct function
document.addEventListener("DOMContentLoaded", () => {
    if (document.body.contains(document.getElementById('output'))) {
        if (window.location.pathname.includes('food-recommendations.html')) {
            document.getElementById('preferencesForm').addEventListener('submit', savePreferences);

            loadInventory(generateRecommendations, 'db/foodinventory.json');
        } else if (window.location.pathname.includes('view-database.html')) {

            loadInventory(displayInventory, 'foodinventory.json');
            document.getElementById('foodForm').addEventListener('submit', addFoodItem);
        }
    }
});
