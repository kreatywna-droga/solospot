'use client';

import React, { useState } from 'react';
import {
  X, Layout, Sparkles, ShoppingBag, Briefcase, Camera, Utensils,
  Palette, FilePlus, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import { SECTION_TEMPLATES } from '../library/SectionLibraryModal';
import { SectionNode } from '../../../../packages/builder-core/src/BuilderDocument';

import { WEBSITE_TEMPLATES as WEBSITE_TEMPLATES_DATA, WebsiteTemplate as WebsiteTemplateDataType } from './WebsiteTemplatesData';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Briefcase, Camera, Palette, Utensils, ShoppingBag, FilePlus,
};

export type WebsiteTemplate = WebsiteTemplateDataType;

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = WEBSITE_TEMPLATES_DATA.map((t) => ({
  ...t,
  icon: ICON_MAP[t.iconName] || Sparkles,
}));

export interface WebsiteTemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebsiteTemplatePickerModal({ isOpen, onClose }: WebsiteTemplatePickerModalProps) {
  const { dispatch, canvas, document: builderDoc } = useBuilder();

  if (!isOpen) return null;

  const handleApplyTemplate = (template: WebsiteTemplate) => {
    const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id;
    if (!targetPageId) return;

    if (template.id === 'blank') {
      // Create empty page or reset page sections
      const activePage = builderDoc.pages.find((p) => p.id === targetPageId);
      if (activePage) {
        // Clear existing sections
        activePage.sections.forEach((sec) => {
          dispatch({ type: 'REMOVE_SECTION', pageId: targetPageId, sectionId: sec.id });
        });
      }
      onClose();
      return;
    }

    // Generate section nodes from template definitions
    const sectionsToInsert: SectionNode[] = [];
    template.sectionTemplateIds.forEach((templateId) => {
      const found = SECTION_TEMPLATES.find((t) => t.id === templateId);
      if (found) {
        sectionsToInsert.push(found.createNode() as SectionNode);
      }
    });

    // Clear current page sections first, then insert the new sections
    const activePage = builderDoc.pages.find((p) => p.id === targetPageId);
    if (activePage) {
      activePage.sections.forEach((sec) => {
        dispatch({ type: 'REMOVE_SECTION', pageId: targetPageId, sectionId: sec.id });
      });
    }

    // Insert all template sections sequentially
    sectionsToInsert.forEach((sec, idx) => {
      dispatch({
        type: 'INSERT_NODE',
        parentId: null,
        node: sec,
        index: idx,
        pageId: targetPageId,
      });
    });

    if (sectionsToInsert[0]) {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: sectionsToInsert[0].id },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-[#27272A] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-[#0e0e18]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">Wybierz Szablon Startowy Strony</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Rozpocznij z kompletną, profesjonalnie skomponowaną stroną lub pustą kanwą. Wszystkie sekcje możesz potem dowolnie edytować.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEBSITE_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className="group p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/50 hover:bg-violet-500/[0.05] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
                      {Icon ? <Icon className="w-5 h-5" /> : null}
                    </div>
                    {tmpl.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA]">
                        {tmpl.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors mb-1">
                    {tmpl.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-violet-400/90 mb-2">
                    {tmpl.tagline}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-3">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-[#A78BFA] transition-colors">
                  <span>{tmpl.sectionTemplateIds.length > 0 ? `${tmpl.sectionTemplateIds.length} sekcji` : 'Od zera'}</span>
                  <div className="flex items-center gap-1 text-violet-400">
                    <span>Użyj</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
