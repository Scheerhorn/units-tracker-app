console.log('js is running')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


const supabase = createClient(
    "https://fxpaqqpddrcunxcwnjgk.supabase.co",
    "sb_publishable_AmyQ5z5fnhOX8KL5pySplQ_Td16NI02"
);

// Detect which page we're on
const page = currentPage();

const onIndex = page === "index.html";
const onMain = page === "main.html";

// --- Check authentication on page load ---
init();

async function init() {
    const {
        data: { session }
    } = await supabase.auth.getSession();
    
    if (session) {
        // User is logged in
        if (onIndex) {
            window.location.href = "./main.html";
        }
        return;
    }
    
    // User NOT logged in
    if (onMain) {
    window.location.href = "./index.html";
    }
}

// Normalize paths so GitHub Pages works correctly
function currentPage() {
    const path = window.location.pathname.split("/").pop();
    return path === "" ? "index.html" : path;
}


async function loadPurchases() {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased_date", { ascending: false })
        .order("purchased_time", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    renderPurchases(data);
    renderRefreshes(data);
}

function renderPurchases(purchases) {
    const container = document.getElementById("purchases-list");

    if (purchases.length === 0) {
        container.innerHTML = "<p>No purchases yet.</p>";
        return;
    }

    container.innerHTML = purchases
        .map(p => {
            return `
                <div style="margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:6px;">
                    <strong>${p.purchased_date}</strong>
                    <em>${p.purchased_time}</em><br>
                    ${p.units_used} units @ ${p.dispensary}
                    <br>
                    <button 
                        class="delete-btn" 
                        data-id="${p.id}" 
                        style="margin-top:5px; color:white; background:red; border:none; padding:4px 8px; cursor:pointer;">
                        Delete
                    </button>
                </div>
            `;
        })
        .join("");

    // Attach delete handlers after rendering
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const purchaseId = e.target.dataset.id;
            deletePurchase(purchaseId);
        });
    });
}

async function deletePurchase(id) {
    const confirmDelete = confirm("Are you sure you want to delete this purchase?");
    if (!confirmDelete) return;

    const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting purchase: " + error.message);
        return;
    }

    // Re-load the updated list
    loadPurchases();
}


function renderRefreshes(purchases) {
    const container = document.getElementById("refresh-list");

    if (purchases.length === 0) {
        container.innerHTML = "<p>No upcoming refreshes.</p>";
        return;
    }

    const refreshMap = {};

    purchases.forEach(p => {
        const refreshDate = new Date(p.refresh_at);
        const dateKey = refreshDate.toISOString().split("T")[0];

        if (!refreshMap[dateKey]) {
            refreshMap[dateKey] = {
                units: 0,
                times: []
            };
        }

        refreshMap[dateKey].units += p.units_used;
        refreshMap[dateKey].times.push(p.purchased_time);
    });

    container.innerHTML = Object.entries(refreshMap)
        .map(([dateStr, data]) => {
            const refreshDate = new Date(dateStr);
            const now = new Date();

            // Normalize times so day comparison is accurate
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const target = new Date(refreshDate.getFullYear(), refreshDate.getMonth(), refreshDate.getDate());

            const diffMs = target - today;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            let dayLabel;

            if (diffDays === 0) {
                dayLabel = "today";
            } else if (diffDays === 1) {
                dayLabel = "tomorrow";
            } else {
                dayLabel = `in ${diffDays} days`;
            }

            // Use the first purchase time for the daily refresh
            const originalTime = data.times[0];
            let prettyTime = "";

            if (originalTime) {
                const dt = new Date(`${dateStr}T${originalTime}`);
                prettyTime = dt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                });
            }

            return `
                <div style="margin-bottom:10px;">
                    <strong>${data.units} units</strong> refresh 
                    <strong>${dayLabel}</strong> 
                    at <strong>${prettyTime}</strong>
                </div>
            `;
        })
        .join("");
}




async function showLoggedInEmail() {
    const emailDisplay = document.getElementById("user-email");

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (user && user.email) {
        emailDisplay.textContent = `Logged in as: ${user.email}`;
    } else {
        emailDisplay.textContent = "";
    }
}



// --- Login Logic (only works on index.html) ---
if (onIndex) {
  const loginButton = document.getElementById("login-button");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");

  loginButton?.addEventListener("click", async () => {
    errorMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorMessage.textContent = error.message;
      return;
    }

    window.location.href = "./main.html";
  });
}

// --- Logout Logic (only works on main.html) ---
if (onMain) {
    const logoutButton = document.getElementById("logout-button");
    const showFormBtn = document.getElementById("show-form");
    const purchaseForm = document.getElementById("purchase-form");

    const unitsInput = document.getElementById("units");
    const dispensaryInput = document.getElementById("dispensary");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");

    showLoggedInEmail();

    // Show the form
    showFormBtn?.addEventListener("click", () => {
        purchaseForm.style.display =
        purchaseForm.style.display === "none" ? "block" : "none";
    });

    // Handle form submit
    purchaseForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const units_used = Number(unitsInput.value);
        const dispensary = dispensaryInput.value.trim();
        const date = dateInput.value;
        const time = timeInput.value;

        if (!units_used || !dispensary || !date || !time) {
        alert("Please fill in all fields.");
        return;
        }


        // Get logged in user
        const {
        data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from("purchases").insert({
            user_id: user.id,
            units_used,
            dispensary,
            purchased_date: date,
            purchased_time: time,
        }); 

        if (error) {
        alert("Error saving purchase: " + error.message);
        return;
        }

        alert("Purchase added successfully!");

        // Reset form
        purchaseForm.reset();
        purchaseForm.style.display = "none";
    });

    loadPurchases();

    // Logout
    logoutButton?.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "./index.html";
    });
};
