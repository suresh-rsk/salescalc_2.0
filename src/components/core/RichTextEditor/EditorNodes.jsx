import React from 'react';
import { DecoratorNode } from 'lexical';

// Custom ImageNode implementation
export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(src, altText, width, height, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
  }

  createDOM(config) {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  exportDOM() {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width !== 'inherit') {
      element.style.width = this.__width;
    }
    if (this.__height !== 'inherit') {
      element.style.height = this.__height;
    }
    element.style.maxWidth = '100%';
    element.style.cursor = 'pointer';
    
    const wrapper = document.createElement('span');
    wrapper.className = 'editor-image';
    wrapper.appendChild(element);
    return { element: wrapper };
  }

  exportJSON() {
    return {
      type: 'image',
      src: this.getSrc(),
      altText: this.getAltText(),
      width: this.__width,
      height: this.__height,
      version: 1,
    };
  }

  static importJSON(serializedNode) {
    const { src, altText, width, height } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
      height,
    });
    return node;
  }

  static importDOM() {
    return {
      img: (node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
      span: (node) => {
        if (node.classList.contains('editor-image')) {
          return {
            conversion: convertImageSpan,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  decorate() {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }
}

function convertImageElement(element) {
  if (element instanceof HTMLImageElement) {
    const { src, alt, width, height } = element;
    const node = $createImageNode({ 
      src, 
      altText: alt,
      width: width ? `${width}px` : 'inherit',
      height: height ? `${height}px` : 'inherit'
    });
    return { node };
  }
  return null;
}

function convertImageSpan(element) {
  const img = element.querySelector('img');
  if (img) {
    return convertImageElement(img);
  }
  return null;
}

export function $createImageNode({ src, altText, width, height }) {
  return new ImageNode(src, altText, width, height);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}

// Image component
function ImageComponent({ src, altText, width, height, nodeKey }) {
  const handleClick = (e) => {
    // Prevent the click from bubbling up and potentially hiding the toolbar
    e.stopPropagation();
  };

  return (
    <img
      src={src}
      alt={altText}
      style={{
        width,
        height,
        maxWidth: '100%',
        cursor: 'pointer',
      }}
      draggable="false"
      onClick={handleClick}
    />
  );
}

// Custom HorizontalRuleNode implementation
export class HorizontalRuleNode extends DecoratorNode {
  static getType() {
    return 'horizontalrule';
  }

  static clone(node) {
    return new HorizontalRuleNode(node.__key);
  }

  constructor(key) {
    super(key);
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.className = 'editor-horizontal-rule-container';
    const hr = document.createElement('hr');
    hr.className = 'editor-horizontal-rule';
    div.appendChild(hr);
    return div;
  }

  updateDOM() {
    return false;
  }

  exportDOM() {
    const div = document.createElement('div');
    div.className = 'editor-horizontal-rule-container';
    const hr = document.createElement('hr');
    hr.className = 'editor-horizontal-rule';
    div.appendChild(hr);
    return { element: div };
  }

  static importDOM() {
    return {
      hr: (node) => ({
        conversion: convertHorizontalRuleElement,
        priority: 0,
      }),
      div: (node) => {
        if (node.classList.contains('editor-horizontal-rule-container')) {
          return {
            conversion: convertHorizontalRuleDiv,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  static importJSON() {
    return $createHorizontalRuleNode();
  }

  exportJSON() {
    return {
      type: 'horizontalrule',
      version: 1,
    };
  }

  decorate() {
    return <HorizontalRuleComponent nodeKey={this.getKey()} />;
  }
}

function convertHorizontalRuleElement(element) {
  return { node: $createHorizontalRuleNode() };
}

function convertHorizontalRuleDiv(element) {
  if (element.querySelector('hr') || element.classList.contains('editor-horizontal-rule-container')) {
    return { node: $createHorizontalRuleNode() };
  }
  return null;
}

export function $createHorizontalRuleNode() {
  return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(node) {
  return node instanceof HorizontalRuleNode;
}

// HorizontalRule component
function HorizontalRuleComponent({ nodeKey }) {
  return (
    <hr className="editor-horizontal-rule" />
  );
}