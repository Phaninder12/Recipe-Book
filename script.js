const STORAGE_KEY = 'recipe_book_v1';
let recipes = [];
let activeRecipeId = null;

// DOM references
const form = document.getElementById('recipeForm');
const nameInput = document.getElementById('name');
const ingredientsInput = document.getElementById('ingredients');
const stepsInput = document.getElementById('steps');
const imageInput = document.getElementById('imageInput');
const recipeIdField = document.getElementById('recipeId');
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

const modal = document.getElementById('modal');
const mTitle = document.getElementById('m-title');
const mSub = document.getElementById('m-sub');
const mThumb = document.getElementById('m-thumb');
const mIngredients = document.getElementById('m-ingredients');
const mSteps = document.getElementById('m-steps');

// utils
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
}
function load() {
  try {
    recipes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    console.error("Error loading from localStorage", e);
    recipes = [];
  }
}
function formatDate(ts) {
  return new Date(ts).toLocaleString();
}

function placeholder(name) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'>
    <rect width='100%' height='100%' fill='#0b1220'/>
    <text x='50%' y='50%' fill='#5b6b7f' font-size='18' text-anchor='middle'>${name}</text>
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function render(list) {
  gallery.innerHTML = '';
  if (!list || list.length === 0) {
    gallery.innerHTML = '<div class="muted">No recipes yet</div>';
    return;
  }
  list.forEach(r => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <img class="recipe-thumb" src="${r.image || placeholder(r.name)}">
      <div class="recipe-body">
        <h4 class="r-title">${r.name}</h4>
        <div class="r-sub">${r.ingredients.slice(0, 3).join(', ')}</div>
      </div>`;
    card.onclick = () => openModal(r.id);
    gallery.appendChild(card);
  });
}

function openModal(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  activeRecipeId = id;
  mTitle.textContent = r.name;
  mSub.textContent = `Added: ${formatDate(r.createdAt)}`;
  mThumb.src = r.image || placeholder(r.name);
  mIngredients.innerHTML = '';
  r.ingredients.forEach(i => {
    const d = document.createElement('div');
    d.textContent = i;
    d.className = 'small muted';
    mIngredients.appendChild(d);
  });
  mSteps.textContent = r.steps;
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  activeRecipeId = null;
}

// Handle form submit
form.onsubmit = async e => {
  e.preventDefault();
  if (!nameInput.value.trim()) return alert('Enter name');

  let img = null;
  if (imageInput && imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    img = await new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(file);
    });
  }

  const id = recipeIdField.value || uid();
  const exists = recipes.find(r => r.id === id);
  const obj = {
    id,
    name: nameInput.value.trim(),
    ingredients: ingredientsInput.value.split('\n').filter(Boolean),
    steps: stepsInput.value.trim(),
    image: img || (exists && exists.image) || null,
    createdAt: exists ? exists.createdAt : Date.now()
  };

  if (exists) {
    recipes = recipes.map(r => r.id === id ? obj : r);
  } else {
    recipes.unshift(obj);
  }

  save();
  render(recipes);
  form.reset();
  recipeIdField.value = '';
};

// Clear button
const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
  clearBtn.onclick = () => {
    form.reset();
    recipeIdField.value = '';
  };
}

// Close modal button
const closeBtn = document.getElementById('closeModal');
if (closeBtn) {
  closeBtn.onclick = closeModal;
}

// Delete button
const delBtn = document.getElementById('delBtn');
if (delBtn) {
  delBtn.onclick = () => {
    if (activeRecipeId) {
      recipes = recipes.filter(r => r.id !== activeRecipeId);
      save();
      render(recipes);
      closeModal();
    }
  };
}

// Edit button
const editBtn = document.getElementById('editBtn');
if (editBtn) {
  editBtn.onclick = () => {
    if (activeRecipeId) {
      const r = recipes.find(x => x.id === activeRecipeId);
      if (!r) return;
      nameInput.value = r.name;
      ingredientsInput.value = r.ingredients.join('\n');
      stepsInput.value = r.steps;
      recipeIdField.value = r.id;
      closeModal(); // closes the modal after displaying data for edit
      form.scrollIntoView({ behavior: "smooth" });
    }
  };
}

// init
load();
render(recipes);

// Search functionality
if (searchInput) {
  searchInput.oninput = e => {
    const q = e.target.value.toLowerCase();
    render(recipes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.ingredients.join(' ').toLowerCase().includes(q)
    ));
  };
}