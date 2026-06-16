# AddClient Component - Quick Start Guide

## Overview
The AddClient component is now **fully functional and standalone** with no external dependencies. All data is handled with mock data and browser localStorage.

## Getting Started (3 Steps)

### Step 1: Access the Component
```bash
# Navigate to the add client page
http://localhost:5173/clients/add
```

### Step 2: Fill the Form
The form has 5 steps:
1. **Basic Info** - Company name, contact, dates
2. **Business** - Tax details (GST, PAN)
3. **Financial** - Payment terms, bank info
4. **Address** - Billing and shipping addresses
5. **Documents** - File uploads (UI only)

### Step 3: Save
- Fill required fields on each step
- Click "Next" to proceed
- On final step, click "Register Client"
- Data saved to localStorage automatically
- Redirected to clients list

## Mock Data Features

### Auto-Generated Client IDs
- Format: `CL-00001`, `CL-00002`, etc.
- Generated automatically when creating new client
- Guaranteed unique (random with padding)

### Sample Mock Data (for editing)
```javascript
{
  client_id: "CL-00001",
  company_name: "Acme Corporation",
  category: "IT Hardware",
  client_tier: "Premium Clients",
  contact_person: "John Doe",
  email: "john@acme.com",
  phone: "+91 98765 43210",
  mobile: "+91 99876 54321",
  website: "www.acme.com",
  contract_start_date: "2024-01-01",
  contract_end_date: "2025-01-01",
  // ... and 20+ more fields
}
```

### localStorage Persistence
```javascript
// Clients stored in browser localStorage
localStorage.getItem("clients")  // Returns JSON array of clients

// View saved clients in browser console
const clients = JSON.parse(localStorage.getItem("clients") || "[]");
console.log(clients);
```

## Navigation Flow

```
/clients (ClientsPage)
    ↓ [Click "Add Client"]
/clients/add (AddClient new)
    ↓ [Fill form and save]
/clients (Back to list with new client)

OR

/clients/:id (Edit existing client)
    ↓ [Modify form and save]
/clients (Back to list with updated client)
```

## Testing Locally

### Run Unit Tests
```bash
cd /vercel/share/v0-project
pnpm exec vitest run src/pages/__tests__/AddClient.test.ts
```

### View Component in Browser
```bash
# Start dev server
npm run dev

# Navigate to
http://localhost:5173/clients/add

# Check browser console for mock data logging
```

### Check localStorage
```javascript
// In browser console
localStorage.getItem("clients")
// Output: [{"client_id":"CL-00001","company_name":"..."}]
```

## Common Tasks

### View All Saved Clients
```javascript
const clients = JSON.parse(localStorage.getItem("clients") || "[]");
console.table(clients);  // Pretty print table
```

### Clear All Client Data
```javascript
localStorage.removeItem("clients");
localStorage.clear();  // Clears all localStorage
```

### Find Specific Client
```javascript
const clients = JSON.parse(localStorage.getItem("clients") || "[]");
const acme = clients.find(c => c.company_name === "Acme Corporation");
console.log(acme);
```

## Form Validation Rules

### Step 1: Basic Info (Required)
- [ ] Company Name
- [ ] Category
- [ ] Client Tier
- [ ] Contact Person
- [ ] Email
- [ ] Contract Start Date
- [ ] Contract End Date

### Step 2: Business (Required)
- [ ] GST Treatment
- [ ] GSTIN
- [ ] PAN Number

### Step 3: Financial (Required)
- [ ] Payment Terms
- [ ] Bank Name
- [ ] Account Number

### Step 4: Address (Required)
- [ ] Billing Address
- [ ] Billing City
- [ ] Billing State
- [ ] Billing Pincode
- [ ] Shipping Address (or check "Same as billing")

### Step 5: Documents (Optional)
- Optional file uploads (UI mockup)

## UI Component Details

### Available Components
- **Input** (`@/components/ui/input`) - Text inputs
- **Textarea** (`@/components/ui/textarea`) - Multi-line text
- **Select** (`@/components/ui/select`) - Dropdowns
  - Supports open/close state
  - Click-outside detection
  - Keyboard navigation
- **Card** (`@/components/ui/card`) - Container

### Styling
All components use Tailwind CSS:
- Border color: `border-gray-300`
- Focus color: `focus:ring-blue-500`
- Hover: `hover:bg-blue-50`
- Disabled: `disabled:opacity-50`

## Troubleshooting

### Component Not Loading
```
✅ Check: Route is defined in App.tsx (line 222)
✅ Check: AddClient.tsx has export default
✅ Check: Browser console for errors
```

### Form Not Saving
```
✅ Check: All required fields are filled
✅ Check: localStorage is enabled in browser
✅ Check: Browser console shows success message
```

### Form Fields Not Updating
```
✅ Check: You're on the correct step
✅ Check: Field is not disabled
✅ Check: Browser console for errors
```

### Select Dropdown Not Working
```
✅ Check: Click trigger button to open
✅ Check: Select items are visible
✅ Check: Click item to select it
✅ Check: Dropdown auto-closes after selection
```

## Browser DevTools Tips

### Check localStorage
```javascript
// Open DevTools → Application → Local Storage
// Or in Console:
localStorage
// Object with clients key
```

### Monitor Form State
```javascript
// Add to AddClient component for debugging
useEffect(() => {
  console.log("[v0] Form data:", formData);
}, [formData]);
```

### Trace Navigation
```javascript
// In browser console
window.location.href  // Current URL
// Check React Router logs
```

## File Locations

```
src/pages/AddClient.tsx                    ← Main component
src/components/ui/input.tsx                ← Input component
src/components/ui/textarea.tsx             ← Textarea component
src/components/ui/select.tsx               ← Select/Dropdown component
src/components/ui/card.tsx                 ← Card component
src/pages/ClientsPage.tsx                  ← Clients list (integration point)
ADDCLIENT_COMPLETE.md                      ← Full documentation
ADDCLIENT_INTEGRATION.md                   ← Integration details
```

## Performance Notes

- ✅ No external API calls
- ✅ Instant form validation
- ✅ Fast localStorage operations
- ✅ Zero network latency
- ✅ Perfect for prototyping/testing

## Next: Going to Production

When ready to deploy:
1. Replace localStorage with database (Neon/Supabase)
2. Replace mock data with API calls
3. Implement file upload service
4. Add authentication checks
5. Add error boundaries
6. Set up logging/monitoring

See ADDCLIENT_COMPLETE.md for detailed production migration guide.

---

**Status**: ✅ Ready for Development & Testing
**Last Updated**: 2024-06-16
**Version**: 1.0.0
