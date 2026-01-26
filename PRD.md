# Planning Guide

A RACI matrix builder that allows teams to define roles and tasks, assign RACI values (Responsible, Accountable, Consulted, Informed), and leverage AI to intelligently suggest appropriate RACI assignments based on role-task combinations.

**Experience Qualities**:
1. **Efficient** - Streamlined interface that makes building RACI matrices faster than traditional spreadsheets
2. **Intelligent** - AI-powered suggestions reduce manual work and provide informed recommendations
3. **Clear** - Visual organization makes accountability relationships immediately apparent

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused productivity tool with several interconnected features (role management, task management, matrix editing, AI suggestions) but operates within a single cohesive view without complex navigation.

## Essential Features

### Role Management
- **Functionality**: Add, edit, and remove roles (columns in the matrix)
- **Purpose**: Define the team members or positions involved in the project
- **Trigger**: User clicks "Add Role" button or edits existing role name
- **Progression**: Click add role → Enter role name in inline input → Press enter or click save → Role appears as new column
- **Success criteria**: Roles persist across sessions and appear as columns in the matrix

### Task Management
- **Functionality**: Add, edit, and remove tasks (rows in the matrix)
- **Purpose**: Define the activities or deliverables that require assignment
- **Trigger**: User clicks "Add Task" button or edits existing task name
- **Progression**: Click add task → Enter task description in inline input → Press enter or click save → Task appears as new row
- **Success criteria**: Tasks persist across sessions and appear as rows in the matrix

### RACI Value Assignment
- **Functionality**: Click cells in the matrix to cycle through R/A/C/I values or clear
- **Purpose**: Manually define accountability relationships
- **Trigger**: User clicks on any cell in the matrix
- **Progression**: Click cell → Cycles through R → A → C → I → Empty → Repeat
- **Success criteria**: Values persist, each cell can display one RACI value with distinct visual styling

### AI-Powered Suggestions
- **Functionality**: Generate RACI recommendations for specific role-task combinations
- **Purpose**: Accelerate matrix completion and provide informed suggestions based on best practices
- **Trigger**: User clicks AI suggestion button on empty or filled cells
- **Progression**: Click AI icon on cell → Loading indicator appears → AI analyzes role and task → Suggested RACI value appears with option to accept or reject
- **Success criteria**: AI provides contextually relevant suggestions within 2-3 seconds, suggestions are accurate >80% of the time

### Interactive Legend
- **Functionality**: Display persistent legend explaining RACI acronym meanings
- **Purpose**: Educate users and serve as quick reference
- **Trigger**: Always visible in interface
- **Progression**: Legend displays on load → User can reference anytime
- **Success criteria**: Clear, concise definitions for R/A/C/I that don't clutter the interface

## Edge Case Handling

- **Empty Matrix**: Display helpful onboarding state prompting users to add their first role and task
- **No Roles or Tasks**: Disable AI suggestions and show guidance to add roles/tasks first
- **AI Failures**: Gracefully handle API errors with retry option and fallback messaging
- **Duplicate Names**: Allow duplicate role/task names but warn users for clarity
- **Large Matrices**: Maintain usability with scrollable containers for 20+ roles or tasks
- **Rapid Clicks**: Debounce AI suggestion requests to prevent multiple simultaneous calls

## Design Direction

The design should evoke professionalism, clarity, and modern sophistication. It should feel like a premium productivity tool—smart, efficient, and visually organized. Think architectural blueprints meet modern SaaS: structured grids with intelligent color coding that makes complex information digestible at a glance.

## Color Selection

A professional palette with strong structure and intelligent color-coding for RACI values.

- **Primary Color**: Deep Navy `oklch(0.25 0.05 250)` - Conveys trust, professionalism, and authority appropriate for business tools
- **Secondary Colors**: 
  - Cool Gray `oklch(0.55 0.01 250)` for secondary actions and muted elements
  - Crisp White `oklch(0.99 0 0)` for cards and content areas
- **Accent Color**: Electric Blue `oklch(0.60 0.18 240)` for CTAs and the AI suggestion feature
- **RACI Value Colors**:
  - R (Responsible): Vibrant Purple `oklch(0.55 0.20 300)`
  - A (Accountable): Bold Orange `oklch(0.65 0.18 45)`
  - C (Consulted): Teal `oklch(0.60 0.15 200)`
  - I (Informed): Soft Amber `oklch(0.70 0.12 80)`
