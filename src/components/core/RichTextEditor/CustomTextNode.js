import { TextNode, $isTextNode } from 'lexical';

export class CustomTextNode extends TextNode {
  static getType() {
    return 'custom-text';
  }

  static clone(node) {
    return new CustomTextNode(node.__text, node.__key);
  }

  exportDOM(editor) {
    const element = super.exportDOM(editor);
    
    if (element && element.element) {
      const span = element.element;
      
      // Get the style from the node
      const style = this.getStyle();
      if (style) {
        span.style.cssText = style;
      }

      // Apply format-specific styles
      if (this.hasFormat('bold')) {
        span.style.fontWeight = 'bold';
      }
      if (this.hasFormat('italic')) {
        span.style.fontStyle = 'italic';
      }
      if (this.hasFormat('underline')) {
        span.style.textDecoration = 'underline';
      }
      if (this.hasFormat('strikethrough')) {
        span.style.textDecoration = span.style.textDecoration 
          ? span.style.textDecoration + ' line-through' 
          : 'line-through';
      }

      return { element: span };
    }
    
    return element;
  }

  static importDOM() {
    return {
      span: (node) => ({
        conversion: convertSpanElement,
        priority: 0,
      }),
      strong: (node) => ({
        conversion: convertBoldElement,
        priority: 0,
      }),
      b: (node) => ({
        conversion: convertBoldElement,
        priority: 0,
      }),
      em: (node) => ({
        conversion: convertItalicElement,
        priority: 0,
      }),
      i: (node) => ({
        conversion: convertItalicElement,
        priority: 0,
      }),
      u: (node) => ({
        conversion: convertUnderlineElement,
        priority: 0,
      }),
      s: (node) => ({
        conversion: convertStrikethroughElement,
        priority: 0,
      }),
      strike: (node) => ({
        conversion: convertStrikethroughElement,
        priority: 0,
      }),
      del: (node) => ({
        conversion: convertStrikethroughElement,
        priority: 0,
      }),
    };
  }
}

function convertSpanElement(element) {
  const node = $createCustomTextNode(element.textContent || '');
  
  // Preserve inline styles
  if (element.style.cssText) {
    node.setStyle(element.style.cssText);
  }
  
  // Check for formatting
  if (element.style.fontWeight === 'bold' || element.style.fontWeight >= 600) {
    node.toggleFormat('bold');
  }
  if (element.style.fontStyle === 'italic') {
    node.toggleFormat('italic');
  }
  if (element.style.textDecoration?.includes('underline')) {
    node.toggleFormat('underline');
  }
  if (element.style.textDecoration?.includes('line-through')) {
    node.toggleFormat('strikethrough');
  }
  
  return { node };
}

function convertBoldElement(element) {
  const node = $createCustomTextNode(element.textContent || '');
  node.toggleFormat('bold');
  if (element.style.cssText) {
    node.setStyle(element.style.cssText);
  }
  return { node };
}

function convertItalicElement(element) {
  const node = $createCustomTextNode(element.textContent || '');
  node.toggleFormat('italic');
  if (element.style.cssText) {
    node.setStyle(element.style.cssText);
  }
  return { node };
}

function convertUnderlineElement(element) {
  const node = $createCustomTextNode(element.textContent || '');
  node.toggleFormat('underline');
  if (element.style.cssText) {
    node.setStyle(element.style.cssText);
  }
  return { node };
}

function convertStrikethroughElement(element) {
  const node = $createCustomTextNode(element.textContent || '');
  node.toggleFormat('strikethrough');
  if (element.style.cssText) {
    node.setStyle(element.style.cssText);
  }
  return { node };
}

export function $createCustomTextNode(text) {
  return new CustomTextNode(text);
}

export function $isCustomTextNode(node) {
  return node instanceof CustomTextNode;
}

// Replace default TextNode with CustomTextNode
export function replaceTextNodeTransform(node) {
  if ($isTextNode(node) && !$isCustomTextNode(node)) {
    const customNode = $createCustomTextNode(node.getTextContent());
    
    // Copy all properties
    if (node.getStyle()) {
      customNode.setStyle(node.getStyle());
    }
    
    // Copy format
    const format = node.getFormat();
    if (format) {
      customNode.setFormat(format);
    }
    
    node.replace(customNode);
  }
}