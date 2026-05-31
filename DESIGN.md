# SkillsSphere-AI Design System & Theme Guide

This document is the definitive, exhaustive guide to the design philosophy, aesthetic themes, and reusable UI components of the SkillsSphere-AI platform. It is engineered to help contributors, frontend developers, and designers quickly build new modules that perfectly match the existing platform's look, feel, and interaction patterns.

---

## 1. Global Design Philosophy

The overarching aesthetic of SkillsSphere-AI combines **Modern Glassmorphism** with **Subtle Cyberpunk** and **High-Tech Dashboard** undertones. It intentionally moves away from flat, generic corporate designs, prioritizing deep, immersive dark backgrounds with vibrant, glowing neon accents to create a premium, state-of-the-art feel.

### Core Principles
1. **Depth over Flatness**: We use layered backgrounds, gradient borders, and varied opacities to establish a Z-axis hierarchy. The user should feel like they are interacting with a holographic interface, not a flat web page.
2. **Neon Accents**: Critical calls to action and AI-driven insights are highlighted with vibrant indigos, emeralds, and purples to draw the eye.
3. **Motion is Meaning**: Micro-interactions are not just for show. Hover states, soft pulses, and slide-up animations provide critical feedback about system status and interactive affordances.
4. **Data Density without Clutter**: Especially in the Tutor and Recruiter modules, we must display massive amounts of data. We achieve this through rigorous use of negative space, subtle borders, and color-coded badging.

---

## 2. Core Configuration (`tailwind.config.cjs`)

The platform relies heavily on **Tailwind CSS v3** with a `dark:class` strategy. The theme extends Tailwind's default palette with our custom branding tokens. All developers *must* use these Tailwind classes rather than hardcoding hex values.

### A. Typography System
We use a modern, dual-font system loaded via Google Fonts.

- **Headings & Titles (`font-heading`)**: `Outfit`
  - *Weights*: 500 (Medium), 600 (SemiBold), 700 (Bold)
  - *Usage*: Page titles, Dashboard card headers, Hero text, and numeric metrics. It provides a geometric, slightly futuristic aesthetic.
  
- **Body & Data (`font-sans`)**: `Inter`
  - *Weights*: 400 (Regular), 500 (Medium)
  - *Usage*: Paragraphs, table data, input fields, and tooltips. Chosen for its unparalleled legibility at small sizes.

### B. The Color Palette & Tokens

Do not use default Tailwind colors (e.g., `bg-blue-500`) unless explicitly required. Use our semantic variables.

#### Backgrounds & Surfaces
| Class Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `bg-dark-bg` | `#0B0F19` | The overarching, deep blue/black background color of the application. |
| `bg-surface` | `#131B2C` | The elevated surface color used for cards, sidebars, and modals. |
| `bg-surface-hover` | `#1E293B` | Used when hovering over table rows or interactive cards. |
| `bg-surface-soft` | `rgba(19, 27, 44, 0.5)` | Used for glassmorphic backdrops (requires `backdrop-blur-md`). |

#### Typography Colors
| Class Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `text-main` | `#F3F4F6` | Primary high-contrast text color (almost white). |
| `text-muted`| `#9CA3AF` | Secondary, lower-contrast text for hints, timestamps, and descriptions. |
| `text-disabled`| `#6B7280` | Used for disabled states to indicate non-interactivity. |

#### Brand Accents
| Class Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `text-brand-500` | `#6366f1` | The primary brand indigo color. Used for active tabs and icons. |
| `bg-primary` | `#4F46E5` | The core action color (primary buttons, active states). |
| `bg-primary-hover`| `#4338CA` | The hover state for primary actions. |

#### Semantic Feedback (The AI Palette)
| Class Name | Theme | Usage |
| :--- | :--- | :--- |
| `text-emerald-400` | Success | High AI scores, "Excellent Match", successful completion. |
| `text-amber-400` | Warning | "Growth Potential", pending actions, raised hands in Classrooms. |
| `text-rose-400` | Danger | "Weak Alignment", destructive actions (Delete, Leave Room). |
| `text-cyan-400` | Info | Informational tooltips, secondary AI insights. |

### C. Shadows and Borders
- `border-border` (`#1F2937`): Used universally for subtle separation lines between layout panes and card outlines.
- `shadow-soft`: A custom drop shadow (`0 4px 20px -2px rgba(0, 0, 0, 0.2)`) used to elevate active cards off the deep background.
- `shadow-glow-primary`: A custom shadow (`0 0 15px rgba(99, 102, 241, 0.3)`) used on primary buttons to create a neon bleed effect.

---

## 3. Page-by-Page Theme Breakdown

Different modules have slightly different "vibes" while maintaining the global aesthetic.

