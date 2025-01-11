import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  className?: string;
  raw: string;
}

export const Markdown: React.FC<MarkdownProps> = React.memo((props) => {
  return <ReactMarkdown className={props.className}>{props.raw}</ReactMarkdown>;
});
Markdown.displayName = 'Markdown';
