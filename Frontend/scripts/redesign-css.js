const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/style.css');
let css = fs.readFileSync(cssPath, 'utf-8');

// 1. Root variables
css = css.replace(/:root\s*\{[\s\S]*?font-family:\s*'DM Sans', sans-serif;\s*\}/, `:root {
  --green-dark: #1A472A;
  --green-mid: #267326;
  --green-btn: #2E7D32;
  --green-btn-hover: #195e1e;
  --green-light-bg: #eef4ee;
  --gray-bg: #F5F8F5;
  --text-dark: #1B241B;
  --text-muted: #6b7280;
  --text-label: #4b5563;
  --border: #E8EEE8;
  --white: #ffffff;
  --shadow: 0 8px 30px rgba(46, 125, 50, 0.08);
  --error-bg: #fef0f0;
  --error-ink: #b91c1c;
  --success-bg: #f1fcf5;
  --success-ink: #166534;
  color: var(--text-dark);
  font-family: 'DM Sans', sans-serif;
}`);

// 2. Shell base
css = css.replace(/\.users-admin-shell\s*\{[\s\S]*?overflow:\s*hidden;\s*\}/, `.users-admin-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  background: var(--gray-bg);
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
}`);

// 3. Sidebar background
css = css.replace(/\.users-admin-sidebar\s*\{[\s\S]*?min-height:\s*0;\s*\}/, `.users-admin-sidebar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  color: var(--text-dark);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
  box-shadow: 4px 0 24px rgba(0,0,0,0.02);
  border-right: 1px solid var(--border);
  z-index: 10;
}`);

// 4. Sidebar logo wrapper
css = css.replace(/\.users-admin-sidebar__logo\s*\{[\s\S]*?flex-shrink:\s*0;\s*\}/, `.users-admin-sidebar__logo {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 24px;
  padding-left: 8px;
  flex-shrink: 0;
}`);

// 5. Sidebar logo img
css = css.replace(/\.users-admin-sidebar__logo img\s*\{[\s\S]*?object-fit:\s*contain;\s*\}/, `.users-admin-sidebar__logo img {
  width: 90px;
  height: auto;
  object-fit: contain;
}`);

// 6. Sidebar Nav Item
css = css.replace(/\.users-admin-sidebar__nav-item\s*\{[\s\S]*?flex-shrink:\s*0;\s*\}/, `.users-admin-sidebar__nav-item {
  border: none;
  background: transparent;
  color: #4b5563;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  flex-shrink: 0;
}`);

css = css.replace(/\.users-admin-sidebar__nav-item:hover\s*\{[\s\S]*?rgba\(255, 255, 255, 0\.26\);\s*\}/, `.users-admin-sidebar__nav-item:hover {
  background: rgba(46, 125, 50, 0.06);
  color: var(--green-btn);
  transform: translateX(3px);
}`);

css = css.replace(/\.users-admin-sidebar__nav-item\.is-active\s*\{[\s\S]*?rgba\(15, 61, 15, 0\.85\);\s*\}/, `.users-admin-sidebar__nav-item.is-active {
  background: var(--green-btn);
  color: #fff;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
}`);

// 7. Sidebar footer
css = css.replace(/\.users-admin-sidebar__footer\s*\{[\s\S]*?border-top:[\s\S]*?;\s*\}/, `.users-admin-sidebar__footer {
  margin-top: auto;
  text-align: left;
  display: grid;
  gap: 2px;
  flex-shrink: 0;
  padding: 16px 8px 0;
  border-top: 1px solid var(--border);
}`);

css = css.replace(/\.users-admin-sidebar__footer p\s*\{[\s\S]*?font-weight:\s*700;\s*\}/, `.users-admin-sidebar__footer p {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-dark);
}`);

css = css.replace(/\.users-admin-sidebar__footer small\s*\{[\s\S]*?font-size:\s*0\.7rem;\s*\}/, `.users-admin-sidebar__footer small {
  color: var(--text-muted);
  font-size: 0.75rem;
}`);

// Sidebar logout
css = css.replace(/\.users-admin-sidebar__logout\s*\{[\s\S]*?background:\s*#dc2626;\s*\}/, `.users-admin-sidebar__logout {
  margin-top: 12px;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fee2e2;
  font-weight: 600;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}`);

css = css.replace(/\.users-admin-sidebar__logout:hover\s*\{[\s\S]*?background:\s*#b91c1c;\s*\}/, `.users-admin-sidebar__logout:hover {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}`);

// 8. Header
css = css.replace(/\.users-admin-main__header\s*\{[\s\S]*?padding:\s*20px 24px;\s*\}/, `.users-admin-main__header {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  color: var(--text-dark);
  padding: 24px 32px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 5;
}`);

css = css.replace(/\.users-admin-main__header h1\s*\{[\s\S]*?font-size:\s*1\.85rem;\s*\}/, `.users-admin-main__header h1 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--green-dark);
}`);

css = css.replace(/\.users-admin-main__header p\s*\{[\s\S]*?color:\s*rgba\(255, 255, 255, 0\.86\);\s*\}/, `.users-admin-main__header p {
  margin: 4px 0 0;
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 500;
}`);

// 9. Main body and Admin Cards
css = css.replace(/\.users-admin-main__body\s*\{[\s\S]*?min-height:\s*0;\s*\}/, `.users-admin-main__body {
  padding: 24px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}`);

css = css.replace(/\.users-admin-card\s*\{[\s\S]*?padding:\s*18px 16px;\s*\}/, `.users-admin-card {
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow);
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}`);

// Create the hover rule
if(!css.includes('.users-admin-card:hover')) {
  css = css.replace('.users-admin-card__title', `.users-admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(46, 125, 50, 0.12);
}

.users-admin-card__title`);
}

css = css.replace(/\.users-admin-card__title\s*\{[\s\S]*?margin-bottom:\s*12px;\s*\}/g, `.users-admin-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}`);

css = css.replace(/\.users-admin-card__title h2\s*\{[\s\S]*?font-size:\s*1\.02rem;\s*\}/g, `.users-admin-card__title h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--green-dark);
}`);

fs.writeFileSync(cssPath, css);
console.log('CSS modified successfully!');
