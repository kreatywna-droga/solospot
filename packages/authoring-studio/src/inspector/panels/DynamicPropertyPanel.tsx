import * as React from 'react';
import { InspectorGroup } from '@web-factor/builder-core/src/InspectorRuntime';
import { PropSchema } from '@web-factor/builder-core/src/ComponentRegistry';

export interface DynamicPropertyPanelProps {
  group: InspectorGroup;
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
}

export const DynamicPropertyPanel: React.FC<DynamicPropertyPanelProps> = ({
  group,
  currentProps,
  onPropChange,
  breakpoint
}) => {
  const renderField = (field: PropSchema) => {
    // Resolving value with basic fallback
    const rawValue = currentProps[field.key] ?? field.defaultValue ?? '';
    
    // Simplistic handling of breakpoint overrides (assuming value could be an object { desktop, tablet, mobile })
    const isResponsive = typeof rawValue === 'object' && rawValue !== null && 'desktop' in rawValue;
    const value = isResponsive ? (rawValue as any)[breakpoint] ?? '' : rawValue;

    const handleChange = (newVal: unknown) => {
      if (isResponsive) {
        onPropChange(field.key, { ...rawValue as any, [breakpoint]: newVal });
      } else {
        onPropChange(field.key, newVal);
      }
    };

    switch (field.type) {
      case 'string':
      case 'text':
        return (
          <input 
            type="text" 
            value={value as string} 
            onChange={e => handleChange(e.target.value)} 
          />
        );
      case 'number':
        return (
          <input 
            type="number" 
            value={value as number} 
            onChange={e => handleChange(Number(e.target.value))} 
          />
        );
      case 'boolean':
        return (
          <input 
            type="checkbox" 
            checked={Boolean(value)} 
            onChange={e => handleChange(e.target.checked)} 
          />
        );
      case 'select':
        if ('options' in field) {
          return (
            <select value={value as string} onChange={e => handleChange(e.target.value)}>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          );
        }
        return null;
      case 'color':
        return (
          <div className="color-picker-wrapper">
            <input 
              type="color" 
              value={value as string} 
              onChange={e => handleChange(e.target.value)} 
            />
            <input 
              type="text" 
              value={value as string} 
              onChange={e => handleChange(e.target.value)} 
            />
          </div>
        );
      default:
        return <span>Unsupported field type: {field.type}</span>;
    }
  };

  return (
    <div className="dynamic-property-panel">
      {group.fields.map(field => (
        <div className="property-field" key={field.key}>
          <label className="property-label">{field.label}</label>
          <div className="property-input">
            {renderField(field)}
          </div>
        </div>
      ))}
    </div>
  );
};
