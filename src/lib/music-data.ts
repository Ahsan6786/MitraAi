
export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  url: string;
}

export const musicTracks: MusicTrack[] = [
  {
    id: 1,
    title: 'Peaceful Meditation',
    artist: 'Serenity Studio',
    url: 'https://storage.googleapis.com/stunning-videos/bs-prod/b3297ed2-965a-4712-87a1-2b23c28581e1/musics/ Peaceful%20Meditation.mp3',
  },
  {
    id: 2,
    title: 'Gentle Waves',
    artist: 'Nature Sounds',
    url: 'https://storage.googleapis.com/stunning-videos/bs-prod/b3297ed2-965a-4712-87a1-2b23c28581e1/musics/Sounds%20of%20Nature.mp3',
  },
  {
    id: 3,
    title: 'Morning Birds',
    artist: 'Nature Sounds',
    url: 'https://storage.googleapis.com/stunning-videos/bs-prod/b3297ed2-965a-4712-87a1-2b23c28581e1/musics/Chirping%20Birds.mp3',
  },
  {
    id: 4,
    title: 'Soft Piano',
    artist: 'Relaxing Melodies',
    url: 'https://storage.googleapis.com/stunning-videos/bs-prod/b3297ed2-965a-4712-87a1-2b23c28581e1/musics/Inspirational%20Piano.mp3',
  },
  {
    id: 5,
    title: 'Calm Forest',
    artist: 'Ambient Scapes',
    url: 'https://storage.googleapis.com/stunning-videos/bs-prod/b3297ed2-965a-4712-87a1-2b23c28581e1/musics/Forest%20Ambience.mp3',
  },
];
