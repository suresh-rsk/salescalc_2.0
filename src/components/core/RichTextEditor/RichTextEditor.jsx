import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { $getRoot, $createParagraphNode, $createTextNode, CLEAR_EDITOR_COMMAND, $isTextNode, $isElementNode, TextNode } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  TableNode,
  TableCellNode,
  TableRowNode,
} from '@lexical/table';

// Import custom components
import ControlPanel from './ControlPanel';
import { ImageNode, HorizontalRuleNode } from './EditorNodes';
import { 
  ImagePlugin, 
  HorizontalRulePlugin, 
  EnhancedListPlugin, 
  TableCellActionMenuPlugin 
} from './EditorPlugins';
import LinkTooltipPlugin from './LinkTooltipPlugin';
import { CustomTextNode, replaceTextNodeTransform } from './CustomTextNode';

// Import styles
import './RichTextEditor.css';
import { useTranslation } from '../../../usr/i18n';

// Helper function to get all text nodes
function getAllTextNodes(node) {
  const textNodes = [];
  
  function traverse(currentNode) {
    if ($isTextNode(currentNode)) {
      textNodes.push(currentNode);
    }
    
    const children = currentNode.getChildren ? currentNode.getChildren() : [];
    children.forEach(child => traverse(child));
  }
  
  traverse(node);
  return textNodes;
}
  // Helper function to extract content from HTML string
  const extractContentFromHTML = (htmlString) => {
    // Simple string-based approach to extract content from between <body> tags
    if (typeof htmlString === 'string' && htmlString.trim().toLowerCase().startsWith('<html')) {
      const bodyStartTag = '<body>';
      const bodyEndTag = '</body>';
      
      const bodyStartIndex = htmlString.toLowerCase().indexOf(bodyStartTag);
      const bodyEndIndex = htmlString.toLowerCase().indexOf(bodyEndTag);
      
      if (bodyStartIndex !== -1 && bodyEndIndex !== -1) {
        // Extract content between body tags (add length of start tag to get correct starting position)
        return htmlString.substring(bodyStartIndex + bodyStartTag.length, bodyEndIndex);
      }
    }
    // Otherwise return the original content
    return htmlString;
  };

// Custom HTML export function that preserves inline styles
function $customGenerateHtmlFromNodes(editor, selection) {
  const output = [];
  const exportMap = new Map();
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    for (const child of children) {
      const html = $exportNodeToHTML(child, editor, exportMap);
      if (html !== null) {
        output.push(html);
      }
    }
  });
  
  return output.join('');
}

function $exportNodeToHTML(node, editor, exportMap) {
  const type = node.getType();
  const exportFunc = exportMap.get(type) || node.exportDOM;
  
  if (exportFunc) {
    const dom = exportFunc.call(node, editor);
    if (dom) {
      const element = dom.element || dom;
      
      // Handle text nodes specially to preserve styles
      if (node.getType() === 'text' || node.getType() === 'custom-text') {
        const textNode = node;
        const textContent = textNode.getTextContent();
        
        // If empty text node, skip
        if (!textContent) {
          return '';
        }
        
        // Get the style from the node
        const style = textNode.getStyle();
        const format = textNode.getFormat();
        
        // If no style and no format, return plain text
        if (!style && format === 0) {
          return textContent;
        }
        
        let span = document.createElement('span');
        span.textContent = textContent;
        
        // Build style string
        const styles = [];
        
        // Add existing styles
        if (style) {
          styles.push(style);
        }
        
        // Add format styles
        if (format & 1) { // Bold
          styles.push('font-weight: bold');
          span.classList.add('editor-text-bold');
        }
        if (format & 2) { // Italic
          styles.push('font-style: italic');
          span.classList.add('editor-text-italic');
        }
        if (format & 8) { // Underline
          const hasTextDecoration = style && style.includes('text-decoration');
          if (!hasTextDecoration) {
            styles.push('text-decoration: underline');
          }
          span.classList.add('editor-text-underline');
        }
        if (format & 4) { // Strikethrough
          const hasTextDecoration = style && style.includes('text-decoration');
          if (!hasTextDecoration) {
            styles.push('text-decoration: line-through');
          } else if (!style.includes('line-through')) {
            styles.push('text-decoration: line-through');
          }
          span.classList.add('editor-text-strikethrough');
        }
        
        // Set the combined styles
        if (styles.length > 0) {
          span.setAttribute('style', styles.join('; '));
        }
        
        return span.outerHTML;
      }
      
      // Handle element nodes
      if (element instanceof HTMLElement) {
        const children = node.getChildren ? node.getChildren() : [];
        const childrenHTML = children.map(child => 
          $exportNodeToHTML(child, editor, exportMap)
        ).filter(html => html !== null).join('');
        
        if (childrenHTML) {
          const tag = element.cloneNode(false);
          tag.innerHTML = childrenHTML;
          return tag.outerHTML;
        } else if (element.outerHTML) {
          return element.outerHTML;
        }
      }
      
      return element.textContent || '';
    }
  }
  
  // Default: try to get text content
  return node.getTextContent ? node.getTextContent() : '';
}

