/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationDock, NavTab } from './components/NavigationDock';
import { HeaderBar } from './components/HeaderBar';
import { CollaboratorsRail } from './components/CollaboratorsRail';
import { DashboardView } from './components/views/DashboardView';
import { StudioEngineView } from './components/views/StudioEngineView';
import { MakeItAVibeView } from './components/views/MakeItAVibeView';
import { VisualizerStudioView } from './components/views/VisualizerStudioView';
import { TrendDiscoveryView } from './components/views/TrendDiscoveryView';
import { RightsCenterView } from './components/views/RightsCenterView';
import { PublishingView } from './components/views/PublishingView';
import { QuickUploadModal } from './components/QuickUploadModal';
import { VocalModelsModal } from './components/VocalModelsModal';
import { VocalChainInspectorModal } from './components/VocalChainInspectorModal';
import { SAMPLE_TRACKS, PRESET_STYLES, COMMUNITY_CREATORS } from './lib/constants';
import { AudioTrack, TransformationPreset, VocalModel } from './types';
import { globalAudioEngine } from './lib/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(SAMPLE_TRACKS[0]);
  const [activePreset, setActivePreset] = useState<TransformationPreset>(PRESET_STYLES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [isVocalModelsOpen, setIsVocalModelsOpen] = useState(false);
  const [inspectedVocalModel, setInspectedVocalModel] = useState<VocalModel | null>(null);
  const [activeVocalModel, setActiveVocalModel] = useState<VocalModel | null>(null);
  const [userName, setUserName] = useState('LEONCE');

  const handleSelectVocalModel = (model: VocalModel) => {
    setActiveVocalModel(model);
    const vocalPreset: TransformationPreset = {
      id: model.id,
      name: model.name,
      category: 'Experimental',
      badge: model.companyOrLabel.split('/')[0].trim(),
      description: `${model.description} [${model.hardwarePedigree}]`,
      speed: 1.0,
      pitch: model.settings.pitchShift,
      reverbWet: model.settings.reverbWet,
      reverbDecay: model.settings.reverbDecay,
      bassBoost: model.settings.pitchShift < 0 ? 5.5 : 2.5,
      stereoWidth: model.settings.doublerWidth,
      pan8d: model.category === 'Cinematic & Choral' || model.category === 'R&B & Neo-Soul',
      panSpeed: 0.1,
      lofiCutoff: model.category === 'Retro & Vintage' ? 3800 : 19000,
      color: model.color,
    };
    setActivePreset(vocalPreset);
    globalAudioEngine.setTransformation(vocalPreset);
  };

  // Pre-load default synthetic audio engine so sounds are ready instantly
  useEffect(() => {
    globalAudioEngine.loadSyntheticTrack('midnight_drive').catch(console.error);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0a0304] flex items-center justify-center p-0 md:p-3 lg:p-4 font-sans text-[#f4e8e8]">
      {/* Outer Console Bezel / Tablet Chassis matching the uploaded screenshot */}
      <div className="w-full h-full lg:h-[95vh] lg:max-w-[1600px] bg-[#140708] rounded-none md:rounded-[36px] lg:rounded-[42px] border-0 md:border-2 border-[#3a1517] shadow-[0_0_70px_rgba(234,56,56,0.18)] flex overflow-hidden relative">
        {/* Left Navigation Dock */}
        <NavigationDock
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenQuickUpload={() => setIsQuickUploadOpen(true)}
          onOpenVocalModels={() => setIsVocalModelsOpen(true)}
        />

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header Bar */}
          <HeaderBar
            userName={userName}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenExportsModal={() => setActiveTab('publish')}
            onOpenVocalModels={() => setIsVocalModelsOpen(true)}
            onOpenProfileModal={() => {
              const name = prompt('Enter your producer/artist name:', userName);
              if (name && name.trim()) setUserName(name.trim());
            }}
          />

          {/* Active View Switcher */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'dashboard' && (
              <DashboardView
                currentTrack={currentTrack}
                onSelectTrack={setCurrentTrack}
                activePreset={activePreset}
                onSelectPreset={setActivePreset}
                onNavigateTab={setActiveTab}
                onOpenMakeItAVibe={() => setActiveTab('vibe')}
              />
            )}

            {activeTab === 'studio' && (
              <StudioEngineView
                currentTrack={currentTrack}
                onUpdateTrack={setCurrentTrack}
                activePreset={activePreset}
                onUpdatePreset={setActivePreset}
                onOpenMakeItAVibe={() => setActiveTab('vibe')}
                onOpenVocalModels={() => setIsVocalModelsOpen(true)}
                activeVocalModel={activeVocalModel}
              />
            )}

            {activeTab === 'vibe' && (
              <MakeItAVibeView
                currentTrack={currentTrack}
                activePreset={activePreset}
                onApplyPreset={(p) => {
                  setActivePreset(p);
                  globalAudioEngine.setTransformation(p);
                }}
              />
            )}

            {activeTab === 'visuals' && (
              <VisualizerStudioView
                currentTrack={currentTrack}
                activePreset={activePreset}
              />
            )}

            {activeTab === 'trends' && (
              <TrendDiscoveryView
                onSelectPreset={(p) => {
                  setActivePreset(p);
                  globalAudioEngine.setTransformation(p);
                  setActiveTab('studio');
                }}
                onOpenMakeItAVibe={() => setActiveTab('vibe')}
              />
            )}

            {activeTab === 'rights' && (
              <RightsCenterView currentTrack={currentTrack} />
            )}

            {activeTab === 'publish' && (
              <PublishingView
                currentTrack={currentTrack}
                activePreset={activePreset}
              />
            )}
          </main>
        </div>

        {/* Right Collaborators Studio Rail */}
        <CollaboratorsRail
          collaborators={COMMUNITY_CREATORS}
          onSelectCollaborator={(c) => {
            if (c.currentTrack) {
              setActiveTab('studio');
            }
          }}
        />
      </div>

      {/* Quick Upload Modal */}
      <QuickUploadModal
        isOpen={isQuickUploadOpen}
        onClose={() => setIsQuickUploadOpen(false)}
        onSelectTrack={(track) => {
          setCurrentTrack(track);
          setActiveTab('studio');
        }}
      />

      {/* 100+ Vocal Models Hub Modal */}
      <VocalModelsModal
        isOpen={isVocalModelsOpen}
        onClose={() => setIsVocalModelsOpen(false)}
        onSelectVocalModel={handleSelectVocalModel}
        onInspectChain={(model) => setInspectedVocalModel(model)}
        currentActiveModelId={activeVocalModel?.id}
      />

      {/* Hardware Chain Inspector Modal */}
      <VocalChainInspectorModal
        model={inspectedVocalModel}
        isOpen={Boolean(inspectedVocalModel)}
        onClose={() => setInspectedVocalModel(null)}
        onApplyModel={handleSelectVocalModel}
      />
    </div>
  );
}
