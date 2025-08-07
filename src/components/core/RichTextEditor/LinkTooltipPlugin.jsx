import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { SELECTION_CHANGE_COMMAND } from 'lexical';
import { useTranslation } from '../../../usr/i18n';

function LinkTooltip({ link, onEdit, onRemove, position }) {

  const { translate } = useTranslation();

  return (
    <div 
      className="link-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px',
      }}
    >
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="link-tooltip-url"
        onClick={(e) => e.stopPropagation()}
      >
        {link}
      </a>
      <div className="link-tooltip-buttons">
        <button 
          onClick={onEdit}
          className="link-tooltip-button"
          title={translate("TEXT_EDITOR.EDIT_LINK")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button 
          onClick={onRemove}
          className="link-tooltip-button"
          title={translate("TEXT_EDITOR.REMOVE_LINK")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

function EditLinkDialog({ currentUrl, onSave, onCancel }) {
  const [url, setUrl] = useState(currentUrl);
  const inputRef = useRef(null);
  const { translate } = useTranslation();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSave(url.trim());
    }
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{translate("TEXT_EDITOR.EDIT_LINK")}</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="url"
            placeholder="Enter URL (https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="dialog-buttons">
            <button type="submit" disabled={!url.trim()}>
              {translate("COMMON.SAVE")}
            </button>
            <button type="button" onClick={onCancel}>
              {translate("COMMON.CANCEL")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LinkTooltipPlugin() {
  const [editor] = useLexicalComposerContext();
  const [linkNode, setLinkNode] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const hideTooltip = useCallback(() => {
    setShowTooltip(false);
    setLinkNode(null);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
    setShowTooltip(false);
  }, []);

  const handleRemove = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    hideTooltip();
  }, [editor, hideTooltip]);

  const handleSaveEdit = useCallback((newUrl) => {
    if (linkNode) {
      editor.update(() => {
        linkNode.setURL(newUrl);
      });
    }
    setShowEditDialog(false);
    hideTooltip();
  }, [editor, linkNode, hideTooltip]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const target = e.target;
      
      // Check if target is an element node
      if (!target || !target.nodeType || target.nodeType !== 1) {
        return;
      }
      
      const linkElement = target.closest('.editor-link');
      
      if (linkElement) {
        // Clear hide timeout if hovering over link
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // Clear any existing timeout
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }

        // Set new timeout to show tooltip
        tooltipTimeoutRef.current = setTimeout(() => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = selection.anchor.getNode();
              const parent = node.getParent();
              
              if ($isLinkNode(parent)) {
                setLinkNode(parent);
                setLinkUrl(parent.getURL());
                
                // Calculate position
                const rect = linkElement.getBoundingClientRect();
                setTooltipPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
                
                setShowTooltip(true);
              } else if ($isLinkNode(node)) {
                setLinkNode(node);
                setLinkUrl(node.getURL());
                
                // Calculate position
                const rect = linkElement.getBoundingClientRect();
                setTooltipPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
                
                setShowTooltip(true);
              }
            }
          });
        }, 200); // Reduced from 500ms to 200ms for faster response
      } else if (!target.closest('.link-tooltip')) {
        // If not hovering over link or tooltip, start hide timeout
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        
        if (showTooltip && !hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            hideTooltip();
          }, 300); // Hide after 300ms of not hovering
        }
      }
    };

    const handleMouseEnterTooltip = () => {
      // Clear hide timeout if entering tooltip
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handleMouseLeaveTooltip = () => {
      // Start hide timeout when leaving tooltip
      if (!hideTimeoutRef.current) {
        hideTimeoutRef.current = setTimeout(() => {
          hideTooltip();
        }, 300);
      }
    };

    const rootElement = editor.getRootElement();
    
    if (rootElement) {
      rootElement.addEventListener('mousemove', handleMouseMove);
    }

    // Add event listeners to tooltip when it appears
    if (showTooltip) {
      const tooltipElement = document.querySelector('.link-tooltip');
      if (tooltipElement) {
        tooltipElement.addEventListener('mouseenter', handleMouseEnterTooltip);
        tooltipElement.addEventListener('mouseleave', handleMouseLeaveTooltip);
      }
    }

    return () => {
      if (rootElement) {
        rootElement.removeEventListener('mousemove', handleMouseMove);
      }
      
      const tooltipElement = document.querySelector('.link-tooltip');
      if (tooltipElement) {
        tooltipElement.removeEventListener('mouseenter', handleMouseEnterTooltip);
        tooltipElement.removeEventListener('mouseleave', handleMouseLeaveTooltip);
      }
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [editor, showTooltip, hideTooltip]);

  // Hide tooltip on selection change
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        hideTooltip();
        return false;
      },
      1
    );
  }, [editor, hideTooltip]);

  return (
    <>
      {showTooltip && linkUrl && (
        <LinkTooltip
          link={linkUrl}
          onEdit={handleEdit}
          onRemove={handleRemove}
          position={tooltipPosition}
        />
      )}
      {showEditDialog && (
        <EditLinkDialog
          currentUrl={linkUrl}
          onSave={handleSaveEdit}
          onCancel={() => setShowEditDialog(false)}
        />
      )}
    </>
  );
}