### A. Landing Page ("Immersive Tech")
- **Background**: Uses `animate-cockpit-glow` and massive floating gradient orbs (`orbFloat` animation in `index.css`) positioned absolute with `-z-10` behind the DOM to create a sense of vast depth.
- **Hero Text**: Large headings utilize `.text-gradient` (`bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary`) to immediately draw the eye.
- **Visuals**: Features animated grid lines (`animate-scan-line`) overlaying the hero section to emphasize the "AI/Tech" nature of the platform.

### B. Auth Pages ("Elevated Focus")
- **Layout**: Centered flexbox layouts spanning `min-h-screen`.
- **Card Styling**: Glassmorphic panels built using `bg-surface/90 backdrop-blur-lg border border-border shadow-soft`.
- **Focus States**: Inputs feature smooth, high-contrast focus rings (`focus:ring-2 focus:ring-brand-500 focus:outline-none focus:border-transparent`) to guide the user's attention.

### C. Student Dashboard & Roadmaps ("Data Visibility")
- **Layout**: CSS Grid-based layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
- **Cards**: Standardized `bg-surface rounded-2xl border border-border p-6`.
- **Interactive Elements**: Hover states elevate the cards (`hover:-translate-y-1 hover:shadow-glow-primary transition-all duration-300`).
- **Score Highlights**: Excellent AI scores (≥85) utilize animated gradient borders (`.animated-gradient-box`) to visually reward the student.

### D. Live Classrooms ("Focused Workspace")
- **Layout**: Flexbox heavy. A main workspace area taking `flex-1` and a fixed-width sidebar for chat/participants.
- **Video Tiles**: Videos are wrapped in `rounded-xl overflow-hidden border border-slate-700/50`. When speaking, they receive a glowing green ring (`ring-2 ring-emerald-500`).
- **Controls Bar**: A floating, highly blurred pill at the bottom `bg-slate-800/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg`.

### E. Tutor & Recruiter Analytics ("Information Density")
- **Visualizations**: Extensive use of `Recharts` (Treemaps, AreaCharts, BarCharts). Tooltips are heavily customized with `bg-surface border border-border text-main` to match the dark theme natively.
- **Data Tables**: Clean tables with sticky headers. Rows use `hover:bg-surface-hover` to help tutors track data horizontally across many columns without losing their place.
- **Badges**: Heavy use of color-coded semantic badges to instantly convey AI insights to recruiters scanning hundreds of applicants.

---

## 4. Core CSS Animations (`index.css`)

The platform utilizes several custom CSS keyframes to bring the UI to life. Never use JavaScript for animations if one of these CSS classes will suffice.

- `animate-fade-in`: Simple opacity 0 to 1 over 200ms.
- `animate-slide-up`: Smooth entry animation (translateY 10px to 0px + fade-in) used for loading cards and modals.
- `animate-pulse-soft`: A very gentle pulsing opacity (0.7 to 1.0), used for "Live" indicators or pending AI generation states.
- `.gradient-border`: Uses `-webkit-mask-composite: xor` to create a beautiful, 1px gradient border around cards without using complex nested divs.
- `.animated-gradient-box`: A continuously shifting background gradient utilized behind critical focal points (like the Mock Interview Lobby screen).

---

## 5. Accessibility (a11y) Guidelines

Design is not just about aesthetics; it is about usability.
1. **Contrast**: Ensure text passes WCAG AA contrast standards. Do not put `text-muted` on a `bg-surface-hover` background if it becomes unreadable.
2. **Focus Management**: Never remove focus outlines (`outline-none`) without replacing them with a custom focus ring (e.g., `focus:ring-2 focus:ring-brand-500`).
3. **Screen Readers**: If using an icon without text (e.g., a Trash icon button), always include `aria-label="Delete"` or `<span className="sr-only">Delete</span>`.

---

## 6. Blueprint: Copy-Paste Code Designs

When building new features, **do not write raw HTML buttons or inputs**. You must use or adapt the shared component patterns below to ensure platform consistency.

### Blueprint 1: Standard Dashboard Panel (Card)
Use this structure when building a new widget, metric display, or section within a dashboard. Notice the rounded corners and the specific border colors.

```jsx
import React from 'react';

const DashboardPanel = ({ title, subtitle, children, action }) => {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col h-full">
      {/* Header section with Outfit font */}
      <div className="px-6 py-5 border-b border-border bg-surface/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-main">
            {title}
          </h3>
          {subtitle && (
             <p className="text-sm text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      
      {/* Content section */}
      <div className="p-6 text-sm text-text-main flex-1">
        {children}
      </div>
    </div>
  );
};

export default DashboardPanel;
```

### Blueprint 2: Actions & Buttons
We have standardized button variants. Do not invent new background colors for buttons unless it is a specific semantic state (like Delete/Red).

