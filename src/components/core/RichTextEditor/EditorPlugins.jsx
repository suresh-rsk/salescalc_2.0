import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection, 
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND
} from 'lexical';
import {
  $isTableNode,
  $isTableCellNode,
  $isTableRowNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowNodeFromTableCellNodeOrThrow,
  $getTableColumnIndexFromTableCellNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  TableCellHeaderStates,
  $createTableRowNode,
  $createTableCellNode,
} from '@lexical/table';
import { $isListNode } from '@lexical/list';
import { INSERT_IMAGE_COMMAND, INSERT_HORIZONTAL_RULE_COMMAND } from './EditorCommands';
import { $createImageNode, $createHorizontalRuleNode } from './EditorNodes';
import { useTranslation } from '../../../usr/i18n';

// Image Plugin
export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { src, altText, width, height } = payload;
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const imageNode = $createImageNode({
              src,
              altText: altText || 'Image',
              width,
              height,
            });
            selection.insertNodes([imageNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

// HorizontalRule Plugin
export function HorizontalRulePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const hrNode = $createHorizontalRuleNode();
            selection.insertNodes([hrNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

// Enhanced List Plugin with backspace handling
export function EnhancedListPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Check if we're at the beginning of a list item
        if (anchorOffset === 0) {
          let listItemNode = null;
          let currentNode = anchorNode;

          // Find the list item node
          while (currentNode && currentNode.getType() !== 'listitem' && currentNode.getType() !== 'root') {
            currentNode = currentNode.getParent();
          }

          if (currentNode && currentNode.getType() === 'listitem') {
            listItemNode = currentNode;
            const listNode = listItemNode.getParent();

            if (listNode && $isListNode(listNode)) {
              // Check if this is the first item and it's empty or we're at the start
              const firstChild = listNode.getFirstChild();
              const isEmpty = listItemNode.getTextContent() === '';
              
              if (listItemNode === firstChild && isEmpty) {
                event.preventDefault();
                
                // Remove the entire list and create a paragraph
                const paragraph = $createParagraphNode();
                listNode.replace(paragraph);
                paragraph.select();
                return true;
              } else if (isEmpty) {
                event.preventDefault();
                
                // Remove this list item and exit the list
                const paragraph = $createParagraphNode();
                listItemNode.remove();
                listNode.insertAfter(paragraph);
                paragraph.select();
                return true;
              }
            }
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

// Table Context Menu Component
function TableActionMenu({ position, onClose, onAction }) {
  const { translate } = useTranslation();
  return (
    <div 
      className="table-action-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
    >
      <button onClick={() => onAction('insertRowAbove')}>{translate("TEXT_EDITOR.INSERT_ROW_ABOVE")}</button>
      <button onClick={() => onAction('insertRowBelow')}>{translate("TEXT_EDITOR.INSERT_ROW_BELOW")}</button>
      <div className="menu-divider"></div>
      <button onClick={() => onAction('insertColumnLeft')}>{translate("TEXT_EDITOR.INSERT_COLUMN_LEFT")}</button>
      <button onClick={() => onAction('insertColumnRight')}>{translate("TEXT_EDITOR.INSERT_COLUMN_RIGHT")}</button>
      <div className="menu-divider"></div>
      <button onClick={() => onAction('deleteRow')}>{translate("TEXT_EDITOR.DELETE_ROW")}</button>
      <button onClick={() => onAction('deleteColumn')}>{translate("TEXT_EDITOR.DELETE_COLUMN")}</button>
    </div>
  );
}

// Table Plugin with context menu
export function TableCellActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [tableCellNode, setTableCellNode] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  const handleAction = useCallback((action) => {
    if (!tableCellNode) return;

    editor.update(() => {
      try {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableRowNode = $getTableRowNodeFromTableCellNodeOrThrow(tableCellNode);
        
        switch (action) {
          case 'insertRowAbove':
            if (typeof $insertTableRow__EXPERIMENTAL === 'function') {
              $insertTableRow__EXPERIMENTAL(tableNode, tableRowNode, true);
            } else {
              // Fallback: manually insert row
              const newRow = $createTableRowNode();
              const columnCount = tableRowNode.getChildrenSize();
              for (let i = 0; i < columnCount; i++) {
                newRow.append($createTableCellNode(TableCellHeaderStates.NO_STATUS));
              }
              tableRowNode.insertBefore(newRow);
            }
            break;
            
          case 'insertRowBelow':
            if (typeof $insertTableRow__EXPERIMENTAL === 'function') {
              $insertTableRow__EXPERIMENTAL(tableNode, tableRowNode, false);
            } else {
              // Fallback: manually insert row
              const newRow = $createTableRowNode();
              const columnCount = tableRowNode.getChildrenSize();
              for (let i = 0; i < columnCount; i++) {
                newRow.append($createTableCellNode(TableCellHeaderStates.NO_STATUS));
              }
              tableRowNode.insertAfter(newRow);
            }
            break;
            
          case 'insertColumnLeft':
            if (typeof $insertTableColumn__EXPERIMENTAL === 'function') {
              $insertTableColumn__EXPERIMENTAL(tableNode, tableCellNode, true);
            } else {
              // Fallback: manually insert column
              const colIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
              const rows = tableNode.getChildren();
              rows.forEach((row) => {
                if ($isTableRowNode(row)) {
                  const cells = row.getChildren();
                  const newCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
                  if (cells[colIndex]) {
                    cells[colIndex].insertBefore(newCell);
                  } else {
                    row.append(newCell);
                  }
                }
              });
            }
            break;
            
          case 'insertColumnRight':
            if (typeof $insertTableColumn__EXPERIMENTAL === 'function') {
              $insertTableColumn__EXPERIMENTAL(tableNode, tableCellNode, false);
            } else {
              // Fallback: manually insert column
              const colIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
              const rows = tableNode.getChildren();
              rows.forEach((row) => {
                if ($isTableRowNode(row)) {
                  const cells = row.getChildren();
                  const newCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
                  if (cells[colIndex]) {
                    cells[colIndex].insertAfter(newCell);
                  } else {
                    row.append(newCell);
                  }
                }
              });
            }
            break;
            
          case 'deleteRow':
            if (typeof $deleteTableRow__EXPERIMENTAL === 'function') {
              $deleteTableRow__EXPERIMENTAL(tableNode, tableRowNode);
            } else {
              // Fallback: manually delete row if it's not the last one
              const rows = tableNode.getChildren();
              if (rows.length > 1) {
                tableRowNode.remove();
              }
            }
            break;
            
          case 'deleteColumn':
            if (typeof $deleteTableColumn__EXPERIMENTAL === 'function') {
              $deleteTableColumn__EXPERIMENTAL(tableNode, tableCellNode);
            } else {
              // Fallback: manually delete column
              const colIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
              const rows = tableNode.getChildren();
              let canDelete = true;
              
              // Check if this is the last column
              rows.forEach((row) => {
                if ($isTableRowNode(row) && row.getChildrenSize() <= 1) {
                  canDelete = false;
                }
              });
              
              if (canDelete) {
                rows.forEach((row) => {
                  if ($isTableRowNode(row)) {
                    const cells = row.getChildren();
                    if (cells[colIndex]) {
                      cells[colIndex].remove();
                    }
                  }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('Table operation failed:', error);
      }
    });
    setShowMenu(false);
  }, [editor, tableCellNode]);

  useEffect(() => {
    const handleContextMenu = (event) => {
      const target = event.target;
      const tableCell = target.closest('.editor-table-cell');
      
      if (tableCell) {
        event.preventDefault();
        
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            let cellNode = null;
            
            // Find the table cell node
            let currentNode = node;
            while (currentNode && !$isTableCellNode(currentNode)) {
              currentNode = currentNode.getParent();
            }
            
            if (currentNode && $isTableCellNode(currentNode)) {
              cellNode = currentNode;
              setTableCellNode(cellNode);
              setMenuPosition({ x: event.clientX, y: event.clientY });
              setShowMenu(true);
            }
          }
        });
      }
    };

    const handleClick = (event) => {
      // Close menu if clicking outside
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('click', handleClick);
    }

    return () => {
      if (rootElement) {
        rootElement.removeEventListener('contextmenu', handleContextMenu);
      }
      document.removeEventListener('click', handleClick);
    };
  }, [editor, showMenu]);

  return showMenu ? (
    <div ref={menuRef}>
      <TableActionMenu
        position={menuPosition}
        onClose={() => setShowMenu(false)}
        onAction={handleAction}
      />
    </div>
  ) : null;
}