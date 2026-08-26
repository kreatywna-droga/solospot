import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CameraAnimationBridge } from '../CameraAnimationBridge';

describe('CameraAnimation Integration (S13 Motion System)', () => {
  it('should create camera property animation track', () => {
    const track = CameraAnimationBridge.createCameraTrack('camera.zoom', [
      { time: 0, value: 1.0, easing: 'easeInOut' },
      { time: 1000, value: 2.5, easing: 'easeInOut' },
    ]);

    expect(track.propertyKey).toBe('camera.zoom');
    expect(track.keyframes.length).toBe(2);
  });

  it('should assemble AnimationTimeline for camera target', () => {
    const trackX = CameraAnimationBridge.createCameraTrack('camera.position.x', [
      { time: 0, value: 0 },
      { time: 500, value: 300 },
    ]);

    const timeline = CameraAnimationBridge.createCameraTimeline('cam1', [trackX], 'PanRightAnimation', 500);

    expect(timeline.targetNodeId).toBe('cam1');
    expect(timeline.clips.length).toBe(1);
    expect(timeline.clips[0].tracks.length).toBe(1);
  });

  it('should apply evaluated camera properties onto Camera state', () => {
    const camera = createCamera({ id: 'cam1', transform: { position: { x: 0, y: 0, z: 0 }, zoom: 1.0, rotationDeg: 0 } });

    const evaluatedValues = {
      'camera.position.x': 500,
      'camera.position.y': -200,
      'camera.zoom': 3.0,
      'camera.rotationDeg': 90,
    };

    const updatedCamera = CameraAnimationBridge.applyEvaluatedCameraProperties(camera, evaluatedValues);

    expect(updatedCamera.transform.position.x).toBe(500);
    expect(updatedCamera.transform.position.y).toBe(-200);
    expect(updatedCamera.transform.zoom).toBe(3.0);
    expect(updatedCamera.transform.rotationDeg).toBe(90);
  });
});
