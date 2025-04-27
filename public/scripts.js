// ---------------------- Food Inventory ----------------------

async function fetchFoodInventory(callback) {
    try {
        let inventory = JSON.parse(localStorage.getItem('foodInventory'));

        // Fetch fresh data if none or too few items
        if (!inventory || inventory.length < 5) {
            const response = await fetch('./db/foodinventory.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            inventory = await response.json();
            localStorage.setItem('foodInventory', JSON.stringify(inventory));
        }

        callback(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('output').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayInventory(inventory) {
    showLowStockAlert(inventory); // <- Call the alert function first

    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <form onsubmit="saveEditedItem(event, ${index})" class="edit-form">
                <p><strong>Name:</strong> <input type="text" name="name" value="${item.name}" required /></p>
                <p><strong>Quantity:</strong> <input type="number" name="quantity" value="${item.quantity}" required /></p>
                <p><strong>Category:</strong>
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


function showLowStockAlert(inventory) {
    const alertDiv = document.getElementById("lowStockAlert");
    if (!alertDiv) return; // <- Prevents the error

    const lowItems = inventory.filter(item => item.quantity < 5);

    if (lowItems.length > 0) {
        alertDiv.style.display = "block";
        alertDiv.innerHTML = `
            ⚠️ The following items are running low:
            <ul>
                ${lowItems.map(item => `<li>${item.name} (${item.quantity} left)</li>`).join('')}
            </ul>
        `;
    } else {
        alertDiv.style.display = "none";
        alertDiv.innerHTML = "";
    }
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

    const existingIndex = inventory.findIndex(
        item => item.name.toLowerCase() === name.toLowerCase() && item.category === category
    );

    if (existingIndex !== -1) {
        inventory[existingIndex].quantity += quantity;
    } else {
        inventory.push({ name, quantity, category });
    }

    localStorage.setItem('foodInventory', JSON.stringify(inventory));
    displayInventory(inventory);
    document.getElementById('foodForm').reset();
}

function removeFoodItem(index) {
    let inventory = JSON.parse(localStorage.getItem('foodInventory'));
    inventory.splice(index, 1);
    if (inventory.length === 0) {
        localStorage.removeItem('foodInventory');
    } else {
        localStorage.setItem('foodInventory', JSON.stringify(inventory));
    }
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

// ---------------------- Profiles ----------------------

function getProfiles() {
    return JSON.parse(localStorage.getItem("profiles")) || [];
}

function setProfiles(profiles) {
    localStorage.setItem("profiles", JSON.stringify(profiles));
}

function getActiveProfile() {
    return localStorage.getItem("activeProfile") || null;
}

function setActiveProfile(name) {
    localStorage.setItem("activeProfile", name);
    const display = document.getElementById("activeProfileDisplay");
    if (display) {
        display.innerText = `Active Profile: ${name}`;
    }
}

function saveProfilePreferences(preferences) {
    const profiles = getProfiles();
    const name = getActiveProfile();
    const index = profiles.findIndex(p => p.name === name);
    if (index !== -1) {
        profiles[index].preferences = preferences;
        setProfiles(profiles);
    }
}

function getActivePreferences() {
    const profiles = getProfiles();
    const name = getActiveProfile();
    const profile = profiles.find(p => p.name === name);
    return profile?.preferences || [];
}

// ---------------------- Recommendations ----------------------

function savePreferences(event) {
    event.preventDefault();
    const preferences = Array.from(document.querySelectorAll("input[name='preference']:checked"))
        .map(input => input.value);
    saveProfilePreferences(preferences);
    alert('Preferences saved!');
    fetchFoodInventory(generateRecommendations);
}

function generateRecommendations(inventory) {
    if (!inventory || inventory.length === 0) {
        document.getElementById('output').innerHTML = "<p>No food items found in inventory.</p>";
        return;
    }

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

    const preferences = getActivePreferences();

    for (let category in categories) {
        if (inventory.some(item => item.category === category)) {
            if ((preferences.includes("Vegetarian") && category === "Meat") ||
                (preferences.includes("Dairy-Free") && category === "Dairy") ||
                (preferences.includes("Low-Carb") && category === "Grains")) {
                continue;
            }
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

// ---------------------- Page Initialization ----------------------

document.addEventListener("DOMContentLoaded", () => {
    const active = getActiveProfile();
    if (active && document.getElementById("activeProfileDisplay")) {
        document.getElementById("activeProfileDisplay").innerText = `Active Profile: ${active}`;
    }

    // Profile creation handler
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("profileName").value.trim();
            if (!name) return;

            let profiles = getProfiles();
            if (!profiles.find(p => p.name === name)) {
                profiles.push({ name, preferences: [] });
                setProfiles(profiles);
            }
            setActiveProfile(name);
            document.getElementById("profileForm").reset();
            fetchFoodInventory(generateRecommendations);
        });
    }

    if (document.body.contains(document.getElementById('output'))) {
        if (window.location.pathname.includes('food-recommendations.html')) {
            const preferencesForm = document.getElementById('preferencesForm');
            if (preferencesForm) {
                preferencesForm.addEventListener('submit', savePreferences);
            }
            fetchFoodInventory(generateRecommendations);
        } else if (window.location.pathname.includes('view-database.html')) {
            fetchFoodInventory(displayInventory);
            const foodForm = document.getElementById('foodForm');
            if (foodForm) {
                foodForm.addEventListener('submit', addFoodItem);
            }
        }
    }
});
