
'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const AVATAR_URL = 'https://models.readyplayer.me/6673d32585f617d52a90192e.glb';

const useLipSync = (audioRef: React.RefObject<THREE.Audio<AudioNode> | undefined>, modelRef: React.RefObject<THREE.Group>) => {
  const analyser = useRef<THREE.AudioAnalyser>();
  
  useEffect(() => {
    if (audioRef.current) {
      analyser.current = new THREE.AudioAnalyser(audioRef.current, 32);
    }
  }, [audioRef]);

  useFrame(() => {
    if (analyser.current && modelRef.current) {
      const data = analyser.current.getAverageFrequency();
      const mouthOpen = data / 100;
      
      const head = modelRef.current.getObjectByName('Head');
      const jaw = modelRef.current.getObjectByName('Jaw');

      if (head && jaw) {
        const jawMorphIndex = (head as THREE.SkinnedMesh).morphTargetDictionary?.['jawOpen'];
        
        if (jawMorphIndex !== undefined && (head as THREE.SkinnedMesh).morphTargetInfluences) {
          ((head as THREE.SkinnedMesh).morphTargetInfluences as number[])[jawMorphIndex] = THREE.MathUtils.lerp(
            ((head as THREE.SkinnedMesh).morphTargetInfluences as number[])[jawMorphIndex],
            mouthOpen,
            0.5
          );
        }
      }
    }
  });
};


export function Avatar({ audioUrl }: { audioUrl: string | null }) {
  const modelRef = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, modelRef);
  const audioRef = useRef<THREE.Audio<AudioNode>>();
  const [audioListener] = useState(() => new THREE.AudioListener());
  
  const { camera } = useThree();
  camera.add(audioListener);

  useEffect(() => {
    if (actions['idle']) {
        actions['idle'].play();
    }
  }, [actions]);

  useEffect(() => {
    if (audioUrl) {
      const audio = new THREE.Audio(audioListener);
      const loader = new THREE.AudioLoader();
      
      loader.load(audioUrl, (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(false);
        audio.setVolume(0.5);
        audio.play();
        audioRef.current = audio;

        audio.onEnded = () => {
          actions['idle']?.play();
          actions['talk']?.stop();
        };

        actions['talk']?.play();
        actions['idle']?.stop();
      });
    }

    return () => {
      if (audioRef.current && audioRef.current.isPlaying) {
        audioRef.current.stop();
      }
    };
  }, [audioUrl, audioListener, actions]);

  useLipSync(audioRef, modelRef);

  return (
    <group ref={modelRef} dispose={null} position={[0, -1.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(AVATAR_URL);
