import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, FolderHeart, Music, RotateCcw, Lock, Gift } from 'lucide-react';
import { ParticlesBackground } from './components/ParticlesBackground';
import { LandingPage } from './components/LandingPage';
import { StepName } from './components/Wizard/StepName';
import { StepRelationship } from './components/Wizard/StepRelationship';
import { StepSubRelationship } from './components/Wizard/StepSubRelationship';
import { StepPhotoUpload } from './components/Wizard/StepPhotoUpload';
import { StepMessageAndMood } from './components/Wizard/StepMessageAndMood';
import { CinematicCanvasRenderer } from './components/VideoPlayer/CinematicCanvasRenderer';
import { AdminSongLibraryModal } from './components/Modals/AdminSongLibraryModal';
import { SavedWishesModal } from './components/Modals/SavedWishesModal';

// Step-by-Step Interactive Gift Reference Flow Components
import { PasscodeLock } from './components/InteractiveGift/PasscodeLock';
import { WelcomeCard } from './components/InteractiveGift/WelcomeCard';
import { BlowCandlesCake } from './components/InteractiveGift/BlowCandlesCake';
import { BalloonPopGame } from './components/InteractiveGift/BalloonPopGame';
import { OpenGiftPrompt } from './components/InteractiveGift/OpenGiftPrompt';
import { InteractiveGiftBox } from './components/InteractiveGift/InteractiveGiftBox';
import { LotsOfLoveEnding } from './components/InteractiveGift/LotsOfLoveEnding';

import {
  BirthdayWishData,
  RelationshipId,
  SubRelationshipId,
  MoodType,
  PhotoItem,
  SongTrack
} from './types/birthday';
import { RELATIONSHIPS, INITIAL_SONG_LIBRARY } from './data/relationshipData';
import { generateBirthdayMessage } from './services/aiMessageGenerator';
import { smartSongEngine } from './services/smartSongEngine';

