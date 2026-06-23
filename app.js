// JavaScript for Backlog Dashboard

let goalsData = [];
let currentView = 'cards'; // 'cards' or 'list'
let activeFilters = {
    search: '',
    system: '',
    status: '',
    customer: '',
    businessUnit: '',
    value: [], // multiple values allowed
    difficulty: [] // multiple difficulties allowed
};

// Elements
const goalsGrid = document.getElementById('goalsGrid');
const tableViewContainer = document.getElementById('tableViewContainer');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filtersPanel = document.getElementById('filtersPanel');
const filterBadge = document.getElementById('filterBadge');
const emptyState = document.getElementById('emptyState');
const resetFiltersEmptyBtn = document.getElementById('resetFiltersEmptyBtn');

// View Switcher Buttons
const viewCardsBtn = document.getElementById('viewCardsBtn');
const viewListBtn = document.getElementById('viewListBtn');

// Stat Elements
const statTotal = document.getElementById('statTotal');
const statPlan = document.getElementById('statPlan');
const statBacklog = document.getElementById('statBacklog');

// Filter Selects
const filterSystem = document.getElementById('filterSystem');
const filterStatus = document.getElementById('filterStatus');
const filterCustomer = document.getElementById('filterCustomer');
const filterBusinessUnit = document.getElementById('filterBusinessUnit');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Drawer Elements
const drawerOverlay = document.getElementById('drawerOverlay');
const detailDrawer = document.getElementById('detailDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const drawerSystem = document.getElementById('drawerSystem');
const drawerStatus = document.getElementById('drawerStatus');
const drawerTitle = document.getElementById('drawerTitle');
const drawerCustomer = document.getElementById('drawerCustomer');
const drawerBusinessUnit = document.getElementById('drawerBusinessUnit');
const drawerValue = document.getElementById('drawerValue');
const drawerDifficulty = document.getElementById('drawerDifficulty');
const drawerAsIs = document.getElementById('drawerAsIs');
const drawerToBe = document.getElementById('drawerToBe');
const drawerTableSection = document.getElementById('drawerTableSection');
const drawerTableBody = document.getElementById('drawerTableBody');
const drawerValueList = document.getElementById('drawerValueList');
const drawerEffectsList = document.getElementById('drawerEffectsList');
const drawerPrereqSection = document.getElementById('drawerPrereqSection');
const drawerPrerequisites = document.getElementById('drawerPrerequisites');

// Load Data
async function loadGoals() {
    try {
        const response = await fetch('goals.json');
        goalsData = await response.json();
        
        initializeFilters();
        renderDashboard();
    } catch (error) {
        console.error('Error loading goals:', error);
        goalsGrid.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded empty-icon">error</span>
                <h3>Помилка завантаження даних</h3>
                <p>Не вдалося завантажити goals.json. Перевірте, чи запущено парсер.</p>
            </div>
        `;
    }
}

// Populate filters dynamically
function initializeFilters() {
    const customers = new Set();
    const businessUnits = new Set();
    
    goalsData.forEach(goal => {
        if (goal.tags.Замовник) {
            goal.tags.Замовник.split(',').forEach(c => customers.add(c.trim()));
        }
        if (goal.tags['Бізнес-напрям']) {
            businessUnits.add(goal.tags['Бізнес-напрям'].trim());
        }
    });

    // Populate Customer Dropdown
    Array.from(customers).sort().forEach(customer => {
        const option = document.createElement('option');
        option.value = customer;
        option.textContent = customer;
        filterCustomer.appendChild(option);
    });

    // Populate Business Unit Dropdown
    Array.from(businessUnits).sort().forEach(bu => {
        const option = document.createElement('option');
        option.value = bu;
        option.textContent = bu;
        filterBusinessUnit.appendChild(option);
    });
    
    // Add value selector click events
    setupPillSelector('valueSelector', 'value');
    setupPillSelector('difficultySelector', 'difficulty');
}

// Helper to setup pill click behaviors
function setupPillSelector(containerId, filterKey) {
    const container = document.getElementById(containerId);
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('pill-btn')) {
            const btn = e.target;
            const val = parseInt(btn.getAttribute('data-value'));
            
            btn.classList.toggle('selected');
            
            if (btn.classList.contains('selected')) {
                activeFilters[filterKey].push(val);
            } else {
                activeFilters[filterKey] = activeFilters[filterKey].filter(x => x !== val);
            }
            
            updateFilterBadge();
            renderDashboard();
        }
    });
}

// Update filter badge count
function updateFilterBadge() {
    let count = 0;
    if (activeFilters.system) count++;
    if (activeFilters.status) count++;
    if (activeFilters.customer) count++;
    if (activeFilters.businessUnit) count++;
    count += activeFilters.value.length;
    count += activeFilters.difficulty.length;
    
    filterBadge.textContent = count;
    filterBadge.style.display = count > 0 ? 'flex' : 'none';
}

// Reset all filters
function resetAllFilters() {
    activeFilters = {
        search: searchInput.value = '',
        system: filterSystem.value = '',
        status: filterStatus.value = '',
        customer: filterCustomer.value = '',
        businessUnit: filterBusinessUnit.value = '',
        value: [],
        difficulty: []
    };
    
    // Reset selected pill UI
    document.querySelectorAll('.pills-selector .pill-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    updateFilterBadge();
    renderDashboard();
}

// Match goal against active filters
function matchFilters(goal) {
    // Search filter
    if (activeFilters.search) {
        const q = activeFilters.search.toLowerCase();
        const inTitle = goal.title.toLowerCase().includes(q);
        const inAsIs = goal.description.as_is.toLowerCase().includes(q);
        const inToBe = goal.description.to_be.toLowerCase().includes(q);
        const inCustomer = goal.tags.Замовник && goal.tags.Замовник.toLowerCase().includes(q);
        const inGroup = goal.system_group.Група && goal.system_group.Група.toLowerCase().includes(q);
        
        if (!inTitle && !inAsIs && !inToBe && !inCustomer && !inGroup) {
            return false;
        }
    }
    
    // System filter
    if (activeFilters.system && goal.tags.Система !== activeFilters.system) {
        return false;
    }
    
    // Status filter
    if (activeFilters.status && goal.tags.Статус !== activeFilters.status) {
        return false;
    }
    
    // Customer filter (contains)
    if (activeFilters.customer) {
        if (!goal.tags.Замовник || !goal.tags.Замовник.includes(activeFilters.customer)) {
            return false;
        }
    }
    
    // Business unit filter
    if (activeFilters.businessUnit && goal.tags['Бізнес-напрям'] !== activeFilters.businessUnit) {
        return false;
    }
    
    // Value score filter
    if (activeFilters.value.length > 0) {
        const valScore = parseInt(goal.tags.Цінність);
        if (!activeFilters.value.includes(valScore)) {
            return false;
        }
    }
    
    // Difficulty score filter
    if (activeFilters.difficulty.length > 0) {
        const diffScore = parseInt(goal.tags.Складність);
        if (!activeFilters.difficulty.includes(diffScore)) {
            return false;
        }
    }
    
    return true;
}

// Render visible cards/table rows and stats
function renderDashboard() {
    const filteredGoals = goalsData.filter(matchFilters);
    
    // Update stats based on filtered list
    statTotal.textContent = filteredGoals.length;
    statPlan.textContent = filteredGoals.filter(g => g.tags.Статус === 'План').length;
    statBacklog.textContent = filteredGoals.filter(g => g.tags.Статус === 'Беклог').length;
    
    if (filteredGoals.length === 0) {
        goalsGrid.style.display = 'none';
        tableViewContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const planGoals = filteredGoals.filter(g => g.tags.Статус === 'Plan' || g.tags.Статус === 'План');
    const backlogGoals = filteredGoals.filter(g => g.tags.Статус !== 'Plan' && g.tags.Статус !== 'План');
    
    if (currentView === 'cards') {
        tableViewContainer.style.display = 'none';
        goalsGrid.style.display = 'grid';
        
        let gridHtml = '';
        if (planGoals.length > 0) {
            gridHtml += `<div class="grid-section-header"><span class="material-symbols-rounded">event_available</span>Включені в план (${planGoals.length})</div>`;
            gridHtml += planGoals.map(renderGoalCard).join('');
        }
        if (backlogGoals.length > 0) {
            gridHtml += `<div class="grid-section-header"><span class="material-symbols-rounded">archive</span>Беклог (${backlogGoals.length})</div>`;
            gridHtml += backlogGoals.map(renderGoalCard).join('');
        }
        goalsGrid.innerHTML = gridHtml;
        
        // Attach details click events
        document.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const goalId = parseInt(card.getAttribute('data-id'));
                openDrawer(goalId);
            });
        });
        
    } else {
        goalsGrid.style.display = 'none';
        tableViewContainer.style.display = 'block';
        
        let tableHtml = '';
        if (planGoals.length > 0) {
            tableHtml += `
                <tr class="table-group-header-row">
                    <td colspan="7">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="font-size: 1.25rem; color: var(--kernel-light-green);">event_available</span>
                            Включені в план (${planGoals.length})
                        </div>
                    </td>
                </tr>
            `;
            tableHtml += planGoals.map(renderGoalRow).join('');
        }
        if (backlogGoals.length > 0) {
            tableHtml += `
                <tr class="table-group-header-row">
                    <td colspan="7">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                            <span class="material-symbols-rounded" style="font-size: 1.25rem; color: var(--text-secondary);">archive</span>
                            Беклог (${backlogGoals.length})
                        </div>
                    </td>
                </tr>
            `;
            tableHtml += backlogGoals.map(renderGoalRow).join('');
        }
        tableBody.innerHTML = tableHtml;
        
        // Attach details click events to table rows (only with data-id)
        document.querySelectorAll('.goals-table tbody tr[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                const goalId = parseInt(row.getAttribute('data-id'));
                openDrawer(goalId);
            });
        });
    }
}

// Render functions for items
function renderGoalCard(goal) {
    const sysClass = goal.tags.Система === 'NAV' ? 'sys-nav' : (goal.tags.Система === 'TH' ? 'sys-th' : 'sys-nav-th');
    const sysTagClass = goal.tags.Система === 'NAV' ? 'nav' : (goal.tags.Система === 'TH' ? 'th' : 'nav-th');
    const statusClass = goal.tags.Статус === 'Plan' || goal.tags.Статус === 'План' ? 'plan' : 'backlog';
    const statusLabel = goal.tags.Статус === 'Plan' || goal.tags.Статус === 'План' ? 'План' : 'Беклог';
    
    return `
        <div class="goal-card ${sysClass}" data-id="${goal.id}">
            <div class="card-tags">
                <span class="sys-tag ${sysTagClass}">${goal.tags.Система}</span>
                <span class="status-tag ${statusClass}">${statusLabel}</span>
            </div>
            <div class="card-main">
                <h3 class="card-title">${goal.title}</h3>
                <p class="card-desc">${cleanDescriptionText(goal.description.as_is)}</p>
            </div>
            <div class="card-meta">
                <div class="meta-customer">
                    <span class="material-symbols-rounded">person</span>
                    ${goal.tags.Замовник || '-'}
                </div>
                <div class="meta-scores">
                    <div class="score-badge val" title="Цінність: ${goal.tags.Цінність}/5">
                        <span class="material-symbols-rounded">star</span>
                        ${goal.tags.Цінність}
                    </div>
                    <div class="score-badge diff" title="Складність: ${goal.tags.Складність}/5">
                        <span class="material-symbols-rounded">construction</span>
                        ${goal.tags.Складність}
                    </div>
                </div>
            </div>
            <button class="card-btn">
                <span>Детальніше</span>
                <span class="material-symbols-rounded">chevron_right</span>
            </button>
        </div>
    `;
}

function renderGoalRow(goal) {
    const sysClass = goal.tags.Система === 'NAV' ? 'sys-nav' : (goal.tags.Система === 'TH' ? 'sys-th' : 'sys-nav-th');
    const sysTagClass = goal.tags.Система === 'NAV' ? 'nav' : (goal.tags.Система === 'TH' ? 'th' : 'nav-th');
    const statusClass = goal.tags.Статус === 'Plan' || goal.tags.Статус === 'План' ? 'plan' : 'backlog';
    const statusLabel = goal.tags.Статус === 'Plan' || goal.tags.Статус === 'План' ? 'План' : 'Беклог';
    
    return `
        <tr class="${sysClass}" data-id="${goal.id}">
            <td>${goal.title}</td>
            <td><span class="sys-tag ${sysTagClass}" style="font-size: 0.65rem;">${goal.tags.Система}</span></td>
            <td>${goal.tags.Замовник || '-'}</td>
            <td>${goal.tags['Бізнес-напрям'] || '-'}</td>
            <td class="text-center" style="font-weight: 700; color: var(--accent-cyan); font-size: 0.95rem;">${goal.tags.Цінність}</td>
            <td class="text-center" style="font-weight: 700; color: var(--accent-red); font-size: 0.95rem;">${goal.tags.Складність}</td>
            <td><span class="status-tag ${statusClass}" style="display: inline-flex;">${statusLabel}</span></td>
        </tr>
    `;
}

// Helpers to clean markdown for card excerpts
function cleanDescriptionText(text) {
    return text.replace(/\*\*/g, '').replace(/–/g, '-').replace(/\n/g, ' ').trim();
}

// Open Detail Drawer
function openDrawer(goalId) {
    const goal = goalsData.find(g => g.id === goalId);
    if (!goal) return;
    
    // Set system & status
    drawerSystem.textContent = goal.tags.Система;
    drawerSystem.className = 'system-tag-large';
    drawerStatus.textContent = goal.tags.Статус === 'План' ? 'План' : 'Беклог';
    drawerStatus.className = `status-tag-large ${goal.tags.Статус === 'План' ? 'plan' : 'backlog'}`;
    
    // Set title and info tags
    drawerTitle.textContent = goal.title;
    drawerCustomer.textContent = goal.tags.Замовник || '-';
    drawerBusinessUnit.textContent = goal.tags['Бізнес-напрям'] || '-';
    drawerValue.innerHTML = `${goal.tags.Цінність} <span style="font-size: 0.75rem; color: var(--text-muted);">/ 5</span>`;
    drawerDifficulty.innerHTML = `${goal.tags.Складність} <span style="font-size: 0.75rem; color: var(--text-muted);">/ 5</span>`;
    
    // Set AS-IS and TO-BE descriptions
    drawerAsIs.innerHTML = formatMarkdownParagraphs(goal.description.as_is);
    drawerToBe.innerHTML = formatMarkdownParagraphs(goal.description.to_be);
    
    // Set Comparison Table
    if (goal.comparison_table && goal.comparison_table.length > 0) {
        drawerTableSection.style.display = 'block';
        drawerTableBody.innerHTML = goal.comparison_table.map(row => `
            <tr>
                <td><strong>${row.process}</strong></td>
                <td class="col-asis">${row.as_is}</td>
                <td class="col-tobe">${row.to_be}</td>
            </tr>
        `).join('');
    } else {
        drawerTableSection.style.display = 'none';
    }
    
    // Set Business Value
    if (goal.business_value && goal.business_value.length > 0) {
        drawerValueList.innerHTML = goal.business_value.map(valLine => {
            const cleanLine = valLine
                .replace(/^✅\s*/, '') // strip emoji since style list has icon
                .replace(/^\*\*/, '<strong>')
                .replace(/\*\*$/, '</strong>')
                .replace(/\*\*:\s*/, '</strong>: ')
                .replace(/^[–-]\s*/, '');
            
            if (cleanLine.includes('---') || cleanLine.trim() === '') return '';
            return `<li>${cleanLine}</li>`;
        }).join('');
    } else {
        drawerValueList.innerHTML = '<li>Дані відсутні</li>';
    }
    
    // Set Effects
    if (goal.effects && goal.effects.length > 0) {
        drawerEffectsList.innerHTML = goal.effects.map(effect => {
            const cleanEffect = effect.replace(/^[–-]\s*/, '').trim();
            return `<li>${cleanEffect}</li>`;
        }).join('');
    } else {
        drawerEffectsList.innerHTML = '<li>Ефекти будуть розраховані пізніше</li>';
    }
    
    // Set Prerequisites
    if (goal.prerequisites) {
        drawerPrereqSection.style.display = 'block';
        drawerPrerequisites.innerHTML = goal.prerequisites.replace(/^[⚠️\s*-]*/, '');
    } else {
        drawerPrereqSection.style.display = 'none';
    }
    
    // Open Drawer UI
    drawerOverlay.classList.add('open');
    detailDrawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent bg scroll
}

function closeDrawer() {
    drawerOverlay.classList.remove('open');
    detailDrawer.classList.remove('open');
    document.body.style.overflow = '';
}

// Convert markdown-style raw text into paragraphs
function formatMarkdownParagraphs(text) {
    if (!text) return '-';
    return text.split('\n')
        .map(p => p.trim())
        .filter(p => p !== '')
        .map(p => p.replace(/^\s*[–-]\s*/, '– '))
        .map(p => `<p style="margin-bottom: 0.5rem;">${p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`)
        .join('');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value;
    renderDashboard();
});

filterToggleBtn.addEventListener('click', () => {
    filterToggleBtn.classList.toggle('active');
    filtersPanel.classList.toggle('open');
});

// View switching listeners
viewCardsBtn.addEventListener('click', () => {
    if (currentView === 'cards') return;
    currentView = 'cards';
    viewCardsBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    renderDashboard();
});

viewListBtn.addEventListener('click', () => {
    if (currentView === 'list') return;
    currentView = 'list';
    viewListBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    renderDashboard();
});

// Dropdown updates
filterSystem.addEventListener('change', (e) => {
    activeFilters.system = e.target.value;
    updateFilterBadge();
    renderDashboard();
});

filterStatus.addEventListener('change', (e) => {
    activeFilters.status = e.target.value;
    updateFilterBadge();
    renderDashboard();
});

filterCustomer.addEventListener('change', (e) => {
    activeFilters.customer = e.target.value;
    updateFilterBadge();
    renderDashboard();
});

filterBusinessUnit.addEventListener('change', (e) => {
    activeFilters.businessUnit = e.target.value;
    updateFilterBadge();
    renderDashboard();
});

clearFiltersBtn.addEventListener('click', resetAllFilters);
resetFiltersEmptyBtn.addEventListener('click', resetAllFilters);

// Drawer close actions
closeDrawerBtn.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDrawer();
    }
});

// Run Init
loadGoals();
