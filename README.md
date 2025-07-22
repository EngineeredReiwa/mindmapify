# Mindmapify

**Mindmapify** is a whiteboard app that instantly converts your brainstorming ideas into [Mermaid](https://mermaid.js.org/) mindmap code.

Drag, drop, and click — your thoughts, structured and ready to share.

> "Think freely. Export clearly." ✨

🌐 **[Live Demo](https://mindmapify-git-main-keisuke-kakudas-projects.vercel.app)** - Try it now!

## ✨ Features

### 🎯 Core Functionality
- **One-click node creation**: Click anywhere to add ideas
- **Visual connections**: Drag between nodes to create relationships
- **Instant Mermaid export**: Copy generated code with one click
- **Smart connection routing**: Automatic optimal connection points
- **Real-time editing**: Direct text editing with live preview

### ⌨️ Keyboard Shortcuts
- `Cmd+Shift+A`: Add new node
- `Cmd+Shift+D`: Delete selected items
- `Cmd+A`: Select all
- `Cmd+Z/Y`: Undo/Redo
- `Cmd +/-`: Zoom in/out
- `Delete/Backspace`: Delete selection
- `Escape`: Cancel/Clear selection

### 🔗 Connection Features
- **8 relationship types**: Cause, Effect, Method, Example, Element, Similar, Contrast, Supplement
- **Connection endpoint editing**: Drag connection endpoints to different nodes
- **Connection labels**: Double-click connections to add descriptive labels
- **Visual feedback**: Connection handles with hover states

### 🎨 User Experience
- **Responsive design**: Works on desktop and tablet
- **Auto-save**: Automatic saving of edits
- **History management**: Full undo/redo system
- **Smart positioning**: Collision-free node placement
- **Smooth interactions**: Optimized performance for large mind maps

## 🚀 Getting Started

### Online (Recommended)
Visit the **[Live Demo](https://mindmapify-git-main-keisuke-kakudas-projects.vercel.app)** - no installation required!

### Local Development

#### Prerequisites
- Node.js 18+ 
- npm or yarn

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/EngineeredReiwa/mindmapify.git
cd mindmapify

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

#### Available Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint

# Testing
npm run test:quick   # Quick functionality test (2min)
npm run test:full    # Complete test suite (5min)
npm run test:debug   # Visual debugging with screenshots
```

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Canvas**: Konva.js (react-konva)
- **State Management**: Zustand + Immer
- **Styling**: Tailwind CSS + Apple HIG Design System
- **Build Tool**: Vite
- **Deployment**: Vercel
- **Testing**: Puppeteer E2E test suite

## 📋 Usage

1. **Create nodes**: Click anywhere on the canvas or use `Cmd+Shift+A`
2. **Edit text**: Click on any node to start editing directly
3. **Connect ideas**: Drag from one node's connection point to another
4. **Add relationships**: Double-click connections to add labels (1-8 for quick selection)
5. **Export to Mermaid**: Click the "Copy Mermaid" button to get formatted code
6. **Use shortcuts**: Press `?` for keyboard shortcut help

## 🔧 Advanced Features

### Connection System
- **Fixed connection points**: Connections stay attached during node movement
- **Smart routing**: Automatic selection of optimal connection sides
- **Endpoint editing**: Click connection handles to reconnect to different nodes
- **Loop support**: Mermaid flowchart syntax supports circular references

### Testing & Quality Assurance
Mindmapify includes a comprehensive test suite:
- **Integration tests**: 6 categories covering all major functionality
- **Visual regression**: Screenshot comparison for UI consistency
- **Performance tests**: Load testing with multiple nodes and connections
- **Cross-browser compatibility**: Tested in Chrome, Firefox, Safari

Run tests: `npm run test:debug` for visual feedback

## 📁 Project Structure

```
mindmapify/
├── src/
│   ├── components/       # React components
│   │   ├── Canvas/       # Main canvas and interaction logic
│   │   ├── Node/         # Node rendering and editing
│   │   ├── Connection/   # Connection lines and labels
│   │   └── UI/          # Toolbar and controls
│   ├── stores/          # Zustand state management
│   ├── utils/           # Helper functions and utilities
│   ├── types/           # TypeScript type definitions
│   └── hooks/           # Custom React hooks
├── docs/                # Documentation
│   ├── MVP_DEFINITION.md
│   ├── USER_EXPERIENCE_DESIGN.md
│   ├── WIREFRAMES.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── DESIGN_RULE.md
│   ├── TEST_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
└── test-suite.js        # Integrated E2E test suite
```

## 🎯 Development Status

### ✅ Completed (Phase 1-5B)
- Core functionality (node creation, editing, movement)
- Connection system with smart routing
- Mermaid code generation and export
- Keyboard shortcuts and accessibility
- History management (undo/redo)
- Advanced connection editing
- Production deployment

### 🔄 Current Focus (Phase 6)
- Connection system refinements
- Performance optimizations
- UX polish and edge case handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test: `npm run test:full`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

Please ensure:
- All tests pass (`npm run test:full`)
- TypeScript compilation succeeds (`npm run typecheck`)
- Code follows the style guide (`npm run lint`)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) for the excellent diagramming syntax
- [Konva.js](https://konvajs.org/) for powerful 2D canvas capabilities
- [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/) for the development foundation
- [Vercel](https://vercel.com/) for seamless deployment

---

**Mindmapify** - Transform your ideas into structured diagrams instantly. Start creating at **[mindmapify.vercel.app](https://mindmapify-git-main-keisuke-kakudas-projects.vercel.app)**!