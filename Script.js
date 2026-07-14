// Safe selector helper (returns null outside browser)
const $ = (s) => (typeof document !== 'undefined' ? document.querySelector(s) : null);

// TheMealDB endpoints
const MealDB = {
  base: 'https://www.themealdb.com/api/json/v1/1',
  categories: () => `https://www.themealdb.com/api/json/v1/1/categories.php`,
  searchByName: (foodName) => `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(foodName)}`,
  lookupById: (id) => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
  filterByCategory: (category) => `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`,
};

const FALLBACK_CATEGORIES = [
  { strCategory: 'Beef', strCategoryThumb: 'https://www.themealdb.com/images/category/beef.png', strCategoryDescription: 'Hearty beef dishes with rich flavors and satisfying textures.' },
  { strCategory: 'Breakfast', strCategoryThumb: 'https://www.themealdb.com/images/category/breakfast.png', strCategoryDescription: 'Quick and comforting dishes perfect for the start of the day.' },
  { strCategory: 'Chicken', strCategoryThumb: 'https://www.themealdb.com/images/category/chicken.png', strCategoryDescription: 'Versatile chicken recipes from classic comfort food to global favorites.' },
  { strCategory: 'Dessert', strCategoryThumb: 'https://www.themealdb.com/images/category/dessert.png', strCategoryDescription: 'Sweet treats and indulgent desserts for every occasion.' },
  { strCategory: 'Goat', strCategoryThumb: 'https://www.themealdb.com/images/category/goat.png', strCategoryDescription: 'Bold and flavorful goat dishes inspired by traditional cuisines.' },
  { strCategory: 'Lamb', strCategoryThumb: 'https://www.themealdb.com/images/category/lamb.png', strCategoryDescription: 'Tender lamb recipes with deep, savory character.' },
  { strCategory: 'Miscellaneous', strCategoryThumb: 'https://www.themealdb.com/images/category/miscellaneous.png', strCategoryDescription: 'A mixed collection of unique and creative recipes.' },
  { strCategory: 'Pasta', strCategoryThumb: 'https://www.themealdb.com/images/category/pasta.png', strCategoryDescription: 'Comforting pasta dishes from simple classics to hearty favorites.' },
  { strCategory: 'Pork', strCategoryThumb: 'https://www.themealdb.com/images/category/pork.png', strCategoryDescription: 'Satisfying pork recipes with smoky and savory notes.' },
  { strCategory: 'Seafood', strCategoryThumb: 'https://www.themealdb.com/images/category/seafood.png', strCategoryDescription: 'Fresh seafood options with bright and delicate flavors.' },
  { strCategory: 'Side', strCategoryThumb: 'https://www.themealdb.com/images/category/side.png', strCategoryDescription: 'Perfect accompaniments and small plates to complete a meal.' },
  { strCategory: 'Starter', strCategoryThumb: 'https://www.themealdb.com/images/category/starter.png', strCategoryDescription: 'Appealing starters and light bites to begin your meal.' },
  { strCategory: 'Vegan', strCategoryThumb: 'https://www.themealdb.com/images/category/vegan.png', strCategoryDescription: 'Plant-based recipes full of flavor and freshness.' },
  { strCategory: 'Vegetarian', strCategoryThumb: 'https://www.themealdb.com/images/category/vegetarian.png', strCategoryDescription: 'Vegetarian favorites that are creative, filling, and delicious.' },
];

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed with ${res.status}`);
  return res.json();
};

// Only run UI code in the browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const els = {
      drawer: $('#drawer'), menuBtn: $('#menuBtn'), closeBtn: $('#closeBtn'),
      catList: $('#catList'), catGrid: $('#catGrid'),
      searchInput: $('#searchInput'), searchBtn: $('#searchBtn'),
      mealsSection: $('#mealsSection'), mealsGrid: $('#mealsGrid'),
      catInfo: $('#catInfo'), mealDetail: $('#mealDetail'),
      crumb: $('#crumb'), categoriesSection: $('#categoriesSection'), homeBtn: $('#homeBtn'),
    };

    // Helpers
    function resetViews() {
      els.catInfo?.classList.add('hidden');
      els.mealDetail?.classList.add('hidden');
      els.mealsSection?.classList.add('hidden');
      els.crumb?.classList.add('hidden');
      if (els.categoriesSection) els.categoriesSection.classList.remove('hidden');
    }

    // Drawer toggle
    if (els.menuBtn) {
      els.menuBtn.addEventListener('click', () => {
        if (!els.drawer) return;
        const isOpen = els.drawer.classList.toggle('open');
        document.body.classList.toggle('drawer-open', isOpen);
        document.documentElement.classList.toggle('drawer-open', isOpen);
        els.menuBtn.classList.toggle('open', isOpen);
        els.menuBtn.innerText = isOpen ? '✕' : '☰';
        els.menuBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }
    if (els.closeBtn) {
      els.closeBtn.addEventListener('click', () => {
        if (!els.drawer) return;
        els.drawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
        document.documentElement.classList.remove('drawer-open');
        if (els.menuBtn) {
          els.menuBtn.classList.remove('open');
          els.menuBtn.innerText = '☰';
          els.menuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Load categories and drawer
    async function loadCategories() {
      let categories = [];
      try {
        const res = await get(MealDB.categories());
        categories = (res && res.categories) || [];
      } catch (err) {
        console.warn('Falling back to built-in categories', err);
        categories = FALLBACK_CATEGORIES;
      }

      if (!categories.length) {
        if (els.catGrid) els.catGrid.innerHTML = '<p>No categories available.</p>';
        return;
      }

      if (els.catGrid) els.catGrid.innerHTML = categories.map(c => `
        <div class="card" data-cat="${c.strCategory}">
          <div class="img-wrap"><img src="${c.strCategoryThumb}" alt="${c.strCategory}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=No+Image'"/></div>
          <div class="name"><span class="tag">${c.strCategory.toUpperCase()}</span></div>
        </div>
      `).join('');

      if (els.catList) els.catList.innerHTML = categories.map(c => `
        <li data-cat="${c.strCategory}">
          <img src="${c.strCategoryThumb}" alt="${c.strCategory}" />
          <span>${c.strCategory}</span>
        </li>
      `).join('');

      // Click handlers for category tiles and drawer items
      document.querySelectorAll('[data-cat]').forEach(el => {
        el.addEventListener('click', () => {
          const cat = el.dataset.cat;
          const meta = categories.find(c => c.strCategory === cat) || {};
          if (els.searchInput) els.searchInput.value = cat;
          showCategory(cat, meta.strCategoryDescription || '');
          if (els.drawer) {
            els.drawer.classList.remove('open');
            document.body.classList.remove('drawer-open');
            document.documentElement.classList.remove('drawer-open');
          }
          if (els.menuBtn) {
            els.menuBtn.classList.remove('open');
            els.menuBtn.innerText = '☰';
            els.menuBtn.setAttribute('aria-expanded', 'false');
          }
        });
      });

      if (els.drawer) {
        els.drawer.addEventListener('click', (ev) => {
          const li = ev.target.closest('[data-cat]');
          if (!li) return;
          const cat = li.dataset.cat;
          const meta = categories.find(c => c.strCategory === cat) || {};
          if (els.searchInput) els.searchInput.value = cat;
          showCategory(cat, meta.strCategoryDescription || '');
          els.drawer.classList.remove('open');
          document.body.classList.remove('drawer-open');
          document.documentElement.classList.remove('drawer-open');
          if (els.menuBtn) {
            els.menuBtn.classList.remove('open');
            els.menuBtn.innerText = '☰';
            els.menuBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    async function showCategory(cat, desc) {
      resetViews();
      if (els.catInfo) {
        els.catInfo.classList.remove('hidden');
        els.catInfo.innerHTML = `<h3>${cat}</h3><p>${desc}</p>`;
      }
      try {
        const res = await get(MealDB.filterByCategory(cat));
        const meals = res && res.meals;
        renderMeals(meals || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching category meals', err);
      }
    }

    async function searchMeals(q) {
      if (!q || !q.trim()) return;
      resetViews();
      try {
        const res = await get(MealDB.searchByName(q));
        const meals = res && res.meals;
        renderMeals(meals || []);
        // scroll to results (keep hero visible so meals appear under it)
        const ms = document.querySelector('#mealsSection');
        if (ms) ms.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        console.error('Search error', err);
      }
    }

    function renderMeals(meals) {
      if (els.mealsSection) els.mealsSection.classList.remove('hidden');
      if (!meals || !meals.length) {
        if (els.mealsGrid) els.mealsGrid.innerHTML = '<p>No meals found.</p>';
        return;
      }
      if (els.mealsGrid) els.mealsGrid.innerHTML = meals.map(m => `
        <div class="card" data-id="${m.idMeal}">
          <div class="img-wrap"><img src="${m.strMealThumb}" alt="${m.strMeal}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=No+Image'"/></div>
          <div class="name">
            ${m.strCategory ? `<span class="tag">${m.strCategory}</span>` : ''}
            ${m.strArea ? `<div class="area">${m.strArea}</div>` : ''}
            ${m.strMeal}
          </div>
        </div>
      `).join('');
    }

    // Delegate clicks for meal cards
    if (els.mealsGrid) {
      els.mealsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('[data-id]');
        if (card) showMeal(card.dataset.id);
      });
    }

    // Click visual state for images
    document.addEventListener('click', (e) => {
      const img = e.target.closest('.card img');
      document.querySelectorAll('.img-focused').forEach(i => i.classList.remove('img-focused'));
      if (img) img.classList.add('img-focused');
    });

    async function showMeal(id) {
      if (!id) return;
      try {
        const res = await get(MealDB.lookupById(id));
        const meals = res && res.meals;
        if (!meals || !meals.length) {
          resetViews();
          if (els.mealsSection) els.mealsSection.classList.remove('hidden');
          if (els.mealsGrid) els.mealsGrid.innerHTML = '<p>Details not found for this meal.</p>';
          return;
        }
        const m = meals[0];
        resetViews();
        if (els.crumb) {
          els.crumb.classList.remove('hidden');
          els.crumb.innerHTML = `🏠 » ${m.strMeal ? m.strMeal.toUpperCase() : 'MEAL'}`;
        }
        if (els.mealDetail) {
          els.mealDetail.classList.remove('hidden');
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = m[`strIngredient${i}`], mea = m[`strMeasure${i}`];
            if (ing && ing.trim()) ingredients.push(`${ing} - ${mea || ''}`);
          }
          els.mealDetail.innerHTML = `
            <div class="top">
              <img src="${m.strMealThumb || ''}" alt="${m.strMeal || ''}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=No+Image'" />
              <div>
                <h2>${m.strMeal || 'Unknown'}</h2>
                <div class="meta"><b>CATEGORY:</b> ${m.strCategory || '—'}</div>
                ${m.strArea ? `<div class="meta"><b>AREA:</b> ${m.strArea}</div>` : ''}
                ${m.strSource ? `<div class="meta"><b>Source:</b> <a href="${m.strSource}" target="_blank">${m.strSource}</a></div>` : ''}
                ${m.strTags ? `<div class="meta"><b>Tags:</b> ${m.strTags}</div>` : ''}
                <div class="ingredients">
                  <h4>Ingredients</h4>
                  <ol>${ingredients.map(i => `<li>${i}</li>`).join('')}</ol>
                </div>
              </div>
            </div>
            <div class="instructions">
              <h4>Instructions:</h4>
              <p>${(m.strInstructions || '').replace(/\n/g, '<br><br>')}</p>
            </div>
          `;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error loading meal details', err);
        resetViews();
        if (els.mealsSection) els.mealsSection.classList.remove('hidden');
        if (els.mealsGrid) els.mealsGrid.innerHTML = '<p>Error loading meal details.</p>';
      }
    }

    // Search handlers
    if (els.searchBtn) els.searchBtn.addEventListener('click', () => searchMeals((els.searchInput && els.searchInput.value) || ''));
    if (els.searchInput) els.searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = (els.searchInput && els.searchInput.value) ? els.searchInput.value.trim() : '';
        searchMeals(q);
      }
    });

    // Home and brand handlers
    if (els.homeBtn) {
      els.homeBtn.addEventListener('click', async () => {
        resetViews();
        if (els.drawer) {
          els.drawer.classList.remove('open');
          document.body.classList.remove('drawer-open');
          document.documentElement.classList.remove('drawer-open');
        }
        if (els.menuBtn) {
          els.menuBtn.classList.remove('open');
          els.menuBtn.innerText = '☰';
          els.menuBtn.setAttribute('aria-expanded', 'false');
        }
        // clear search, show hero and reload categories to show home items
        if (els.searchInput) els.searchInput.value = '';
        const hero = document.querySelector('.hero');
        if (hero) hero.classList.remove('hidden');
        try { await loadCategories(); } catch (err) { /* ignore */ }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    const brandEl = document.querySelector('.navbar-brand');
    if (brandEl) brandEl.addEventListener('click', e => { e.preventDefault(); if (els.homeBtn) els.homeBtn.click(); });

    // Initial load
    loadCategories();

    // Clear search input
    if (els.searchInput) els.searchInput.value = '';
  });
}
