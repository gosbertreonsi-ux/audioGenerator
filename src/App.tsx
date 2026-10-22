/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { VizmotionAIEditor } from './components/views/VizmotionAIEditor';
import { DualSongSyncView } from './components/views/DualSongSyncView';
import { MiziziUtilitiesView } from './components/views/MiziziUtilitiesView';
import { LyricSyncStudioView } from './components/views/LyricSyncStudioView';
import { QuickUploadModal } from './components/QuickUploadModal';
import { VocalModelsModal } from './components/VocalModelsModal';
import { VocalChainInspectorModal } from './components/VocalChainInspectorModal';
import { InstrumentalSwapperModal } from './components/InstrumentalSwapperModal';
import { BeatMakerStudioModal } from './components/BeatMakerStudioModal';
import { DEFAULT_UNLOADED_TRACK, PRESET_STYLES, COMMUNITY_CREATORS } from './lib/constants';
import { AudioTrack, TransformationPreset, VocalModel } from './types';
import { globalAudioEngine } from './lib/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('utilities');
  const [language, setLanguage] = useState<'EN' | 'SW'>('EN');
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(DEFAULT_UNLOADED_TRACK);
  const [activePreset, setActivePreset] = useState<TransformationPreset>(PRESET_STYLES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [isVocalModelsOpen, setIsVocalModelsOpen] = useState(false);
  const [isInstrumentalSwapperOpen, setIsInstrumentalSwapperOpen] = useState(false);
  const [isBeatMakerOpen, setIsBeatMakerOpen] = useState(false);
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

  return (
    <div className="h-screen w-full bg-[#0a0304] flex items-center justify-center p-0 font-sans text-[#f4e8e8] overflow-hidden">
      {/* Outer Console Container */}
      <div className="w-full h-full bg-[#140708] border-0 flex overflow-hidden relative">
        {/* Left Navigation Dock */}
        <NavigationDock
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenQuickUpload={() => setIsQuickUploadOpen(true)}
          onOpenVocalModels={() => setIsVocalModelsOpen(true)}
          onOpenInstrumentalSwapper={() => setIsInstrumentalSwapperOpen(true)}
          onOpenBeatMaker={() => setIsBeatMakerOpen(true)}
        />

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header Bar - Shown across tabs for unified identity */}
          <HeaderBar
            userName={userName}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenExportsModal={() => setActiveTab('publish')}
            onOpenVocalModels={() => setIsVocalModelsOpen(true)}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'EN' ? 'SW' : 'EN'))}
            onOpenProfileModal={() => {
              const name = prompt('Enter your producer/artist name:', userName);
              if (name && name.trim()) setUserName(name.trim());
            }}
          />

          {/* Active View Switcher */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* VERSION A: MIZIZI UTILITIES (123apps style single purpose tools) */}
            {activeTab === 'utilities' && (
              <MiziziUtilitiesView
                onSendToStudio={(track) => {
                  setCurrentTrack(track);
                  setActiveTab('studio');
                }}
                onOpenCreativeStudio={(tabId) => setActiveTab((tabId as NavTab) || 'vizmotion')}
              />
            )}

            {/* VERSION B: MIZIZI CREATIVE STUDIO - LYRIC & MUSIC ALIGNMENT STUDIO */}
            {activeTab === 'lyricsync' && (
              <LyricSyncStudioView
                currentTrack={currentTrack}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
              />
            )}

            {/* VERSION B: MIZIZI CREATIVE STUDIO - VIZMOTION MULTITRACK VIDEO NLE */}
            {activeTab === 'vizmotion' && (
              <VizmotionAIEditor
                currentTrack={currentTrack}
                onUpdateTrack={setCurrentTrack}
                activePreset={activePreset}
                onOpenInstrumentalSwapper={() => setIsInstrumentalSwapperOpen(true)}
                onOpenBeatMaker={() => setIsBeatMakerOpen(true)}
                onOpenVocalModels={() => setIsVocalModelsOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                currentTrack={currentTrack}
                onSelectTrack={setCurrentTrack}
                activePreset={activePreset}
                onSelectPreset={setActivePreset}
                onNavigateTab={setActiveTab}
                onOpenMakeItAVibe={() => setActiveTab('vibe')}
                onOpenQuickUpload={() => setIsQuickUploadOpen(true)}
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
                onOpenVideoStudio={() => setActiveTab('vizmotion')}
                onOpenInstrumentalSwapper={() => setIsInstrumentalSwapperOpen(true)}
                onOpenBeatMaker={() => setIsBeatMakerOpen(true)}
                onOpenDualSync={() => setActiveTab('dualsync')}
                activeVocalModel={activeVocalModel}
              />
            )}

            {activeTab === 'dualsync' && (
              <DualSongSyncView
                currentTrack={currentTrack}
                onOpenQuickUpload={() => setIsQuickUploadOpen(true)}
                onOpenStudio={() => setActiveTab('studio')}
                onSendToStudio={(track) => {
                  setCurrentTrack(track);
                  setActiveTab('studio');
                }}
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
                onSelectTrack={setCurrentTrack}
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

        {/* Right Collaborators Studio Rail - Shown on dashboard/studio */}
        {(activeTab === 'dashboard' || activeTab === 'studio') && (
          <CollaboratorsRail
            collaborators={COMMUNITY_CREATORS}
            onSelectCollaborator={(c) => {
              if (c.currentTrack) {
                setActiveTab('studio');
              }
            }}
          />
        )}
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
      />

      {/* Vocal Chain Inspector Modal */}
      <VocalChainInspectorModal
        model={inspectedVocalModel}
        isOpen={!!inspectedVocalModel}
        onClose={() => setInspectedVocalModel(null)}
        onApplyModel={(model) => {
          handleSelectVocalModel(model);
          setInspectedVocalModel(null);
        }}
      />

      {/* Afrobeat Remixer & Instrumental Swapper Modal */}
      <InstrumentalSwapperModal
        isOpen={isInstrumentalSwapperOpen}
        onClose={() => setIsInstrumentalSwapperOpen(false)}
        currentTrack={currentTrack}
        onSelectTrack={setCurrentTrack}
        onApplyPreset={(p) => {
          setActivePreset(p);
          globalAudioEngine.setTransformation(p);
        }}
        onOpenVideoStudio={() => setActiveTab('vizmotion')}
      />

      {/* African Beat Maker & Drum Machine Studio Modal */}
      <BeatMakerStudioModal
        isOpen={isBeatMakerOpen}
        onClose={() => setIsBeatMakerOpen(false)}
        onSendBeatToEngine={() => setActiveTab('studio')}
      />
    </div>
  );
}