```jsx
import React, { useState } from 'react';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import Button from '@/shared/components/Button';

const ActionRow = () => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {/* Primary Brand Button - Used for the single most important action on a page */}
      <Button 
        variant="primary" 
        size="md" 
        onClick={() => console.log('Proceed')}
        rightIcon={<ArrowRight size={18} />}
        className="shadow-glow-primary hover:-translate-y-0.5 transition-transform"
      >
        Continue
      </Button>

      {/* Outline Button - Used for secondary actions */}
      <Button 
        variant="outline" 
        loading={isSaving}
        onClick={() => setIsSaving(true)}
        leftIcon={<Save size={18} />}
      >
        Save Draft
      </Button>

      {/* Ghost button - Used for cancel/back actions */}
      <Button variant="ghost">Cancel</Button>

      {/* Destructive Action */}
      <Button 
        variant="danger" 
        leftIcon={<Trash2 size={18} />}
        className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30"
      >
        Delete
      </Button>
    </div>
  );
};
```

### Blueprint 3: Form Inputs & Validation
Forms must look clean and handle errors gracefully. The `Input` component handles accessible labeling, red error borders, and icon injection automatically.

```jsx
import React, { useState } from 'react';
import { Search, Mail, Lock } from 'lucide-react';
import Input from '@/shared/components/Input';

const FormExample = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="space-y-5 max-w-sm w-full">
      {/* Standard Search Input */}
      <Input
        id="search-query"
        placeholder="Search candidates..."
        leftIcon={<Search size={18} className="text-text-muted" />}
        className="bg-surface border-border focus:ring-brand-500 rounded-xl"
      />

      {/* Input with Label and Error State */}
      <Input
        id="email-address"
        label="Email Address"
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (!e.target.value.includes('@')) setError('Please enter a valid email.');
          else setError('');
        }}
        error={error}
        leftIcon={<Mail size={18} className={error ? "text-rose-400" : "text-text-muted"} />}
      />
    </div>
  );
};
```

### Blueprint 4: Color-Coded Semantic Status Badges
Badges are critical for data density. They allow users to parse complex AI categorizations instantly based on color alone.

```jsx
const StatusBadge = ({ status, label }) => {
  // Map internal status strings to Tailwind semantic classes
  const styles = {
    excellent: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    moderate:  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    weak:      "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    pending:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    neutral:   "bg-slate-500/10 text-slate-300 border border-slate-500/20",
  };

  const activeStyle = styles[status] || styles.neutral;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${activeStyle}`}>
      {label || status.toUpperCase()}
    </span>
  );
};

// Usage:
// <StatusBadge status="excellent" label="95% Match" />
```

### Blueprint 5: Skeleton Loaders (Loading States)
Do not use spinning circles for entire page loads. Use Skeleton loaders to maintain layout stability and reduce perceived wait times.

```jsx
const CardSkeleton = () => {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full bg-slate-700/50"></div>
        <div className="space-y-2 flex-1">
           {/* Title skeleton */}
          <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
           {/* Subtitle skeleton */}
          <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
        </div>
      </div>
      {/* Body lines skeleton */}
      <div className="space-y-3">
        <div className="h-3 bg-slate-700/50 rounded w-full"></div>
        <div className="h-3 bg-slate-700/50 rounded w-5/6"></div>
        <div className="h-3 bg-slate-700/50 rounded w-4/6"></div>
      </div>
    </div>
  );
};
```

### Blueprint 6: Data Tables
For the Tutor and Recruiter dashboards. Note the sticky header and hover states.

```jsx
const TutorsTable = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm text-text-main">
        <thead className="bg-surface-soft text-text-muted font-heading">
          <tr>
            <th className="px-6 py-4 font-medium">Student Name</th>
            <th className="px-6 py-4 font-medium">AI Score</th>
            <th className="px-6 py-4 font-medium">Last Active</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-surface-hover transition-colors">
              <td className="px-6 py-4 font-medium text-white">{row.name}</td>
              <td className="px-6 py-4">
                <StatusBadge 
                  status={row.score > 80 ? 'excellent' : 'moderate'} 
                  label={`${row.score}/100`} 
                />
              </td>
              <td className="px-6 py-4 text-text-muted">{row.date}</td>
              <td className="px-6 py-4 text-right">
                 <button className="text-brand-500 hover:text-brand-400 font-medium">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 7. Anti-Patterns (What NOT to do)

1. **Avoid Pure Black or Pure White**: Never use `#000000` for backgrounds or `#FFFFFF` for text. It creates too much eye strain. Use our `bg-dark-bg` and `text-main`.
2. **Avoid Inline Styles**: Do not use `style={{ padding: '10px' }}`. Always use Tailwind utility classes (e.g., `p-2.5`).
3. **Don't Nest Borders Indiscriminately**: If you put a card inside a card, avoid double-bordering them with the same color. Remove the border from the inner card or use a subtle background shift (`bg-surface-soft`) instead.
4. **Avoid Abrupt Transitions**: Any element that changes state on hover (buttons, cards, links) MUST have a `transition-all duration-200` or similar class applied. Snappy, immediate changes feel cheap and broken.
5. **Never Use Unstyled System Scrollbars**: The global `index.css` overrides the webkit scrollbar to be thin and dark. Do not override this behavior.
