// Fetch inventory data from foodinventory.json or localStorage
async function fetchFoodInventory(callback) {
    let inventory = JSON.parse(localStorage.getItem('foodInventory'));
    if (!inventory) {
        try {
            const response = await fetch('db/foodinventory.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            inventory = await response.json();
            localStorage.setItem('foodInventory', JSON.stringify(inventory));
        } catch (error) {
            console.error('Error fetching inventory:', error);
            document.getElementById('output').innerHTML = `<p>Error: ${error.message}</p>`;
            return;
        }
    }
    callback(inventory);
}

// Generate food recommendations based on available categories
function generateRecommendations(inventory) {
    let recommendations = [];
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

    for (let category in categories) {
        if (inventory.some(item => item.category === category)) {
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

// Display food inventory in view-database.html
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

// Add food item to inventory
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

// Remove food item from inventory
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
            fetchFoodInventory(generateRecommendations);
        } else if (window.location.pathname.includes('view-database.html')) {
            fetchFoodInventory(displayInventory);
            document.getElementById('foodForm').addEventListener('submit', addFoodItem);
        }
    }
});
