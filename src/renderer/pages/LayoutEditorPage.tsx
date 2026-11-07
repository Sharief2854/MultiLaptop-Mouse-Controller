import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComputerNode, TransitionLink, CalculationResult, AppConfig } from '../../shared/types';
import { api } from '../services/api';

interface LayoutEditorPageProps {
  config: AppConfig;
  onUpdateConfig: (updated: AppConfig) => void;
  onSave: () => void;
}

export const LayoutEditorPage: React.FC<LayoutEditorPageProps> = ({
  config,
  onUpdateConfig,
  onSave
}) => {
  const [computers, setComputers] = useState<ComputerNode[]>(config.computers);
  const [activeLinks, setActiveLinks] = useState<TransitionLink[]>([]);
  const [deskflowConfText, setDeskflowConfText] = useState<string>('');
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showConfigPreview, setShowConfigPreview] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Recalculate topological links whenever screen positions change
  const recalculate = useCallback(async (currentComputers: ComputerNode[]) => {
    try {
      const result: CalculationResult = await api.calculateLinks(currentComputers);
      setActiveLinks(result.links);
      setDeskflowConfText(result.deskflowLinksSection);
    } catch (e) {
      console.error('Failed to calculate links:', e);
    }
  }, []);

  useEffect(() => {
    setComputers(config.computers);
    recalculate(config.computers);
  }, [config.computers, recalculate]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, screen: ComputerNode) => {
    e.stopPropagation();
    setSelectedScreenId(screen.id);
    setIsDragging(true);

    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - canvasRect.left - screen.x,
        y: e.clientY - canvasRect.top - screen.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedScreenId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Canvas boundary constraints
    const currentScreen = computers.find((c) => c.id === selectedScreenId);
    if (!currentScreen) return;

    const canvasW = canvasRef.current.clientWidth;
    const canvasH = canvasRef.current.clientHeight;

    newX = Math.max(10, Math.min(canvasW - currentScreen.width - 10, newX));
    newY = Math.max(10, Math.min(canvasH - currentScreen.height - 10, newY));

    // Optional 10px snap
    if (snapToGrid) {
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;
    }

    const updated = computers.map((c) =>
      c.id === selectedScreenId ? { ...c, x: newX, y: newY } : c
    );

    setComputers(updated);
    setIsSaved(false);
    recalculate(updated);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdateConfig({
        ...config,
        computers
      });
    }
  };

  // Preset: Vertical Arrangement (Host Laptop physically positioned above Client Laptop)
  const applyVerticalPreset = () => {
    if (computers.length === 0) return;
    const centerX = 260;
    let startY = 40;

    const updated = computers.map((c, idx) => {
      const itemY = startY;
      startY += c.height + 40; // 40px gap between stacked laptops
      return {
        ...c,
        x: centerX,
        y: itemY
      };
    });

    setComputers(updated);
    setIsSaved(false);
    onUpdateConfig({ ...config, computers: updated });
    recalculate(updated);
  };

  // Preset: Horizontal Arrangement (Side-by-side)
  const applyHorizontalPreset = () => {
    if (computers.length === 0) return;
    let startX = 60;
    const centerY = 160;

    const updated = computers.map((c) => {
      const itemX = startX;
      startX += c.width + 40; // 40px gap
      return {
        ...c,
        x: itemX,
        y: centerY
      };
    });

    setComputers(updated);
    setIsSaved(false);
    onUpdateConfig({ ...config, computers: updated });
    recalculate(updated);
  };

  // Preset: Grid Arrangement (2x2)
  const applyGridPreset = () => {
    const updated = computers.map((c, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      return {
        ...c,
        x: 80 + col * (c.width + 40),
        y: 40 + row * (c.height + 40)
      };
    });

    setComputers(updated);
    setIsSaved(false);
    onUpdateConfig({ ...config, computers: updated });
    recalculate(updated);
  };

  const handleSaveLayout = () => {
    onUpdateConfig({
      ...config,
      computers,
      autoCalculateLinks: true
    });
    onSave();
    setIsSaved(true);
  };

  // Determine if a specific edge of a screen has an active connection
  const hasLinkOnEdge = (screenName: string, direction: 'up' | 'down' | 'left' | 'right') => {
    return activeLinks.some((l) => l.fromScreen === screenName && l.direction === direction);
  };

  return (
    <div className="d-flex flex-column h-100 gap-3">
      {/* Top Toolbar */}
      <div className="card shadow-sm border-0">
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* Presets */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-bold">ARRANGEMENT PRESETS:</span>
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              onClick={applyVerticalPreset}
              title="Stack screens vertically: Host Laptop above Client Laptop"
            >
              <i className="bi bi-distribute-vertical"></i>
              <span>Vertical (Stacked)</span>
            </button>

            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              onClick={applyHorizontalPreset}
              title="Place screens side by side"
            >
              <i className="bi bi-distribute-horizontal"></i>
              <span>Horizontal (Side-by-Side)</span>
            </button>

            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={applyGridPreset}
              title="Arrange in 2x2 grid"
            >
              <i className="bi bi-grid-fill"></i>
              <span>Grid (2x2)</span>
            </button>
          </div>

          {/* Options & Save */}
          <div className="d-flex align-items-center gap-2">
            <div className="form-check form-switch mb-0 me-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="snapGridSwitch"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="snapGridSwitch">
                Snap to Grid
              </label>
            </div>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowConfigPreview(!showConfigPreview)}
            >
              <i className="bi bi-code-slash me-1"></i>
              <span>{showConfigPreview ? 'Hide Syntax' : 'Deskflow Config'}</span>
            </button>

            <button
              className={`btn btn-sm d-flex align-items-center gap-1 ${
                isSaved ? 'btn-success' : 'btn-warning text-dark fw-bold'
              }`}
              onClick={handleSaveLayout}
            >
              <i className="bi bi-check2-circle"></i>
              <span>{isSaved ? 'Layout Saved' : 'Save Layout Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Inspector Area */}
      <div className="row g-3 flex-1 overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Visual Screen Drag Canvas */}
        <div className={showConfigPreview ? 'col-lg-8' : 'col-12'}>
          <div
            className="canvas-wrapper h-100 position-relative"
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Canvas Hint */}
            <div
              className="position-absolute top-0 start-0 m-2 px-2 py-1 bg-white bg-opacity-75 border rounded small text-muted pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <i className="bi bi-arrows-move me-1"></i>
              Drag laptop screens into their real physical positions. Green boundaries indicate active mouse transitions.
            </div>

            {/* Draggable Laptop Screens */}
            {computers.map((screen) => {
              const isSelected = screen.id === selectedScreenId;
              const hasUp = hasLinkOnEdge(screen.name, 'up');
              const hasDown = hasLinkOnEdge(screen.name, 'down');
              const hasLeft = hasLinkOnEdge(screen.name, 'left');
              const hasRight = hasLinkOnEdge(screen.name, 'right');

              return (
                <div
                  key={screen.id}
                  className={`screen-node ${screen.isServer ? 'is-server' : ''} ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  style={{
                    left: `${screen.x}px`,
                    top: `${screen.y}px`,
                    width: `${screen.width}px`,
                    height: `${screen.height}px`,
                    borderColor: isSelected ? '#f59e0b' : screen.color || '#3b82f6'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, screen)}
                >
                  {/* Boundary Edge Glows */}
                  <div className={`screen-edge-indicator screen-edge-top ${hasUp ? 'edge-connected' : ''}`} />
                  <div className={`screen-edge-indicator screen-edge-bottom ${hasDown ? 'edge-connected' : ''}`} />
                  <div className={`screen-edge-indicator screen-edge-left ${hasLeft ? 'edge-connected' : ''}`} />
                  <div className={`screen-edge-indicator screen-edge-right ${hasRight ? 'edge-connected' : ''}`} />

                  {/* Screen Header Bar */}
                  <div
                    className="screen-header"
                    style={{ backgroundColor: screen.isServer ? '#1e3a8a' : '#1e293b' }}
                  >
                    <div className="d-flex align-items-center gap-1 text-truncate">
                      <i className={`bi ${screen.isServer ? 'bi-shield-shaded text-warning' : 'bi-laptop'}`}></i>
                      <span className="text-truncate">{screen.name}</span>
                    </div>
                    {screen.isServer ? (
                      <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>HOST</span>
                    ) : (
                      <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>GUEST</span>
                    )}
                  </div>

                  {/* Laptop Display Bezel Graphic */}
                  <div className="screen-body">
                    <div className="screen-bezel">
                      <div className="fw-bold mb-1 text-truncate" style={{ fontSize: '0.9rem', maxWidth: '180px' }}>
                        {screen.name}
                      </div>
                      <div className="text-secondary small font-monospace">{screen.ip}</div>
                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                        Pos: ({screen.x}, {screen.y})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Visual Directional Transition Arrows Overlay */}
            {activeLinks.map((link, idx) => {
              const fromComp = computers.find((c) => c.name === link.fromScreen);
              const toComp = computers.find((c) => c.name === link.toScreen);
              if (!fromComp || !toComp) return null;

              // Compute arrow position between the two screens
              let arrowX = 0;
              let arrowY = 0;
              let arrowIcon = 'bi-arrow-down';

              if (link.direction === 'down') {
                arrowIcon = 'bi-arrow-down';
                arrowX = Math.min(fromComp.x + fromComp.width / 2, toComp.x + toComp.width / 2) - 14;
                arrowY = (fromComp.y + fromComp.height + toComp.y) / 2 - 14;
              } else if (link.direction === 'up') {
                arrowIcon = 'bi-arrow-up';
                arrowX = Math.min(fromComp.x + fromComp.width / 2, toComp.x + toComp.width / 2) + 14;
                arrowY = (fromComp.y + toComp.y + toComp.height) / 2 - 14;
              } else if (link.direction === 'right') {
                arrowIcon = 'bi-arrow-right';
                arrowX = (fromComp.x + fromComp.width + toComp.x) / 2 - 14;
                arrowY = Math.min(fromComp.y + fromComp.height / 2, toComp.y + toComp.height / 2) - 14;
              } else if (link.direction === 'left') {
                arrowIcon = 'bi-arrow-left';
                arrowX = (fromComp.x + toComp.x + toComp.width) / 2 - 14;
                arrowY = Math.min(fromComp.y + fromComp.height / 2, toComp.y + toComp.height / 2) + 14;
              }

              return (
                <div
                  key={`arrow-${idx}`}
                  className="transition-arrow-badge"
                  style={{
                    left: `${arrowX}px`,
                    top: `${arrowY}px`,
                    backgroundColor: link.direction === 'down' || link.direction === 'right' ? '#2563eb' : '#10b981'
                  }}
                  title={`Transition: ${link.fromScreen} (${link.direction.toUpperCase()}) ➔ ${link.toScreen}`}
                >
                  <i className={`bi ${arrowIcon}`}></i>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Deskflow Configuration / Links Inspector Drawer */}
        {showConfigPreview && (
          <div className="col-lg-4 d-flex flex-column h-100">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-dark text-white py-2 px-3 d-flex align-items-center justify-content-between">
                <span className="small fw-semibold">
                  <i className="bi bi-file-earmark-code me-1 text-info"></i>
                  Live Deskflow Syntax
                </span>
                <span className="badge bg-secondary">{activeLinks.length} Links</span>
              </div>
              <div className="card-body p-3 overflow-auto font-monospace small bg-light">
                <h6 className="fw-bold text-primary mb-2">Detected Spatial Links:</h6>
                {activeLinks.length === 0 ? (
                  <p className="text-muted small">
                    No edge transitions detected. Move laptop screens closer so their edges overlap vertically or horizontally!
                  </p>
                ) : (
                  <ul className="list-group list-group-flush mb-3">
                    {activeLinks.map((l, i) => (
                      <li key={i} className="list-group-item px-2 py-1 bg-transparent small d-flex justify-content-between">
                        <span>
                          <strong>{l.fromScreen}</strong> [{l.direction.toUpperCase()}]
                        </span>
                        <span className="text-primary">➔</span>
                        <span>
                          <strong>{l.toScreen}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <h6 className="fw-bold text-dark mb-1">Generated server.conf:</h6>
                <pre
                  className="p-2 bg-dark text-light rounded small"
                  style={{ maxHeight: '240px', overflowY: 'auto', fontSize: '0.75rem' }}
                >
                  {deskflowConfText}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="card shadow-sm border-0">
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between small text-secondary">
          <div className="d-flex align-items-center gap-3">
            <span>
              <i className="bi bi-display text-primary me-1"></i>
              Laptops: <strong>{computers.length}</strong>
            </span>
            <span>
              <i className="bi bi-bezier2 text-success me-1"></i>
              Active Transitions: <strong>{activeLinks.length}</strong>
            </span>
          </div>
          <div>
            <span>Selected Screen: <strong>{selectedScreenId ? computers.find(c => c.id === selectedScreenId)?.name : 'None'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
