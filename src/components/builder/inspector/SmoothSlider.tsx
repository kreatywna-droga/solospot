'use client';

/**
 * SmoothSlider — zero-lag range input
 *
 * During drag: updates only the DOM display label (via ref) + calls onLivePreview
 * for immediate canvas DOM mutations. Zero React re-renders mid-drag.
 *
 * On release (pointerup): fires onChange once — commits to BuilderDocument SSOT.
 */

import React, { useRef, useCallback, useEffect } from 'react';

interface SmoothSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Called on every pointermove for immediate DOM preview (no re-render) */
  onLivePreview?: (value: number) => void;
  className?: string;
  /** Ref to a label span — updated in-place without a React re-render */
  labelRef?: React.RefObject<HTMLSpanElement | null>;
  unit?: string;
}

export const SmoothSlider: React.FC<SmoothSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  onLivePreview,
  className = '',
  labelRef,
  unit = 'px',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const lastCommitted = useRef(value);

  // Update gradient fill so the track reflects slider thumb position live
  const updateTrackFill = useCallback((v: number, el: HTMLInputElement) => {
    const pct = ((v - min) / (max - min)) * 100;
    el.style.background = `linear-gradient(to right, #7c3aed ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
  }, [min, max]);

  // Sync external value changes (e.g. selection changed or numeric input typed)
  useEffect(() => {
    if (inputRef.current && !isDragging.current) {
      inputRef.current.value = String(value);
      lastCommitted.current = value;
      updateTrackFill(value, inputRef.current);
    }
  }, [value, updateTrackFill]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = true;
    (e.currentTarget as HTMLInputElement).setPointerCapture(e.pointerId);
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const v = Number((e.target as HTMLInputElement).value);
    updateTrackFill(v, e.target as HTMLInputElement);
    if (labelRef?.current) {
      labelRef.current.textContent = `${v}${unit}`;
    }
    onLivePreview?.(v);
  }, [labelRef, onLivePreview, unit, updateTrackFill]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    const v = Number((e.currentTarget as HTMLInputElement).value);
    if (v !== lastCommitted.current) {
      lastCommitted.current = v;
      onChange(v);
    }
  }, [onChange]);

  // Keyboard arrow keys — no drag, commit immediately
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDragging.current) {
      const v = Number(e.target.value);
      updateTrackFill(v, e.target as HTMLInputElement);
      if (labelRef?.current) {
        labelRef.current.textContent = `${v}${unit}`;
      }
      lastCommitted.current = v;
      onChange(v);
    }
  }, [onChange, labelRef, unit, updateTrackFill]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <input
      ref={inputRef}
      type="range"
      min={min}
      max={max}
      step={step}
      defaultValue={value}
      onPointerDown={handlePointerDown}
      onInput={handleInput}
      onPointerUp={handlePointerUp}
      onChange={handleChange}
      className={`w-full h-2 rounded-full cursor-pointer ${className}`}
      style={{
        background: `linear-gradient(to right, #7c3aed ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        accentColor: '#7c3aed',
      }}
    />
  );
};
