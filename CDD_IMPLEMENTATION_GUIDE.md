# Component-Driven Development: Implementation Guide for WordRun

**Purpose**: Clarify CDD principles, pitfalls, and provide actionable checklists for consistent implementation across AI agents and human developers.

---

## The Core Promise

CDD allows visual design changes without breaking game logic—**but only if interfaces are correctly defined from the start.**

### What CDD Solves
- Changing colors, fonts, animations, spacing → no logic breaks
- Swapping component implementations → same interface, different look
- Removing features → game continues without that component
- A/B testing UI variants → swap components, not rewrite code

### What CDD Does NOT Solve
- Poorly defined interfaces (coupling is just hidden)
- Structural problems disguised as visual ones
- Rushing past interface design to "get something working"

---

## Two Types of Ugliness

**Visual Ugliness** (Safe to defer)
- Wrong colors, bad spacing, placeholder graphics
- Missing animations, rough transitions
- Unstyled text, default fonts
- *Fix anytime without architectural changes*

**Structural Ugliness** (Fix immediately)
- Hardcoded pixel values instead of relative/responsive
- Game logic inside rendering code
- Components directly manipulating each other's state
- Event handlers that know too much about other components
- *Becomes technical debt that forces rewrites*

---

## Component Independence Checklist

Before marking any component "complete," verify:

### Interface Design
- [ ] Component exposes ONLY what others need (no internal state leakage)
- [ ] Inputs are typed and documented (what data does it receive?)
- [ ] Outputs are events, not direct mutations (emits "onComplete", doesn't call `otherComponent.doThing()`)
- [ ] No references to sibling components (communicate through parent or event bus)

### Visual/Logic Separation
- [ ] All styling is in CSS/style objects, not hardcoded in logic
- [ ] Layout uses relative units or flex/grid, not absolute pixels
- [ ] Component works with placeholder/ugly styling (proves decoupling)
- [ ] Removing all CSS leaves logic functional (just unstyled)

### Isolation Test
- [ ] Component can render in isolation (storybook-style testing)
- [ ] Mocking its inputs produces predictable outputs
- [ ] Removing this component doesn't throw errors elsewhere
- [ ] Another developer could reimplement visuals without reading logic

---

## Handling Unavoidable Coupling

Some coupling is legitimate. The goal is **explicit, managed coupling** not zero coupling.

### Acceptable Coupling Patterns

**1. Parent-Child Data Flow**
```
Parent passes data DOWN → Child emits events UP
```
- Parent owns state, children are "dumb" renderers
- Child never modifies parent state directly

**2. Event Bus / Message System**
```
Component A emits "WORD_COMPLETED" → Any listener can respond
```
- Emitter doesn't know who's listening
- Listeners don't know who emitted
- Add/remove listeners without changing emitter

**3. Shared State Store (use sparingly)**
```
GameState store ← Components read from / dispatch to
```
- Single source of truth for game state
- Components subscribe to relevant slices
- Never mutate directly—always through defined actions

### Coupling Red Flags

| Red Flag | Why It's Bad | Fix |
|----------|--------------|-----|
| `componentA.componentB.value` | Chain coupling—A breaks if B's structure changes | Pass value as prop to A |
| `if (otherComponent.visible)` | A knows B's internal state | B emits visibility event, A listens |
| Importing component just for its constants | Hidden dependency | Move constants to shared config |
| Passing `this` to child components | Child can call anything on parent | Pass only needed callbacks |

---

## Interface Contract Template

For each component, define before implementing:

```typescript
interface ComponentContract {
  // What this component needs to function
  inputs: {
    data: TypeDefinition;      // Required data
    config?: OptionalConfig;   // Optional customization
  };

  // What this component tells the outside world
  outputs: {
    events: string[];          // e.g., ['onComplete', 'onError']
    eventPayloads: Record<string, TypeDefinition>;
  };

  // What this component will NEVER do
  boundaries: string[];        // e.g., "Will not access game state directly"
}
```

---

## Practical Workflow

### Phase 1: Interface Design (Do First)
1. List all components needed
2. Define each component's contract (inputs, outputs, boundaries)
3. Identify communication patterns between components
4. Review: Can any component be removed without breaking others?

### Phase 2: Ugly-But-Correct Implementation
1. Build components with placeholder visuals
2. Focus on correct interfaces and event flow
3. Test isolation: each component works alone
4. Test integration: components communicate correctly

### Phase 3: Visual Polish (Safe Zone)
1. Style components independently
2. Add animations, transitions, feedback
3. Iterate on design without fear
4. A/B test visual variants

---

## Quick Reference for AI Agents

When implementing or modifying WordRun components:

**DO:**
- Define interface contract before writing implementation
- Use event emission for outward communication
- Keep styling separate from logic
- Test component in isolation first
- Ask "what breaks if I delete this?" before integrating

**DON'T:**
- Access another component's internal state
- Hardcode pixel values in logic
- Mix rendering code with game rules
- Skip interface definition to "move faster"
- Create circular dependencies between components

**WHEN UNSURE:**
- If coupling feels necessary, use Event Bus pattern
- If visual change requires logic change, interface is wrong
- If removing component causes errors, boundaries are leaking

---

## Success Criteria

The architecture is correct when:
1. Any component's visuals can be completely redesigned by someone who hasn't read its logic
2. Removing any non-core component produces graceful degradation, not errors
3. Adding a new component requires only: defining its contract and connecting to event bus
4. Game logic tests pass with zero UI rendering

---

*Document created: 2026-01-16*
*For: WordRun CDD Implementation*
*Reference: COMPONENT_DRIVEN_ARCHITECTURE_GUIDE.md (philosophy), this document (implementation)*
