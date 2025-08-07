import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $createTextNode,
} from "lexical";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import {
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  INSERT_IMAGE_COMMAND,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "./EditorCommands";
import { useTranslation } from "../../../usr/i18n";

export default function ControlPanel() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberList, setIsNumberList] = useState(false);
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textAlign, setTextAlign] = useState("left");
  const [isLink, setIsLink] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [activeImageTab, setActiveImageTab] = useState("url");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const fileInputRef = useRef(null);


  const { translate } = useTranslation();

  // Set initial undo/redo state on mount
  useEffect(() => {
    editor.getEditorState().read(() => {
      // Get initial undo/redo state
      editor.dispatchCommand(CAN_UNDO_COMMAND, false);
      editor.dispatchCommand(CAN_REDO_COMMAND, false);
    });
  }, [editor]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update formatting state
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      // Check if selection contains a link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Get current font size, family, and colors from selection
      const currentFontSize = $getSelectionStyleValueForProperty(
        selection,
        "font-size",
        "16px"
      );
      const currentFontFamily = $getSelectionStyleValueForProperty(
        selection,
        "font-family",
        ""
      );
      const currentTextColor = $getSelectionStyleValueForProperty(
        selection,
        "color",
        "#000000"
      );
      const currentBackgroundColor = $getSelectionStyleValueForProperty(
        selection,
        "background-color",
        "#ffffff"
      );

      setFontSize(currentFontSize);
      setFontFamily(currentFontFamily);
      setTextColor(currentTextColor);
      setBackgroundColor(currentBackgroundColor);

      // Check text alignment
      const anchorNode = selection.anchor.getNode();
      let element = $isElementNode(anchorNode)
        ? anchorNode
        : anchorNode.getParentOrThrow();

      // Get the alignment from the element's style or default
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        const computedStyle = window.getComputedStyle(elementDOM);
        const currentAlign = computedStyle.textAlign || "left";
        setTextAlign(currentAlign);
      } else {
        setTextAlign("left");
      }

      // Check if we're in a list
      let currentNode = anchorNode;
      let inBulletList = false;
      let inNumberList = false;

      while (currentNode && currentNode.getType() !== "root") {
        if (currentNode.getType() === "listitem") {
          const listParent = currentNode.getParent();
          if (listParent && $isListNode(listParent)) {
            const listType = listParent.getListType();
            if (listType === "bullet") {
              inBulletList = true;
            } else if (listType === "number") {
              inNumberList = true;
            }
            break;
          }
        }
        currentNode = currentNode.getParent();
      }

      setIsBulletList(inBulletList);
      setIsNumberList(inNumberList);
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        newEditor.getEditorState().read(() => {
          updateToolbar();
        });
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  // Register undo/redo state listeners
  useEffect(() => {
    const unregisterCanUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      1
    );

    const unregisterCanRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      1
    );

    // Check initial state
    editor.getEditorState().read(() => {
      const historyState = editor._history;
      if (historyState) {
        setCanUndo(historyState._undoStack.length > 0);
        setCanRedo(historyState._redoStack.length > 0);
      }
    });

    return () => {
      unregisterCanUndo();
      unregisterCanRedo();
    };
  }, [editor]);

  const formatBulletList = () => {
    if (isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (isNumberList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const onFontSizeChange = (e) => {
    const newFontSize = e.target.value;
    setFontSize(newFontSize);
    if (newFontSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Only apply to selected text, not the whole editor
          $patchStyleText(selection, {
            "font-size": newFontSize,
          });
        }
      });
    }
  };

  const onFontFamilyChange = (e) => {
    const newFontFamily = e.target.value;
    setFontFamily(newFontFamily);
    if (newFontFamily) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Only apply to selected text, not the whole editor
          $patchStyleText(selection, {
            "font-family": newFontFamily,
          });
        }
      });
    }
  };

  const onTextColorChange = (e) => {
    const newTextColor = e.target.value;
    setTextColor(newTextColor);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Only apply to selected text, not the whole editor
        $patchStyleText(selection, {
          color: newTextColor,
        });
      }
    });
  };

  const onBackgroundColorChange = (e) => {
    const newBackgroundColor = e.target.value;
    setBackgroundColor(newBackgroundColor);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Only apply to selected text, not the whole editor
        $patchStyleText(selection, {
          "background-color": newBackgroundColor,
        });
      }
    });
  };

  const formatAlignment = (alignment) => {
    setTextAlign(alignment);
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const insertLink = () => {
    if (!linkUrl) return;

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (selection.isCollapsed()) {
          // No text selected, insert link with URL as text
          const linkNode = $createLinkNode(linkUrl);
          linkNode.append($createTextNode(linkUrl));
          selection.insertNodes([linkNode]);
        } else {
          // Text selected, make it a link
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
        }
      }
    });

    setShowLinkDialog(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  const insertImage = () => {
    if (activeImageTab === "url" && imageUrl) {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: "Inserted image",
        src: imageUrl,
      });
      setImageUrl("");
    } else if (activeImageTab === "upload" && selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          altText: `Uploaded image: ${selectedFile.name}`,
          src: imageDataUrl,
        });
      };
      reader.readAsDataURL(selectedFile);
      setSelectedFile(null);
    }

    setShowImageDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: tableRows,
      columns: tableCols,
      includeHeaders: false,
    });
    setShowTableDialog(false);
    setTableRows(3);
    setTableCols(3);
  };

  const handlePrint = () => {
    const editorContent = editor.getRootElement();
    if (!editorContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = styleSheet.href;
          return link.outerHTML;
        }
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <style>
            ${styles}
            
            @media print {
              body {
                margin: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .editor-image img {
                max-width: 100%;
                page-break-inside: avoid;
              }
              .editor-table {
                page-break-inside: avoid;
              }
              .editor-horizontal-rule {
                page-break-after: avoid;
              }
            }
            
            .print-content {
              line-height: 1.5;
              color: #000;
            }
            .editor-text-bold { font-weight: bold; }
            .editor-text-italic { font-style: italic; }
            .editor-text-underline { text-decoration: underline; }
            .editor-text-strikethrough { text-decoration: line-through; }
            .editor-link { color: #0066cc; text-decoration: underline; }
            .editor-list-ul { list-style-type: disc; margin-left: 20px; }
            .editor-list-ol { list-style-type: decimal; margin-left: 20px; }
            .editor-table { border-collapse: collapse; margin: 10px 0; }
            .editor-table-cell { border: 1px solid #ddd; padding: 8px; }
            .editor-horizontal-rule { border: none; border-top: 2px solid #e0e0e0; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${editorContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="toolbar" style={{ display: "flex !important" }}>

      {/* Print */}
      <button
        onClick={handlePrint}
        className="toolbar-item"
        aria-label="Print Document"
        title={translate("TEXT_EDITOR.PRINT_DOCUMENT")}
      >
        <i className="pi pi-print" />
      </button>
      <div className="toolbar-divider"></div>


      {/* undo & redo */}
      <button
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className={canUndo ? "toolbar-item active" : "toolbar-item"}
        disabled={!canUndo}
        aria-label="Undo"
        title={`${translate("TEXT_EDITOR.UNDO")} (Ctrl+Z)`}
      >
        <i className="pi pi-undo" />
      </button>
      <button
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className={canRedo ? "toolbar-item active" : "toolbar-item"}
        disabled={!canRedo}
        aria-label="Redo"
        title={`${translate("TEXT_EDITOR.REDO")} (Ctrl+Y)`}
      >
        <i className="pi pi-refresh" />
      </button>
      <div className="toolbar-divider"></div>


      {/* Basic text formatting */}
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={isBold ? "toolbar-item active" : "toolbar-item"}
        aria-label="Format Bold"
        title={translate("TEXT_EDITOR.BOLD")}
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={isItalic ? "toolbar-item active" : "toolbar-item"}
        aria-label="Format Italic"
        title={translate("TEXT_EDITOR.ITALIC")}
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={isUnderline ? "toolbar-item active" : "toolbar-item"}
        aria-label="Format Underline"
        title={translate("TEXT_EDITOR.UNDERLINE")}
      >
        <u>U</u>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={isStrikethrough ? "toolbar-item active" : "toolbar-item"}
        aria-label="Format Strikethrough"
        title={translate("TEXT_EDITOR.STRIKETHROUGH")}
      >
        <span style={{ textDecoration: "line-through" }}>S</span>
      </button>


      <div className="toolbar-divider"></div>

      <select
        className="toolbar-select"
        value={fontSize}
        onChange={onFontSizeChange}
        aria-label="Font Size"
        title={translate("TEXT_EDITOR.FONT_SIZE")}
      >
        <option value="10px">10px</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="28px">28px</option>
        <option value="32px">32px</option>
        <option value="36px">36px</option>
        <option value="42px">42px</option>
        <option value="48px">48px</option>
      </select>

      <select
        className="toolbar-select"
        value={fontFamily}
        onChange={onFontFamilyChange}
        aria-label="Font Family"
        title={translate("TEXT_EDITOR.FONT_FAMILY")}
      >
        <option value="">Default Font</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="Verdana, sans-serif">Verdana</option>
        <option value="Helvetica, sans-serif">Helvetica</option>
        <option value="Impact, sans-serif">Impact</option>
        <option value="Tahoma, sans-serif">Tahoma</option>
      </select>

      <div className="toolbar-divider"></div>

            {/* Advanced text formatting */}

      <button
        onClick={formatBulletList}
        className={
          isBulletList ? "toolbar-item-custom active" : "toolbar-item-custom"
        }
        aria-label="Bullet List"
        title={translate("TEXT_EDITOR.BULLET_LIST")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="6" r="2" fill="currentColor" />
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="5" cy="18" r="2" fill="currentColor" />
          <rect x="10" y="5" width="10" height="2" fill="currentColor" />
          <rect x="10" y="11" width="10" height="2" fill="currentColor" />
          <rect x="10" y="17" width="10" height="2" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={formatNumberedList}
        className={
          isNumberList ? "toolbar-item-custom active" : "toolbar-item-custom"
        }
        aria-label="Numbered List"
        title={translate("TEXT_EDITOR.NUMBER_LIST")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <text x="3" y="8" fontSize="8" fill="currentColor">
            1.
          </text>
          <text x="3" y="14" fontSize="8" fill="currentColor">
            2.
          </text>
          <text x="3" y="20" fontSize="8" fill="currentColor">
            3.
          </text>
          <rect x="10" y="5" width="10" height="2" fill="currentColor" />
          <rect x="10" y="11" width="10" height="2" fill="currentColor" />
          <rect x="10" y="17" width="10" height="2" fill="currentColor" />
        </svg>
      </button>

      <div
        className="color-picker-wrapper toolbar-item-custom"
        style={{ position: "relative" }}
      >
        <label
          htmlFor="text-color"
          className="color-label"
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill={textColor}
              d="M5 18h2l2-5h6l2 5h2l-6-14h-2zM9.6 11l2.4-6 2.4 6z"
            />
            <rect x="4" y="20" width="16" height="2" fill={textColor} />
          </svg>
        </label>
        <input
          id="text-color"
          type="color"
          className="color-picker"
          value={textColor}
          onChange={onTextColorChange}
          aria-label="Text Color"
          title={translate("TEXT_EDITOR.TEXT_COLOR")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>

      <div className="color-picker-wrapper toolbar-item-custom">
        <label
          htmlFor="bg-color"
          className="color-label bg-label"
          style={{ cursor: "pointer", alignItems: "center" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <rect
              x="0"
              y="0"
              width="24"
              height="24"
              rx="2"
              ry="2"
              fill={backgroundColor}
            />
            <text
              x="12"
              y="22"
              textAnchor="middle"
              fontSize="20"
              fontFamily="Arial"
              fill="black"
              fontWeight="bold"
            >
              A
            </text>
          </svg>
        </label>
        <input
          id="bg-color"
          type="color"
          className="color-picker"
          value={backgroundColor}
          onChange={onBackgroundColorChange}
          aria-label="Background Color"
          title={translate("TEXT_EDITOR.BACKGROUND_COLOR")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>

      <div className="toolbar-divider"></div>

      <button
        onClick={() => formatAlignment("left")}
        className={
          textAlign === "left" ? "toolbar-item active" : "toolbar-item"
        }
        aria-label="Align Left"
        title={translate("TEXT_EDITOR.ALIGN_LEFT")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="5" width="14" height="1" fill="currentColor" />
          <rect x="3" y="9" width="10" height="1" fill="currentColor" />
          <rect x="3" y="13" width="14" height="1" fill="currentColor" />
          <rect x="3" y="17" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => formatAlignment("center")}
        className={
          textAlign === "center" ? "toolbar-item active" : "toolbar-item"
        }
        aria-label="Align Center"
        title={translate("TEXT_EDITOR.ALIGN_CENTER")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="5" y="5" width="14" height="1" fill="currentColor" />
          <rect x="7" y="9" width="10" height="1" fill="currentColor" />
          <rect x="5" y="13" width="14" height="1" fill="currentColor" />
          <rect x="7" y="17" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => formatAlignment("right")}
        className={
          textAlign === "right" ? "toolbar-item active" : "toolbar-item"
        }
        aria-label="Align Right"
        title={translate("TEXT_EDITOR.ALIGN_RIGHT")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="7" y="5" width="14" height="1" fill="currentColor" />
          <rect x="11" y="9" width="10" height="1" fill="currentColor" />
          <rect x="7" y="13" width="14" height="1" fill="currentColor" />
          <rect x="11" y="17" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => formatAlignment("justify")}
        className={
          textAlign === "justify" ? "toolbar-item active" : "toolbar-item"
        }
        aria-label="Justify"
        title={translate("TEXT_EDITOR.JUSTIFY")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="5" width="18" height="1" fill="currentColor" />
          <rect x="3" y="9" width="18" height="1" fill="currentColor" />
          <rect x="3" y="13" width="18" height="1" fill="currentColor" />
          <rect x="3" y="17" width="18" height="1" fill="currentColor" />
        </svg>
      </button>

            <button
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
        className="toolbar-item"
        aria-label="Decrease Indent"
        title={translate("TEXT_EDITOR.INCREASE_INDENT")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="10" y="5" width="10" height="1" fill="currentColor" />
          <rect x="10" y="9" width="10" height="1" fill="currentColor" />
          <rect x="10" y="13" width="10" height="1" fill="currentColor" />
          <rect x="10" y="17" width="10" height="1" fill="currentColor" />
          <path
            d="M7 12L3 12M3 12L5 10M3 12L5 14"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <button
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
        className="toolbar-item"
        aria-label="Increase Indent"
        title={translate("TEXT_EDITOR.DECREASE_INDENT")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="10" y="5" width="10" height="1" fill="currentColor" />
          <rect x="10" y="9" width="10" height="1" fill="currentColor" />
          <rect x="10" y="13" width="10" height="1" fill="currentColor" />
          <rect x="10" y="17" width="10" height="1" fill="currentColor" />
          <path
            d="M3 12L7 12M7 12L5 10M7 12L5 14"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      <div className="toolbar-divider"></div>


      {/* insert elements */}

      <button
        onClick={() => setShowLinkDialog(true)}
        className={isLink ? "toolbar-item active" : "toolbar-item"}
        aria-label="Insert Link"
        title={translate("TEXT_EDITOR.INSERT_LINK")}
      >
        <i className="pi pi-link" />
      </button>

      {isLink && (
        <button
          onClick={removeLink}
          className="toolbar-item"
          aria-label="Remove Link"
          title={translate("TEXT_EDITOR.REMOVE_LINK")}
        >
          <i className="pi pi-link" style={{ position: "absolute" }} />
          <i
            className="pi pi-times"
            style={{ color: "#a9a9a9", fontSize: "24px" }}
          />
        </button>
      )}

      <button
        onClick={() => {
          setShowImageDialog(true);
          setActiveImageTab("url");
          setImageUrl("");
          setSelectedFile(null);
        }}
        className="toolbar-item"
        aria-label="Insert Image"
        title={translate("TEXT_EDITOR.INSERT_IMAGE")}
      >
        <i className="pi pi-image" />
      </button>

      <div className="toolbar-divider"></div>

      <button
        onClick={() => setShowTableDialog(true)}
        className="toolbar-item"
        aria-label="Insert Table"
        title={translate("TEXT_EDITOR.INSERT_TABLE")}
      >
        <i className="pi pi-table" />
      </button>

      <button
        onClick={() =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }
        className="toolbar-item"
        aria-label="Insert Horizontal Rule"
        title={translate("TEXT_EDITOR.INSERT_HR_RULE")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="11" width="18" height="2" fill="currentColor" />
        </svg>
      </button>



      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* Dialogs */}
      {showLinkDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>{translate("TEXT_EDITOR.INSERT_LINK")}</h3>
            <input
              type="url"
              placeholder={`${translate("TEXT_EDITOR.ENTER_URL")} (https://example.com)`}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={insertLink} disabled={!linkUrl}>
                {translate("TEXT_EDITOR.INSERT_LINK")}
              </button>
              <button onClick={() => setShowLinkDialog(false)}>{translate("COMMON.CANCEL")}</button>
            </div>
          </div>
        </div>
      )}

      {showImageDialog && (
        <div className="dialog-overlay">
          <div className="dialog image-dialog">
            <h3>{translate("TEXT_EDITOR.INSERT_IMAGE")}</h3>

            <div className="rte-tabs">
              <button
                className={`rte-tab ${
                  activeImageTab === "url" ? "active" : ""
                }`}
                onClick={() => setActiveImageTab("url")}
              >
                {translate("TEXT_EDITOR.IMAGE_URL")}
              </button>
              <button
                className={`rte-tab ${
                  activeImageTab === "upload" ? "active" : ""
                }`}
                onClick={() => setActiveImageTab("upload")}
              >
                {translate("TEXT_EDITOR.UPLOAD_FROM_COMPUTER")}
              </button>
            </div>

            <div className="rte-tab-content">
              {activeImageTab === "url" && (
                <div className="rte-tab-panel">
                  <input
                    type="url"
                    placeholder={`${translate("TEXT_EDITOR.ENTER_IMAGE_URL")} (https://example.com/image.jpg)`}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {activeImageTab === "upload" && (
                <div className="rte-tab-panel">
                  <div
                    className="file-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="file-selected">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <p>{selectedFile.name}</p>
                        <small>{translate("TEXT_EDITOR.CLICK_FOR_DIFFERENT_FILE")}</small>
                      </div>
                    ) : (
                      <div className="file-upload-placeholder">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p>{translate("TEXT_EDITOR.CLICK_TO_SELECT_IMAGE")}</p>
                        <small>{translate("TEXT_EDITOR.OR_DRAG_AND_DROP")}</small>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="dialog-buttons">
              <button
                onClick={insertImage}
                disabled={
                  (activeImageTab === "url" && !imageUrl) ||
                  (activeImageTab === "upload" && !selectedFile)
                }
              >
                {translate("TEXT_EDITOR.INSERT_IMAGE")}
              </button>
              <button
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl("");
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                {translate("COMMON.CANCEL")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTableDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>{translate("TEXT_EDITOR.INSERT_TABLE")}</h3>
            <div className="table-size-inputs">
              <label>
                {translate("TEXT_EDITOR.ROWS")}:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </label>
              <label>
                {translate("TEXT_EDITOR.COLUMNS")}:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </label>
            </div>
            <div className="dialog-buttons">
              <button onClick={insertTable}>{translate("TEXT_EDITOR.INSERT_TABLE")}</button>
              <button onClick={() => setShowTableDialog(false)}>{translate("COMMON.CANCEL")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}