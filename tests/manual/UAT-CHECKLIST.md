# BookmarkHub UAT Manual Testing Checklist

Use this checklist for manual testing after automated tests pass.

## 🔐 Authentication

### Login
- [ ] Login with valid credentials works
- [ ] Login with invalid email shows error
- [ ] Login with wrong password shows error
- [ ] "Forgot password" link works
- [ ] Session persists after page refresh
- [ ] Logout clears session completely

### Registration
- [ ] Registration with new email works
- [ ] Registration with existing email shows error
- [ ] Password validation works (min length, complexity)
- [ ] Email verification sent (if enabled)
- [ ] Welcome email received

---

## 📑 Bookmarks

### Viewing
- [ ] Homepage displays trending bookmarks
- [ ] Browse page shows all public bookmarks
- [ ] Bookmark cards display: title, description, favicon, tags
- [ ] Clicking bookmark opens external URL
- [ ] Rating stars display correctly
- [ ] Pagination works (if implemented)

### Creating (Logged in)
- [ ] Submit bookmark form loads
- [ ] URL auto-fetches title and description
- [ ] Favicon auto-populates
- [ ] Can select multiple tags
- [ ] Can select group restrictions
- [ ] Submission creates pending bookmark
- [ ] Success message displayed

### Editing
- [ ] Edit button visible for own bookmarks
- [ ] Edit form pre-populates data
- [ ] Changes save correctly
- [ ] Version history updated

---

## 🔍 Search & Filtering

### Search
- [ ] Search by title works
- [ ] Search by description works
- [ ] Search highlights matching terms
- [ ] Empty search shows all results
- [ ] Search from homepage redirects correctly

### Filters
- [ ] Category filter works
- [ ] Tag filter works (multi-select)
- [ ] Sort by newest works
- [ ] Sort by rating works
- [ ] Sort by popularity works
- [ ] Filters persist in URL
- [ ] Clear filters works

---

## ⭐ User Features

### Favorites
- [ ] Can add bookmark to favorites
- [ ] Can remove from favorites
- [ ] Favorites page shows saved bookmarks
- [ ] Heart icon toggles state

### Rating
- [ ] Can rate a bookmark (1-5 stars)
- [ ] Can update existing rating
- [ ] Average rating updates after voting
- [ ] Rating count increments

### Comments
- [ ] Can add comment to bookmark
- [ ] Comment appears immediately
- [ ] Can delete own comments
- [ ] Cannot delete others' comments
- [ ] Comment count updates

---

## 👥 Groups

### Viewing
- [ ] Groups page lists available groups
- [ ] Group details show member count
- [ ] Can see public groups without login

### Joining
- [ ] Can request to join private group
- [ ] Can join public group directly
- [ ] Secret code entry works (if applicable)
- [ ] Pending requests show status

### Group Bookmarks
- [ ] Group-restricted bookmarks visible to members
- [ ] Non-members cannot see restricted bookmarks

---

## 🛡️ Admin Features

### Dashboard
- [ ] Admin can access /admin
- [ ] Stats display correctly
- [ ] Pending submissions list shows

### Moderation
- [ ] Can approve bookmark submissions
- [ ] Can reject submissions (with reason)
- [ ] Can approve group creation requests
- [ ] Can manage user roles

---

## 📱 Responsive Design

### Mobile (< 768px)
- [ ] Navigation collapses to hamburger
- [ ] Mobile menu opens/closes
- [ ] Cards stack vertically
- [ ] Touch targets are adequate size
- [ ] No horizontal scrolling

### Tablet (768px - 1024px)
- [ ] 2-column layout works
- [ ] Navigation adapts appropriately

### Desktop (> 1024px)
- [ ] 3-column layout on browse
- [ ] Sidebar visible (if applicable)
- [ ] Full navigation visible

---

## 🌐 Cross-Browser Testing

- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] Edge - all features work
- [ ] Mobile Safari (iOS) - all features work
- [ ] Mobile Chrome (Android) - all features work

---

## ⚡ Performance

- [ ] Homepage loads in < 3 seconds
- [ ] Browse page loads in < 5 seconds
- [ ] No layout shifts during load
- [ ] Images lazy load correctly
- [ ] Search results appear quickly

---

## 🐛 Edge Cases

- [ ] Very long bookmark title displays properly
- [ ] Very long description truncates
- [ ] Special characters in search work
- [ ] Empty states show helpful messages
- [ ] Network error shows retry option
- [ ] 404 page displays for invalid URLs
- [ ] Back button works correctly

---

## ✅ Sign-off

| Tester | Date | Browser/Device | Pass/Fail | Notes |
|--------|------|----------------|-----------|-------|
|        |      |                |           |       |
|        |      |                |           |       |

---

## 📝 Issues Found

| # | Description | Severity | Steps to Reproduce | Status |
|---|-------------|----------|-------------------|--------|
| 1 |             |          |                   |        |
| 2 |             |          |                   |        |
| 3 |             |          |                   |        |