type AppView =
  | 'landing'
  | 'wizard_step1'
  | 'wizard_step2'
  | 'wizard_step3'
  | 'wizard_step4'
  | 'wizard_step5'
  | 'interactive_passcode'
  | 'interactive_welcome'
  | 'interactive_cake'
  | 'interactive_balloons'
  | 'interactive_open_gift'
  | 'interactive_gifts'
  | 'interactive_ending'
  | 'preview';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAdminSongModalOpen, setIsAdminSongModalOpen] = useState(false);
  const [isSavedWishesModalOpen, setIsSavedWishesModalOpen] = useState(false);
  const [savedWishes, setSavedWishes] = useState<BirthdayWishData[]>([]);

  // Generator State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipId>('best_friend');
  const [subRelationship, setSubRelationship] = useState<SubRelationshipId | undefined>('best_friend_boy');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [mood, setMood] = useState<MoodType>('friendship');
  const [customMessage, setCustomMessage] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [selectedSongTrack, setSelectedSongTrack] = useState<SongTrack>(INITIAL_SONG_LIBRARY[0]);

  // Load saved wishes on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bm_saved_wishes');
      if (stored) {
        setSavedWishes(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load saved wishes:', e);
    }
  }, []);

  // Audio standby handling
  useEffect(() => {
    if (['landing', 'wizard_step1', 'wizard_step2', 'wizard_step3', 'wizard_step4', 'wizard_step5', 'interactive_passcode'].includes(currentView)) {
      smartSongEngine.stop();
    }
  }, [currentView]);

  const updateAiMessage = (rel: RelationshipId, sub?: SubRelationshipId, m: MoodType = mood, pName: string = name) => {
    const msg = generateBirthdayMessage({
      name: pName,
      relationship: rel,
      subRelationship: sub,
      mood: m
    });
    setAiMessage(msg);
  };

  const handleAddPhotos = (files: FileList) => {
    const newPhotos: PhotoItem[] = Array.from(files).map((file, idx) => ({
      id: `photo_${Date.now()}_${idx}`,
      url: URL.createObjectURL(file),
      isMain: photos.length === 0 && idx === 0
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
  };

  const handleSetMainPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isMain: p.id === id
      }))
    );
  };

  const handleUnlockPasscode = () => {
    const theme = selectedSongTrack.subRelationship || 'partner_love';
    smartSongEngine.playTrack(theme, selectedSongTrack.audioUrl);
    setCurrentView('interactive_welcome');
  };

  const handleSelectRelationship = (relId: RelationshipId) => {
    setRelationship(relId);
    const relConfig = RELATIONSHIPS[relId];
    if (relConfig && relConfig.subTypes.length > 0) {
      const defaultSub = relConfig.subTypes[0];
      setSubRelationship(defaultSub.id);
      const song = INITIAL_SONG_LIBRARY.find((s) => s.subRelationship === defaultSub.id) || INITIAL_SONG_LIBRARY[0];
      setSelectedSongTrack(song);
      updateAiMessage(relId, defaultSub.id, mood, name);
      setCurrentView('wizard_step3');
    } else {
      setSubRelationship(undefined);
      updateAiMessage(relId, undefined, mood, name);
      setCurrentView('wizard_step4');
    }
  };

  const handleSelectSubRelationship = (subId: SubRelationshipId) => {
    setSubRelationship(subId);
    const song = INITIAL_SONG_LIBRARY.find((s) => s.subRelationship === subId) || INITIAL_SONG_LIBRARY[0];
    setSelectedSongTrack(song);
    updateAiMessage(relationship, subId, mood, name);
    setCurrentView('wizard_step4');
  };

  const wishData: BirthdayWishData = {
    id: `wish_${Date.now()}`,
    name: name.trim() || 'Birthday Star',
    relationship,
    subRelationship,
    photos: photos.length > 0 ? photos : [
      {
        id: 'fallback_1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        isMain: true
      }
    ],
    customMessage,
    aiGeneratedMessage: aiMessage || generateBirthdayMessage({ name, relationship, subRelationship, mood }),
    mood,
    songTrack: selectedSongTrack,
    createdAt: new Date().toISOString()
  };

  const handleSaveWish = () => {
    const updated = [wishData, ...savedWishes.filter((w) => w.id !== wishData.id)];
    setSavedWishes(updated);
    try {
      localStorage.setItem('bm_saved_wishes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleDeleteSavedWish = (id: string) => {
    const updated = savedWishes.filter((w) => w.id !== id);
    setSavedWishes(updated);
    try {
      localStorage.setItem('bm_saved_wishes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update localStorage:', e);
    }
  };

  return (
    <div className="min-h-screen text-white relative font-sans">
      <ParticlesBackground particleStyle={RELATIONSHIPS[relationship]?.particleStyle || 'stars'} />

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
          >
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white font-black text-lg shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform">
              🎂
            </div>
            <div className="text-left">
              <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
                BIRTHDAY MAGIC
              </span>
              <span className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase block">
                Interactive Birthday Experience
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminSongModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            >
              <Music className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Song Library</span>
            </button>

            <button
              onClick={() => setIsSavedWishesModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 backdrop-blur-md transition-all cursor-pointer"
            >
              <FolderHeart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Saved Wishes ({savedWishes.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience Screen */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {currentView === 'landing' && (
          <LandingPage
            onCreateWish={() => setCurrentView('wizard_step1')}
          />
        )}

        {currentView === 'wizard_step1' && (
          <StepName
            name={name}
            onChangeName={(val) => {
              setName(val);
              updateAiMessage(relationship, subRelationship, mood, val);
            }}
            onNext={() => setCurrentView('wizard_step2')}
          />
        )}

        {currentView === 'wizard_step2' && (
          <StepRelationship
            selectedRelationship={relationship}
            onSelect={handleSelectRelationship}
            onBack={() => setCurrentView('wizard_step1')}
          />
        )}

        {currentView === 'wizard_step3' && (
          <StepSubRelationship
            relationshipId={relationship}
            selectedSub={subRelationship || null}
            onSelectSub={handleSelectSubRelationship}
            onBack={() => setCurrentView('wizard_step2')}
          />
        )}

        {currentView === 'wizard_step4' && (
          <StepPhotoUpload
            photos={photos}
            onAddPhotos={handleAddPhotos}
            onRemovePhoto={handleRemovePhoto}
            onSetMainPhoto={handleSetMainPhoto}
            onNext={() => setCurrentView('wizard_step5')}
            onBack={() => setCurrentView(RELATIONSHIPS[relationship]?.subTypes.length ? 'wizard_step3' : 'wizard_step2')}
          />
        )}

        {currentView === 'wizard_step5' && (
          <StepMessageAndMood
            name={name}
            relationship={relationship}
            subRelationship={subRelationship}
            mood={mood}
            message={customMessage || aiMessage}
            onChangeMood={setMood}
            onChangeMessage={setCustomMessage}
            onGenerateVideo={() => {
              handleSaveWish();
              setCurrentView('interactive_passcode');
            }}
            onBack={() => setCurrentView('wizard_step4')}
          />
        )}

        {/* Reference Video Step-by-Step Sequence */}
        {currentView === 'interactive_passcode' && (
          <PasscodeLock
            personName={name}
            onUnlock={handleUnlockPasscode}
          />
        )}

        {currentView === 'interactive_welcome' && (
          <WelcomeCard
            personName={name}
            relationshipTitle={RELATIONSHIPS[relationship]?.title || 'Special Bond'}
            photos={photos}
            onNext={() => setCurrentView('interactive_cake')}
          />
        )}

        {currentView === 'interactive_cake' && (
          <BlowCandlesCake
            personName={name}
            onNext={() => setCurrentView('interactive_balloons')}
          />
        )}

        {currentView === 'interactive_balloons' && (
          <BalloonPopGame
            personName={name}
            onNext={() => setCurrentView('interactive_open_gift')}
          />
        )}

        {currentView === 'interactive_open_gift' && (
          <OpenGiftPrompt
            personName={name}
            onYes={() => setCurrentView('interactive_gifts')}
            onNo={() => setCurrentView('interactive_gifts')}
          />
        )}

        {currentView === 'interactive_gifts' && (
          <InteractiveGiftBox
            wishData={wishData}
            onOpenVideoReel={() => setCurrentView('preview')}
            onFinishAllGifts={() => setCurrentView('interactive_ending')}
          />
        )}

        {currentView === 'interactive_ending' && (
          <LotsOfLoveEnding
            personName={name}
            onRestart={() => setCurrentView('interactive_passcode')}
            onOpenVideoReel={() => setCurrentView('preview')}
          />
        )}

        {currentView === 'preview' && (
          <CinematicCanvasRenderer
            wishData={wishData}
            onEdit={() => setCurrentView('wizard_step1')}
            onOpenAdminSongModal={() => setIsAdminSongModalOpen(true)}
            onSaveWish={handleSaveWish}
          />
        )}
      </main>

      <AdminSongLibraryModal
        isOpen={isAdminSongModalOpen}
        currentTrack={selectedSongTrack}
        onSelectTrack={(t) => {
          setSelectedSongTrack(t);
          setIsAdminSongModalOpen(false);
        }}
        onClose={() => setIsAdminSongModalOpen(false)}
      />

      <SavedWishesModal
        isOpen={isSavedWishesModalOpen}
        savedWishes={savedWishes}
        onSelectWish={(w) => {
          setName(w.name);
          setRelationship(w.relationship);
          setSubRelationship(w.subRelationship);
          setPhotos(w.photos);
          setCustomMessage(w.customMessage);
          setAiMessage(w.aiGeneratedMessage);
          setMood(w.mood);
          setSelectedSongTrack(w.songTrack);
          setCurrentView('interactive_passcode');
        }}
        onDeleteWish={handleDeleteSavedWish}
        onClose={() => setIsSavedWishesModalOpen(false)}
      />
    </div>
  );
}
