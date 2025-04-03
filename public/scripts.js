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
    // For food-recommendations.html (in public folder), JSON is in the db folder.
    loadInventory(generateRecommendations, 'db/foodinventory.json');
}

function generateRecommendations(inventory) {
    if (!inventory || inventory.length === 0) {
        document.getElementById('output').innerHTML = "<p>No food items found in inventory.</p>";
        return;
    }

    // Retrieve saved dietary preferences
    const savedPreferences = JSON.parse(localStorage.getItem('dietPreferences')) || [];

    // Map each category to a dish name
    const dishMapping = {
        "Fruits": "fruit salad",
        "Vegetables": "vegetable stir-fry",
        "Snacks": "snack mix",
        "Dairy": "smoothie",
        "Grains": "grain bowl",
        "Meat": "protein dish",
        "Seafood": "seafood medley",
        "Beverages": "refreshing drink",
        "Sweets": "dessert"
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

    // Build realistic recommendations using available ingredients
    let recommendations = [];
    for (let category in dishMapping) {
        if (excludedCategories.includes(category)) continue;
        const items = inventory.filter(item => item.category === category);
        if (items.length > 0) {
            const ingredientNames = items.map(item => item.name).join(', ');
            recommendations.push(`Make a ${dishMapping[category]} with ${ingredientNames}.`);
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
            <form onsubmit="saveEditedItem(event, ${index})" class="edit-form">
                <p>
                    <strong>Name:</strong>
                    <input type="text" name="name" value="${item.name}" required />
                </p>
                <p>
                    <strong>Quantity:</strong>
                    <input type="number" name="quantity" value="${item.quantity}" required />
                </p>
                <p>
                    <strong>Category:</strong>
                    <select name="category" required>
                        ${["Fruits", "Vegetables", "Snacks", "Dairy", "Grains", "Meat", "Seafood", "Beverages", "Sweets"]
                            .map(cat => `<option value="${cat}" ${cat === item.category ? "selected" : ""}>${cat}</option>`)
                            .join('')}
                    </select>
                </p>
                <button type="submit">Save</button>
                <button type="button" onclick="removeFoodItem(${index})">Remove</button>
            </form>
            <hr>
        `;
        outputDiv.appendChild(itemDiv);
    });
}

function addFoodItem(event) {
    event.preventDefault();
    const name = document.getElementById('foodName').value.trim();
    const quantity = parseInt(document.getElementById('foodQuantity').value);
    const category = document.getElementById('foodCategory').value;

    if (!name || !quantity || !category) {
        alert('Please fill in all fields.');
        return;
    }

    let inventory = JSON.parse(localStorage.getItem('foodInventory')) || [];

    // Check for existing item (case-insensitive match)
    const existingIndex = inventory.findIndex(
        item => item.name.toLowerCase() === name.toLowerCase() && item.category === category
    );

    if (existingIndex !== -1) {
        // If exists, update the quantity
        inventory[existingIndex].quantity += quantity;
    } else {
        // Else, add as new item
        inventory.push({ name, quantity, category });
    }

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

function saveEditedItem(event, index) {
    event.preventDefault();

    const form = event.target;
    const name = form.name.value.trim();
    const quantity = parseInt(form.quantity.value);
    const category = form.category.value;

    if (!name || !quantity || !category) {
        alert("Please fill in all fields.");
        return;
    }

    let inventory = JSON.parse(localStorage.getItem("foodInventory")) || [];
    inventory[index] = { name, quantity, category };
    localStorage.setItem("foodInventory", JSON.stringify(inventory));
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