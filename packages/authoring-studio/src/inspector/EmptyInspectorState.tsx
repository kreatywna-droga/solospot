import * as React from 'react';

/**
 * EmptyInspectorState — PM28 Empty State Component
 *
 * Rendered when no component or section is currently selected on the canvas.
 */
export const EmptyInspectorState: React.FC = () => {
  return (
    <div className="empty-inspector-state flex flex-col items-center justify-center h-full px-6 py-12 text-center text-slate-400 select-none">
      <div className="w-12 h-12 mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-between justify-center text-slate-500">
        <svg
          className="w-6 h-6 mx-auto stroke-current"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286.688ZM12 4.5v.008H12V4.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      </div>
      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
        No component selected
      </h4>
      <p className="text-[11px] text-slate-500 max-w-[180px]">
        Select any element on the canvas to edit its properties.
      </p>
    </div>
  );
};

export default EmptyInspectorState;
