# Responsive Design Guidelines for NIDO Procurement Platform

## Overview
This document establishes responsive design standards to ensure all pages display correctly across all screen sizes and zoom levels without gaps or overflow.

## Key Principles

### 1. No Side Gaps - Full Width Content
- **AppLayout**: Uses `w-full` with responsive padding instead of `max-w-*`
- **Padding Strategy**: 
  ```tailwind
  p-3 sm:p-4 md:p-6 lg:p-8
  ```
  - Mobile (< 640px): p-3 (12px)
  - Tablet (640px-768px): p-4 (16px)
  - Desktop (768px-1024px): p-6 (24px)
  - Large (> 1024px): p-8 (32px)

### 2. Grid Responsive Patterns

#### KPI Cards (6 items) - Primary Pattern
```tailwind
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4 lg:gap-3
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Ultra-wide: 6 columns
- Gap: 12px base, 16px on medium+, 12px on large+

#### 4-Item Cards Pattern
```tailwind
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-4
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns

#### 3-Item Cards Pattern (Charts, Activities)
```tailwind
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

### 3. Card/Component Sizing

#### Responsive Padding
```tailwind
p-4 sm:p-5 md:p-6
```

#### Responsive Typography
```tailwind
text-xs sm:text-sm              /* labels */
text-xl sm:text-2xl             /* large values */
text-lg sm:text-base            /* section headers */
```

#### Responsive Icons
```tailwind
w-10 h-10 sm:w-12 sm:h-12       /* icon containers */
size-4 sm:size-5 md:size-6      /* inline icons */
```

### 4. Rectangular Card Shape
Ensure cards maintain proper proportions:
```tailwind
h-full flex flex-col justify-between   /* allows content to grow */
truncate                                /* prevent text overflow */
break-words                             /* handle long text */
```

### 5. Gap/Spacing Consistency

**Between Sections**: Add vertical spacing
```tailwind
mb-6 md:mb-8
mt-6 md:mt-8
```

**Between Items in Grid**: Use gap property
```tailwind
gap-3 sm:gap-4 md:gap-6
```

## Breakpoints (Tailwind Default)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Testing Checklist

- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1024px width)
- [ ] Test on ultra-wide (1440px width)
- [ ] Test at 75% zoom
- [ ] Test at 100% zoom
- [ ] Test at 125% zoom
- [ ] Verify no horizontal scroll
- [ ] Verify no side gaps visible
- [ ] Verify cards remain rectangular

## Common Issues & Solutions

### Issue: Side Gaps Visible
**Solution**: Remove `max-w-*` constraints, use `w-full` with padding

### Issue: Cards Not Rectangular
**Solution**: Add `h-full flex flex-col justify-between` to card containers

### Issue: Grid Breaks on Zoom
**Solution**: Use responsive padding instead of fixed widths

### Issue: Overflow on Small Screens
**Solution**: Ensure breakpoints are: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## Implementation Examples

### Dashboard Page
```tsx
// ✓ Correct
<div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4 lg:gap-3">
    {/* Cards */}
  </div>
</div>

// ✗ Incorrect
<div className="p-6 max-w-7xl mx-auto">
  <div className="grid grid-cols-6 gap-4">
    {/* Cards */}
  </div>
</div>
```

### List Pages (Clients, Vendors, etc.)
```tsx
// Use full width with responsive padding
<div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
  <div className="overflow-x-auto">
    <table className="w-full table-auto">
      {/* Table content */}
    </table>
  </div>
</div>
```

## Future Page Requirements

All new pages MUST:
1. Use AppLayout wrapper (automatically provides responsive context)
2. Use responsive padding: `p-3 sm:p-4 md:p-6 lg:p-8`
3. Use responsive grids with proper breakpoints
4. Test across all breakpoints before committing
5. Include this checklist in PR description

## Component Library Standards

### KPI Card
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow duration-200 h-full flex flex-col justify-between">
  {/* Content */}
</div>
```

### Section Container
```tsx
<div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
  {/* Content */}
</div>
```

### Responsive Grid Container
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Grid items */}
</div>
```
