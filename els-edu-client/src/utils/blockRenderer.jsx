import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Renders Strapi Blocks JSON as React components with book-style formatting
 * @param {Array|string} description - The json_description field from Strapi
 * @param {Object} options - Rendering options
 * @returns {React.Component} Rendered content
 */
export const renderDescriptionBlocks = (description, options = {}) => {
  const { className = "book-style-content space-y-4" } = options;

  // Handle legacy string descriptions
  if (typeof description === "string") {
    return (
      <div className={`prose prose-sm max-w-none text-gray-700 ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {description}
        </ReactMarkdown>
      </div>
    );
  }

  // Handle Strapi Blocks JSON (Book Style)
  if (Array.isArray(description)) {
    try {
      return (
        <div className={className}>
          {description.map((block, index) => {
            switch (block.type) {
              case "paragraph":
                return (
                  <div key={index} className="paragraph-block">
                    <p className="text-gray-800 leading-loose">
                      {block.children?.map((child, childIndex) => {
                        if (child.type === "text") {
                          // Handle formatted text with LaTeX - render each text node with ReactMarkdown
                          let processedText = child.text;
                          
                          // Handle double-escaped LaTeX delimiters from Strapi
                          processedText = processedText.replace(/\\\\?\(/g, '$');
                          processedText = processedText.replace(/\\\\?\)/g, '$');
                          
                          // Add line breaks and formatting between different rules
                          processedText = processedText.replace(/([A-Z][a-z]+ Rule:)/g, '\n\n**$1** ');
                          
                          return (
                            <div key={childIndex} className={`
                              mb-4
                              ${child.bold ? 'font-bold' : ''}
                              ${child.italic ? 'italic' : ''}
                              ${child.underline ? 'underline' : ''}
                              ${child.code ? 'font-mono bg-gray-100 px-1 py-0.5 rounded text-sm' : ''}
                            `}>
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  p: ({node, ...props}) => <div className="leading-loose mb-4" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-blue-900 mr-2" {...props} />,
                                }}
                              >
                                {processedText}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </p>
                  </div>
                );
                
              case "heading":
                const HeadingTag = `h${block.level || 2}`;
                return (
                  <HeadingTag key={index} className={`
                    font-bold text-gray-900 mt-6 mb-3
                    ${block.level === 1 ? 'text-2xl' : ''}
                    ${block.level === 2 ? 'text-xl' : ''}
                    ${block.level === 3 ? 'text-lg' : ''}
                    ${block.level >= 4 ? 'text-base' : ''}
                  `}>
                    {block.children?.map((child, childIndex) => (
                      <span key={childIndex}>{child.text}</span>
                    ))}
                  </HeadingTag>
                );
                
              case "list":
                const ListTag = block.format === "ordered" ? "ol" : "ul";
                return (
                  <ListTag key={index} className={`
                    space-y-1 ml-6
                    ${block.format === "ordered" ? 'list-decimal' : 'list-disc'}
                  `}>
                    {block.children?.map((listItem, listIndex) => (
                      <li key={listIndex} className="text-gray-800">
                        {listItem.children?.map((child, childIndex) => (
                          <span key={childIndex}>{child.text}</span>
                        ))}
                      </li>
                    ))}
                  </ListTag>
                );
                
              case "quote":
                return (
                  <blockquote key={index} className="border-l-4 border-primary/30 pl-4 py-2 bg-gray-50 italic text-gray-700 rounded-r">
                    {block.children?.map((child, childIndex) => (
                      <span key={childIndex}>{child.text}</span>
                    ))}
                  </blockquote>
                );
                
              case "code":
                return (
                  <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    <code>
                      {block.children?.map((child, childIndex) => (
                        <span key={childIndex}>{child.text}</span>
                      ))}
                    </code>
                  </pre>
                );
                
              default:
                // Fallback for unknown block types
                return (
                  <div key={index} className="text-gray-800">
                    {block.children?.map((child, childIndex) => (
                      <span key={childIndex}>{child.text}</span>
                    ))}
                  </div>
                );
            }
          })}
        </div>
      );
    } catch (e) {
      console.error("Error rendering description blocks:", e);
      return (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          Error loading description content.
        </div>
      );
    }
  }

  return (
    <div className="text-gray-500 italic">
      No description available.
    </div>
  );
};

/**
 * Legacy function for extracting plain text from blocks (for backwards compatibility)
 * @param {Array|string} description - The json_description field from Strapi
 * @returns {string} Plain text content
 */
export const extractTextFromBlocks = (description) => {
  if (typeof description === "string") return description;

  if (Array.isArray(description)) {
    try {
      return description
        .map((block) => {
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child) => child.text).join("");
          }
          return "";
        })
        .join("\n");
    } catch (e) {
      console.error("Error parsing description blocks:", e);
      return "Error loading description.";
    }
  }

  return "No description available.";
};