- **Foreground/Background Pairings**:
  - Primary (Deep Navy): White text `oklch(0.99 0 0)` - Ratio 11.2:1 ✓
  - Accent (Electric Blue): White text `oklch(0.99 0 0)` - Ratio 5.1:1 ✓
  - R (Vibrant Purple): White text `oklch(0.99 0 0)` - Ratio 6.8:1 ✓
  - A (Bold Orange): White text `oklch(0.99 0 0)` - Ratio 4.9:1 ✓
  - C (Teal): White text `oklch(0.99 0 0)` - Ratio 5.2:1 ✓
  - I (Soft Amber): Dark text `oklch(0.25 0.05 250)` - Ratio 7.1:1 ✓

## Font Selection

Typography should balance professionalism with modern clarity—structured yet approachable for a business productivity tool.

- **Primary Font**: Space Grotesk for headings and the app title - geometric precision that reinforces the grid structure
- **Secondary Font**: Inter for body text, labels, and UI elements - exceptional legibility for dense information

**Typographic Hierarchy**:
- H1 (App Title): Space Grotesk Bold/32px/tight letter-spacing (-0.02em)
- H2 (Section Headers): Space Grotesk SemiBold/20px/normal letter-spacing
- Matrix Labels (Roles/Tasks): Inter Medium/14px/normal line-height (1.4)
- RACI Cell Values: Inter Bold/16px/uppercase
- Legend Text: Inter Regular/13px/relaxed line-height (1.6)
- Button Labels: Inter SemiBold/14px/slight letter-spacing (0.01em)

## Animations

Animations should reinforce the structured, professional nature while providing satisfying micro-interactions that confirm user actions.

- **Cell Selection**: Subtle scale (1.05) and shadow elevation on hover, smooth 150ms transition
- **RACI Value Changes**: Quick color transition (200ms) with gentle bounce effect when cycling values
- **AI Suggestion**: Pulsing glow on AI button, loading shimmer effect during processing, subtle slide-in for suggestion popup
- **Row/Column Addition**: Smooth expansion animation (300ms ease-out) when adding new roles or tasks
- **Delete Actions**: Quick fade-out (200ms) with slight scale-down before removal

## Component Selection

- **Components**:
  - `Card` for the main matrix container and legend panel - provides visual separation
  - `Button` for all actions (Add Role, Add Task, AI suggestions) with variant styling
  - `Input` for inline editing of role and task names
  - `Badge` for RACI value display within cells with custom color variants
  - `Tooltip` for hover explanations on AI button and cell interactions
  - `Dialog` for confirming deletions and displaying AI suggestion details
  - `Table` structure for the matrix grid (customized heavily)
  - `ScrollArea` for handling overflow when matrix grows large
  - `Skeleton` for loading states during AI processing
  
- **Customizations**:
  - Custom matrix grid component built with CSS Grid for precise cell control
  - Custom RACI cell component that handles click cycling and color states
  - Custom role/task header cells with inline editing capability
  - Branded AI suggestion button with sparkle icon and glow effect
  
- **States**:
  - Buttons: Default has subtle border, hover shows slight elevation and color shift, active shows pressed state, disabled is grayed with reduced opacity
  - Input fields: Focused state has electric blue ring, filled state shows check icon, error state (if needed) shows red accent
  - Matrix cells: Empty has dashed border, filled shows solid color badge, hover shows preview of next value, selected shows enhanced border
  - AI button: Default has gradient background, hover shows glow effect, loading shows spinner, success shows checkmark briefly
  
- **Icon Selection**:
  - Plus (adding roles/tasks)
  - Sparkles (AI suggestions)
  - X or Trash (deleting rows/columns)
  - Check (confirming actions)
  - Question mark (tooltips and help)
  - ArrowClockwise (retry AI suggestions)
  
- **Spacing**:
  - Container padding: p-8 on desktop, p-4 on mobile
  - Card internal spacing: p-6
  - Matrix cell padding: p-3
  - Gap between elements: gap-4 for major sections, gap-2 for related elements
  - Button spacing: px-4 py-2 for standard buttons, px-3 py-1.5 for compact
  
- **Mobile**:
  - Matrix becomes horizontally scrollable with sticky first column (tasks)
  - Add role/task buttons stack vertically instead of side-by-side
  - Legend moves to collapsible drawer at bottom instead of side panel
  - Cell size increases slightly for better touch targets (min 44px)
  - AI suggestion opens as bottom sheet instead of popover
