import * as React from 'react';

export interface InspectorAccordionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const InspectorAccordion: React.FC<InspectorAccordionProps> = ({ 
  title, 
  defaultExpanded = true, 
  children 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={`inspector-accordion ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="accordion-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="accordion-title">{title}</span>
      </div>
      {isExpanded && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
};
