# Design Guidelines: Dominion TV Mobile App

## Architecture Decisions

### Authentication
**No authentication required** - This is a public broadcasting app where all content is freely accessible without user accounts.

### Navigation
**Custom Bottom Tab Navigation** with 3 tabs:
- **Home** (Default) - Program Schedule
- **News** - News Headlines
- **Settings** - App Preferences & About

**Important**: Do NOT use React Navigation's default tab bar. Implement a custom bottom tab bar component.

### Screen Specifications

#### Home Screen (Program Schedule)
- **Header**: Fixed header displaying "DOMINION TV" in primary color (#08D9D6)
- **Layout**: 
  - Scrollable vertical list of program cards
  - Each card contains:
    - Left: Square thumbnail (gray background with TV emoji placeholder)
    - Middle: Program title (bold), host name (grey text), time slot (primary color)
    - Right: Circular "Play" button
- **LIVE Detection Logic**:
  - Compare current device time against the hardcoded schedule
  - If a show is currently airing:
    - Add red "LIVE" badge to the card
    - Apply gold border to the card
- **Interactions**:
  - Clicking Play on a LIVE show → Opens station's YouTube channel URL
  - Clicking Play on a non-live show → Opens YouTube search for that program's title

#### News Screen
- **Header**: "NEWS" title
- **Layout**: Vertical scrollable list of news cards
- **Card Components**:
  - News title
  - "Time ago" timestamp
  - Image placeholder
- **Interaction**: Cards are tappable but currently have no action (placeholder for future)

#### Settings Screen
- **Header**: "SETTINGS" title
- **Content**:
  - Push Notifications toggle switch (visual only, no functionality)
  - "About" section displaying app version number
- **Layout**: Simple vertical list layout

## Design System

### Color Palette
- **Primary Color**: Bright Turquoise `#08D9D6`
  - Used for: Active tabs, buttons, headers, time slots
- **Secondary Color**: Red
  - Used for: "LIVE" status borders and badges
- **Accent Color**: Gold
  - Used for: Border of LIVE program cards
- **Background**: White (clean, minimalist)
- **Text Colors**:
  - Primary text: Black/Dark grey (program titles)
  - Secondary text: Grey (host names)

### Typography
- **Font Family**: System default (San Francisco on iOS, Roboto on Android)
- **Hierarchy**:
  - Program titles: Bold weight
  - Host names: Regular weight, grey color
  - Time slots: Regular weight, primary color
  - Headers: Medium/Bold weight

### Component Specifications

#### Program Card
- **Container**: White background with rounded corners, subtle shadow
- **Live State**: 
  - Red "LIVE" badge in top-right corner
  - Gold border (2-3px width)
- **Thumbnail**: Square aspect ratio, grey background (#F0F0F0) with centered TV emoji
- **Play Button**: 
  - Circular shape
  - Primary color background
  - White play icon centered
  - Press state with subtle opacity change

#### Bottom Tab Bar
- **Background**: White
- **Active Tab**: Primary color (#08D9D6)
- **Inactive Tab**: Grey
- **Height**: Standard tab bar height (~60px)
- **Icons**: Simple, recognizable icons for Home, News, Settings

#### News Card
- **Layout**: Horizontal card with image on left, text on right
- **Image Placeholder**: Rectangular, grey background
- **Spacing**: Consistent padding between cards
- **Press State**: Subtle grey overlay on tap

### Hardcoded Schedule Data
The app uses this exact daily schedule for LIVE detection:
- 07:00 - 08:50: DAYBREAK LIVE
- 09:00 - 09:50: AGENDA
- 10:00 - 10:50: The Big Conversation
- 11:00 - 11:55: Dominion Sport
- 12:00 - 13:50: NEWS at 12 noon
- 13:00 - 13:50: E-Plus
- 14:00 - 14:50: LOJUDE DOMINION
- 15:30 - 16:30: IYO AYE
- 18:00 - 19:00: The POLISCOPE

### Visual Design Principles
- **Clean & Minimalist**: White backgrounds, ample spacing
- **Clear Hierarchy**: Bold program titles stand out, supporting info is subdued
- **Status Clarity**: LIVE shows are immediately recognizable with red badge and gold border
- **Touch Targets**: All interactive elements (cards, buttons, tabs) have appropriate touch target sizes (minimum 44x44 points)

### Interaction Design
- **Feedback**: All touchable components show visual feedback (opacity change, highlight)
- **Loading States**: Consider showing loading indicators when opening external YouTube links
- **Error Handling**: Gracefully handle cases when YouTube links cannot be opened

### Accessibility
- **Color Contrast**: Ensure all text meets WCAG AA standards
- **Touch Targets**: Minimum 44x44 points for all interactive elements
- **Screen Reader**: Label all interactive elements appropriately
- **LIVE Indicators**: Use both color (red/gold) and text ("LIVE" badge) for status to accommodate color-blind users