// Theme Toggle Logic
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

function updateIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon';
        themeToggle.style.color = 'var(--accent-color)';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeToggle.style.color = 'var(--warning-color)';
    }
}

// Mobile Menu Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }
});

// Strategic Intelligence Stream Logic
const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const BASE_RSS = 'https://news.google.com/rss/search?q=';

let currentSector = 'all';
let newsLimit = 10;

const SECTOR_QUERIES = {
    all: 'Indian+Army+OR+Indian+Navy+OR+Indian+Air+Force+OR+DRDO+OR+BrahMos',
    army: 'Indian+Army+OR+Border+security+India+OR+LOC+Tactical',
    navy: 'Indian+Navy+OR+INS+Vikrant+OR+Submarine+India+OR+Naval+Strategic',
    airforce: 'Indian+Air+Force+OR+Rafale+OR+Tejas+Mk2+OR+IAF+Tactical',
    drdo: 'DRDO+India+OR+Missile+Test+OR+Indigenous+Defence+Tech'
};

const STRATEGIC_INTEL = [
    { title: "DRDO tests new high-speed expendable aerial target", description: "Successful flight trial of 'Abhyas' conducted from ITR Chandipur.", author: "DRDO HQ", pubDate: "2h ago", isStrategic: true, category: "DRDO" },
    { title: "INS Vikrant deployed for multi-carrier operations", description: "Indian Navy demonstrates dual-carrier strike group capability in IOR.", author: "Navy Command", pubDate: "4h ago", isStrategic: true, category: "Navy" },
    { title: "IAF confirms Tejas Mk2 design freeze", description: "Next-gen indigenous fighter enters final production planning phase.", author: "Air HQ", pubDate: "6h ago", isStrategic: true, category: "Air Force" }
];

async function fetchIntelStream() {
    const listContainer = document.getElementById('intelList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="intel-placeholder">Updating Intelligence Feed... Synchronizing with Command HQ...</div>';

    try {
        const query = SECTOR_QUERIES[currentSector];
        const response = await fetch(`${PROXY}${encodeURIComponent(BASE_RSS + query + '&hl=en-IN&gl=IN&ceid=IN:en')}`);
        const data = await response.json();

        if (data.status === 'ok') {
            renderIntelList(data.items);
        }
    } catch (e) {
        console.warn("Tactical Link Throttled. Switching to local Strategic Intelligence.");
        const statusMsg = document.createElement('div');
        statusMsg.className = 'intel-placeholder';
        statusMsg.style.color = 'var(--accent-color)';
        statusMsg.innerHTML = '<i class="fas fa-microchip"></i> Tactical Link Throttled. Displaying local Strategic Intelligence highlights.';
        
        listContainer.innerHTML = '';
        listContainer.appendChild(statusMsg);
        
        // Fallback to local highlights only
        renderIntelList([]);
    }
}

function renderIntelList(liveItems) {
    const listContainer = document.getElementById('intelList');
    const tickerContainer = document.getElementById('tickerScroll');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // Update Ticker Headlines
    if (tickerContainer && liveItems.length > 0) {
        const headlines = liveItems.slice(0, 5).map(item => `${item.title.split(' - ')[0]}`).join(' • ');
        tickerContainer.innerHTML = `<span class="ticker-msg">${headlines} • ${headlines}</span>`;
    }

    // Prepend Strategic Intel if on 'All'
    let itemsToDisplay = [];
    if (currentSector === 'all') {
        STRATEGIC_INTEL.forEach(item => itemsToDisplay.push(item));
    }

    liveItems.slice(0, newsLimit).forEach(item => {
        itemsToDisplay.push({
            title: item.title.split(' - ')[0],
            description: item.description.replace(/<[^>]*>?/gm, ''),
            author: item.author || 'PIB / Service HQ',
            pubDate: item.isStrategic ? item.pubDate : formatTimeAgo(item.pubDate),
            category: detectCategory(item.title),
            link: item.link
        });
    });

    itemsToDisplay.forEach(item => {
        const card = document.createElement('div');
        card.className = 'intel-card';
        card.onclick = () => window.open(item.link, '_blank');
        
        card.innerHTML = `
            <div class="intel-meta">
                <span class="intel-tag">${item.category}</span>
                <span class="intel-time"><i class="far fa-clock"></i> ${item.pubDate}</span>
                <span class="intel-source">${item.author}</span>
            </div>
            <h3>${highlightKeywords(item.title)}</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${item.description.substring(0, 120)}...</p>
        `;
        listContainer.appendChild(card);
    });
}

function filterBySector(sector, event) {
    currentSector = sector;
    document.querySelectorAll('.sector-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    newsLimit = 10;
    fetchIntelStream();
}

function loadMoreIntel() {
    newsLimit += 5;
    fetchIntelStream();
}

function formatTimeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000); // mins
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function detectCategory(title) {
    const t = title.toLowerCase();
    if (t.includes('army') || t.includes('border') || t.includes('land')) return 'Army';
    if (t.includes('navy') || t.includes('ship') || t.includes('sea') || t.includes('submarine')) return 'Navy';
    if (t.includes('iaf') || t.includes('air force') || t.includes('jet') || t.includes('aircraft')) return 'Air Force';
    if (t.includes('drdo') || t.includes('missile') || t.includes('test') || t.includes('tech')) return 'DRDO';
    return 'General';
}

function highlightKeywords(text) {
    const keywords = ['missile', 'test', 'induction', 'border', 'loc', 'lac', 'drdo', 'pib', 'brahmos', 'agni', 'rafale', 'tejas'];
    let h = text;
    keywords.forEach(k => {
        const r = new RegExp(`(${k})`, 'gi');
        h = h.replace(r, '<span style="color: var(--accent-color); font-weight: 700;">$1</span>');
    });
    return h;
}

// Initial Fetch
fetchIntelStream();

// Refresh every 10 minutes (User Requested)
setInterval(() => {
    fetchIntelStream();
}, 600000);

// Atmanirbhar Tabs (Toggle Support)
function showAtmaTab(tabId, event) {
    if (event) event.preventDefault();
    const btn = event.currentTarget;
    const isAlreadyActive = btn.classList.contains('active');
    
    const section = document.getElementById('atmanirbharSection');
    const panes = section.querySelectorAll('.tab-pane');
    const buttons = section.querySelectorAll('.tab-btn');
    
    panes.forEach(p => p.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    
    if (!isAlreadyActive) {
        const activePane = document.getElementById(tabId);
        if (activePane) activePane.classList.add('active');
        btn.classList.add('active');
    }
}

// Defence Power Tabs (Toggle Support)
function showPowerTab(tabId, event) {
    if (event) event.preventDefault();
    const btn = event.currentTarget;
    const isAlreadyActive = btn.classList.contains('active');
    
    const section = document.getElementById('defencePowerSection');
    const panes = section.querySelectorAll('.tab-pane');
    const buttons = section.querySelectorAll('.tab-btn');
    
    panes.forEach(p => p.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    
    if (!isAlreadyActive) {
        const activePane = document.getElementById(tabId);
        if (activePane) activePane.classList.add('active');
        btn.classList.add('active');
    }
}
