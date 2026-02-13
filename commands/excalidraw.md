# Excalidraw Diagram

Generate an Excalidraw diagram and display it in Chrome.

## Instructions

When this command is invoked with `$ARGUMENTS`:

### Step 1: Design the diagram elements

Based on the user's description (`$ARGUMENTS`), generate an array of Excalidraw elements as JSON.

Follow the Excalidraw element format:
- **Shapes**: rectangle, ellipse, diamond — use `label: { "text": "...", "fontSize": 20 }` for text inside shapes
- **Arrows**: use `points: [[0,0],[dx,dy]]`, `endArrowhead: "arrow"`, and `startBinding`/`endBinding` with `fixedPoint` to connect shapes
- **Text**: standalone text for titles/annotations only
- **Bindings**: fixedPoint values — top=[0.5,0], bottom=[0.5,1], left=[0,0.5], right=[1,0.5]

**Color palette for shape backgrounds:**
- Light Blue `#a5d8ff` — inputs, sources, primary
- Light Green `#b2f2bb` — success, output, start
- Light Orange `#ffd8a8` — warning, pending, external
- Light Purple `#d0bfff` — processing, middleware
- Light Red `#ffc9c9` — error, critical, end
- Light Yellow `#fff3bf` — notes, decisions
- Light Teal `#c3fae8` — storage, data

**Required fields on every element:**
```json
{
  "type": "...",
  "id": "unique_id",
  "x": 0, "y": 0,
  "width": 200, "height": 80,
  "strokeColor": "#1e1e1e",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "angle": 0,
  "seed": 1,
  "version": 2,
  "versionNonce": 1,
  "isDeleted": false,
  "fillStyle": "solid",
  "backgroundColor": "transparent",
  "groupIds": [],
  "frameId": null,
  "boundElements": null
}
```

**For shapes with labels**, set `boundElements` to include `{"type":"text","id":"<text_id>"}`. The corresponding text element needs `"containerId": "<shape_id>"`.

**For shapes connected by arrows**, include `{"type":"arrow","id":"<arrow_id>"}` in `boundElements`.

**Arrow bindings** use `startBinding` and `endBinding`:
```json
{
  "startBinding": {"elementId": "shape1", "focus": 0, "gap": 1},
  "endBinding": {"elementId": "shape2", "focus": 0, "gap": 1}
}
```

**Sizing rules:**
- Minimum shape: 140x60 for labeled shapes
- Font size: minimum 16 for labels, 20+ for titles
- Leave 30px+ gaps between elements
- Keep diagrams within ~800x600 total area for good readability

### Step 2: Inject into Chrome

1. Get browser tab context using `mcp__claude-in-chrome__tabs_context_mcp`
2. Create a new tab with `mcp__claude-in-chrome__tabs_create_mcp`
3. Navigate to `https://excalidraw.com/` with `mcp__claude-in-chrome__navigate`
4. Wait 2 seconds for the page to load
5. Use `mcp__claude-in-chrome__javascript_tool` to inject the elements into localStorage:

```javascript
const elements = <YOUR_ELEMENTS_JSON>;
localStorage.setItem('excalidraw', JSON.stringify(elements));
```

6. Reload the page by navigating to `https://excalidraw.com/` again
7. Wait 2 seconds
8. Take a screenshot to confirm the diagram rendered

### Step 3: Report

Show the user the screenshot and briefly describe the diagram that was created. If something looks wrong (elements overlapping, missing labels, etc.), fix the JSON and re-inject.

## Tips

- Prefer fewer, larger elements over many small ones
- Use consistent colors within a diagram (e.g., all decision nodes yellow, all process nodes blue)
- For flowcharts: use ellipses for start/end, rectangles for processes, diamonds for decisions
- For architecture diagrams: use rectangles with rounded corners (`roundness: {"type": 3}`)
- Make sure every `seed` and `versionNonce` value is unique across elements
- Arrow `width` and `height` should match the last point in `points` array
- Use unique sequential IDs like `s1`, `s2`, `a1`, `a2`, `t1`, `t2`