// TextNode Replacement Transform Plugin
function TextNodeTransformPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Register the transform
    return editor.registerNodeTransform(TextNode, replaceTextNodeTransform);
  }, [editor]);
  
  return null;
}

// Custom placeholder component
function Placeholder({ text }) {
  return <div className="editor-placeholder">{text}</div>;
}

// Editor inner component that uses the composer context
const EditorInner = forwardRef(({ 
  value,
  initialValue,
  onChange,
  onTextChange,
  onSelectionChange,
  onFocus,
  onBlur,
  placeholder,
  readOnly,
  maxLength
}, ref) => {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);
  const isSettingContent = useRef(false);
  
  // Store previous content to check for actual changes
  const previousContentRef = useRef({
    html: '',
    text: ''
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    // Get content methods
    getHTML: () => {
      let html = '';
      editor.getEditorState().read(() => {
        html = $customGenerateHtmlFromNodes(editor, null);
      });
      return html;
    },
    getText: () => {
      let text = '';
      editor.getEditorState().read(() => {
        text = $getRoot().getTextContent();
      });
      return text;
    },
    getJSON: () => {
      return editor.getEditorState().toJSON();
    },
    
    // Set content methods
    setHTML: (html) => {
      isSettingContent.current = true;
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        
        // First, use Lexical's default parser
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().clear();
        $getRoot().append(...nodes);
        
        // Then apply styles from the original HTML
        const allSpans = dom.querySelectorAll('span[style]');
        const styleMap = new Map();
        
        // Build a map of text content to styles
        allSpans.forEach(span => {
          const text = span.textContent;
          const style = span.getAttribute('style');
          if (text && style) {
            styleMap.set(text, style);
          }
        });
        
        // Apply styles to matching text nodes
        if (styleMap.size > 0) {
          const textNodes = getAllTextNodes($getRoot());
          textNodes.forEach(node => {
            const nodeText = node.getTextContent();
            // Check if this text matches any styled text
            for (const [text, style] of styleMap) {
              if (nodeText === text || nodeText.includes(text)) {
                node.setStyle(style);
                break;
              }
            }
          });
        }
      }, {
        tag: 'history-merge' // This prevents adding to history
      });
      
      // Update the previous content reference to prevent triggering onChange
      editor.getEditorState().read(() => {
        previousContentRef.current = {
          html: $customGenerateHtmlFromNodes(editor, null),
          text: $getRoot().getTextContent()
        };
      });
      
      isSettingContent.current = false;
    },
    setText: (text) => {
      isSettingContent.current = true;
      editor.update(() => {
        $getRoot().clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(text);
        paragraph.append(textNode);
        $getRoot().append(paragraph);
      }, {
        tag: 'history-merge' // This prevents adding to history
      });
      
      // Update the previous content reference to prevent triggering onChange
      editor.getEditorState().read(() => {
        previousContentRef.current = {
          html: $customGenerateHtmlFromNodes(editor, null),
          text: $getRoot().getTextContent()
        };
      });
      
      isSettingContent.current = false;
    },
    setJSON: (json) => {
      isSettingContent.current = true;
      const editorState = editor.parseEditorState(json);
      editor.setEditorState(editorState);
      
      // Update the previous content reference to prevent triggering onChange
      editor.getEditorState().read(() => {
        previousContentRef.current = {
          html: $customGenerateHtmlFromNodes(editor, null),
          text: $getRoot().getTextContent()
        };
      });
      
      isSettingContent.current = false;
    },
    
    // Utility methods
    clear: () => {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    },
    focus: () => {
      editor.focus();
    },
    blur: () => {
      editor.blur();
    },
    isEditable: () => {
      return editor.isEditable();
    },
    setEditable: (editable) => {
      editor.setEditable(editable);
    },
    isEmpty: () => {
      let isEmpty = true;
      editor.getEditorState().read(() => {
        isEmpty = $getRoot().getTextContent().trim() === '';
      });
      return isEmpty;
    }
  }), [editor]);

  // Handle initial value
  useEffect(() => {
    if (isFirstRender.current && (initialValue || value)) {
      // Use queueMicrotask to ensure this happens after editor initialization
      // but before any user interactions
      queueMicrotask(() => {
        isSettingContent.current = true;
        editor.update(() => {
          try {
            const htmlToSet = value || initialValue;
            
            // Extract content if HTML starts with <html> tag using string-based approach
            const processedHTML = extractContentFromHTML(htmlToSet);
            
            // Use a more direct approach to handle HTML content
            if (processedHTML && processedHTML.trim()) {
              const parser = new DOMParser();
              const dom = parser.parseFromString(`<div>${processedHTML}</div>`, 'text/html');
              const contentElement = dom.body.firstChild;
              
              if (contentElement) {
                // Use Lexical's node parser
                const nodes = $generateNodesFromDOM(editor, dom);
                $getRoot().clear();
                
                if (nodes && nodes.length > 0) {
                  $getRoot().append(...nodes);
                } else {
                  // Fallback if node generation fails
                  const paragraph = $createParagraphNode();
                  const textNode = $createTextNode(contentElement.textContent || '');
                  paragraph.append(textNode);
                  $getRoot().append(paragraph);
                }
                
                // Then apply styles from the original HTML if needed
                const allSpans = dom.querySelectorAll('span[style]');
                const styleMap = new Map();
                
                // Build a map of text content to styles
                allSpans.forEach(span => {
                  const text = span.textContent;
                  const style = span.getAttribute('style');
                  if (text && style) {
                    styleMap.set(text, style);
                  }
                });
                
                // Apply styles to matching text nodes
                if (styleMap.size > 0) {
                  const textNodes = getAllTextNodes($getRoot());
                  textNodes.forEach(node => {
                    const nodeText = node.getTextContent();
                    // Check if this text matches any styled text
                    for (const [text, style] of styleMap) {
                      if (nodeText === text || nodeText.includes(text)) {
                        node.setStyle(style);
                        break;
                      }
                    }
                  });
                }
              }
            }
            
            // Update the previous content ref to prevent onChange on init
            editor.getEditorState().read(() => {
              previousContentRef.current = {
                html: $customGenerateHtmlFromNodes(editor, null),
                text: $getRoot().getTextContent()
              };
            });
          } catch (error) {
            console.error('Error setting initial content:', error);
          }
        }, {
          tag: 'history-merge'  // This prevents adding to history
        });
        
        isSettingContent.current = false;
        isFirstRender.current = false;
      });
    }
  }, [editor, initialValue, value]);

  // Handle controlled value updates
  useEffect(() => {
    if (!isFirstRender.current && value !== undefined) {
      const currentHTML = (() => {
        let html = '';
        editor.getEditorState().read(() => {
          html = $customGenerateHtmlFromNodes(editor, null);
        });
        return html;
      })();

      // Only update if the value actually changed
      if (currentHTML !== value) {
        isSettingContent.current = true;
        editor.update(() => {
          try {
            // Clear existing content
            $getRoot().clear();
            
            // Extract content if HTML starts with <html> tag using string-based approach
            const processedHTML = extractContentFromHTML(value);
            
            // Use a more direct approach to handle HTML content
            if (processedHTML && processedHTML.trim()) {
              const parser = new DOMParser();
              const dom = parser.parseFromString(`<div>${processedHTML}</div>`, 'text/html');
              const contentElement = dom.body.firstChild;
              
              if (contentElement) {
                // Use Lexical's node parser
                const nodes = $generateNodesFromDOM(editor, dom);
                
                if (nodes && nodes.length > 0) {
                  $getRoot().append(...nodes);
                } else {
                  // Fallback if node generation fails
                  const paragraph = $createParagraphNode();
                  const textNode = $createTextNode(contentElement.textContent || '');
                  paragraph.append(textNode);
                  $getRoot().append(paragraph);
                }
                
                // Then apply styles from the original HTML if needed
                const allSpans = dom.querySelectorAll('span[style]');
                const styleMap = new Map();
                
                // Build a map of text content to styles
                allSpans.forEach(span => {
                  const text = span.textContent;
                  const style = span.getAttribute('style');
                  if (text && style) {
                    styleMap.set(text, style);
                  }
                });
                
                // Apply styles to matching text nodes
                if (styleMap.size > 0) {
                  const textNodes = getAllTextNodes($getRoot());
                  textNodes.forEach(node => {
                    const nodeText = node.getTextContent();
                    for (const [text, style] of styleMap) {
                      if (nodeText === text || nodeText.includes(text)) {
                        node.setStyle(style);
                        break;
                      }
                    }
                  });
                }
              }
            }
            
            // Update previous content ref
            editor.getEditorState().read(() => {
              previousContentRef.current = {
                html: $customGenerateHtmlFromNodes(editor, null),
                text: $getRoot().getTextContent()
              };
            });
          } catch (error) {
            console.error('Error updating content:', error);
          }
        }, {
          tag: 'history-merge' // Prevent adding to history
        });
        
        isSettingContent.current = false;
      }
    }
  }, [value, editor]);

  // Handle readOnly state
  useEffect(() => {
    if (readOnly !== undefined) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Handle content changes
  const handleChange = (editorState) => {
    // Skip if we're in the process of setting content programmatically
    if (isSettingContent.current) {
      return;
    }
    
    editorState.read(() => {
      const html = $customGenerateHtmlFromNodes(editor, null);
      const text = $getRoot().getTextContent();
      
      // Check maxLength
      if (maxLength && text.length > maxLength) {
        return;
      }
      
      // Use a more robust approach to determine if content has actually changed
      // This helps filter out clicks and selection changes that don't modify content
      const isActualChange = () => {
        // First do a quick text comparison
        if (text !== previousContentRef.current.text) {
          return true;
        }
        
        // If text is the same, do a deeper structure comparison
        // Compare node structure using stringified JSON for key parts
        const currentState = JSON.stringify(editorState.toJSON().root.children);
        const previousState = JSON.stringify(editor._previousEditorState?.toJSON()?.root?.children || []);
        
        // This compares the actual structure of the document
        return currentState !== previousState;
      };
      
      // Only fire onChange if there's an actual content change
      if (isActualChange()) {
        previousContentRef.current = { html, text };
        
        if (onChange) {
          onChange({
            html,
            text,
            json: editorState.toJSON(),
            isEmpty: text.trim() === ''
          });
        }
        
        if (onTextChange) {
          onTextChange(text);
        }
      }
    });
  };

  // Handle selection changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (onSelectionChange) {
          const selection = window.getSelection();
          onSelectionChange({
            text: selection.toString(),
            anchorOffset: selection.anchorOffset,
            focusOffset: selection.focusOffset
          });
        }
      });
    });
  }, [editor, onSelectionChange]);

  // Handle focus/blur events
  useEffect(() => {
    const rootElement = editor.getRootElement();
    
    const handleFocus = () => {
      if (onFocus) onFocus();
    };
    
    const handleBlur = () => {
      if (onBlur) onBlur();
    };
    
    if (rootElement) {
      rootElement.addEventListener('focus', handleFocus);
      rootElement.addEventListener('blur', handleBlur);
    }
    
    return () => {
      if (rootElement) {
        rootElement.removeEventListener('focus', handleFocus);
        rootElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [editor, onFocus, onBlur]);

  return (
    <>
      <ControlPanel />
      <div className="editor-inner">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        <ListPlugin />
        <EnhancedListPlugin />
        <LinkPlugin />
        <LinkTooltipPlugin />
        <ImagePlugin />
        <TablePlugin />
        <TableCellActionMenuPlugin />
        <HorizontalRulePlugin />
        <TextNodeTransformPlugin />
      </div>
    </>
  );
});

EditorInner.displayName = 'EditorInner';

// Main RichTextEditor component
const RichTextEditor = forwardRef((props, ref) => {

  const { translate } = useTranslation();

  const {
    value,
    initialValue = '',
    onChange,
    onTextChange,
    onSelectionChange,
    onFocus,
    onBlur,
    placeholder = translate("TEXT_EDITOR.ENTER_SOME_TEXT"),
    readOnly = false,
    maxLength,
    className = '',
    style,
    ...rest
  } = props;

  const editorRef = useRef(null);

  // Forward ref to the inner editor
  useImperativeHandle(ref, () => editorRef.current, []);

  const initialConfig = {
    namespace: 'RichTextEditor',
    nodes: [
      ListNode, 
      ListItemNode, 
      AutoLinkNode, 
      LinkNode, 
      ImageNode, 
      TableNode, 
      TableCellNode, 
      TableRowNode, 
      HorizontalRuleNode,
      CustomTextNode
    ],
    theme: {
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
        strikethrough: 'editor-text-strikethrough',
      },
      list: {
        nested: {
          listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
        listitemChecked: 'editor-listitem-checked',
        listitemUnchecked: 'editor-listitem-unchecked',
      },
      link: 'editor-link',
      image: 'editor-image',
      table: 'editor-table',
      tableRow: 'editor-table-row',
      tableCell: 'editor-table-cell',
      tableCellHeader: 'editor-table-cell-header',
      horizontalRule: 'editor-horizontal-rule',
    },
    editorState: null,
    onError(error) {
      console.error('Lexical Editor Error:', error);
    },
  };

  return (
    <div className={`editor-container ${className}`} style={{ ...style, display: 'flex', flexDirection: 'column' }} {...rest}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorInner
          ref={editorRef}
          value={value}
          initialValue={initialValue}
          onChange={onChange}
          onTextChange={onTextChange}
          onSelectionChange={onSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
        />
      </LexicalComposer>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;