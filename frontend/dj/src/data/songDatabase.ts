export interface SongData {
  title: string;
  artist: string;
}

export interface GenreData {
  [genre: string]: SongData[];
}

export const SONG_DATABASE: GenreData = {
  'Pop': [
    { title: 'Uptown Funk', artist: 'Bruno Mars' },
    { title: 'Shape of You', artist: 'Ed Sheeran' },
    { title: 'Blinding Lights', artist: 'The Weeknd' },
    { title: 'Levitating', artist: 'Dua Lipa' },
    { title: 'Anti-Hero', artist: 'Taylor Swift' },
    { title: 'As It Was', artist: 'Harry Styles' },
  ],
  'Rock': [
    { title: 'Bohemian Rhapsody', artist: 'Queen' },
    { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
    { title: 'Hotel California', artist: 'Eagles' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    { title: 'Wonderwall', artist: 'Oasis' },
  ],
  'Electronic': [
    { title: 'Get Lucky', artist: 'Daft Punk' },
    { title: 'Titanium', artist: 'David Guetta ft. Sia' },
    { title: 'Wake Me Up', artist: 'Avicii' },
    { title: 'Strobe', artist: 'Deadmau5' },
    { title: 'Clarity', artist: 'Zedd' },
    { title: 'Animals', artist: 'Martin Garrix' },
  ],
  'Hip Hop': [
    { title: 'Sicko Mode', artist: 'Travis Scott' },
    { title: 'God\'s Plan', artist: 'Drake' },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
    { title: 'In Da Club', artist: '50 Cent' },
    { title: 'Lose Yourself', artist: 'Eminem' },
    { title: 'Old Town Road', artist: 'Lil Nas X' },
  ],
  'Funk': [
    { title: 'Superstition', artist: 'Stevie Wonder' },
    { title: 'September', artist: 'Earth, Wind & Fire' },
    { title: 'Le Freak', artist: 'Chic' },
    { title: 'Play That Funky Music', artist: 'Wild Cherry' },
    { title: 'Give Up the Funk', artist: 'Parliament' },
    { title: 'Brick House', artist: 'Commodores' },
  ],
  'Jazz': [
    { title: 'Take Five', artist: 'Dave Brubeck' },
    { title: 'So What', artist: 'Miles Davis' },
    { title: 'My Favorite Things', artist: 'John Coltrane' },
    { title: 'Sing Sing Sing', artist: 'Benny Goodman' },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra' },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
  ],
  'Latin': [
    { title: 'Smooth', artist: 'Santana ft. Rob Thomas' },
    { title: 'Despacito', artist: 'Luis Fonsi' },
    { title: 'La Bamba', artist: 'Ritchie Valens' },
    { title: 'Bailando', artist: 'Enrique Iglesias' },
    { title: 'Hips Don\'t Lie', artist: 'Shakira' },
    { title: 'Danza Kuduro', artist: 'Don Omar' },
  ],
  'R&B': [
    { title: 'Redbone', artist: 'Childish Gambino' },
    { title: 'Crazy in Love', artist: 'Beyoncé' },
    { title: 'No Scrubs', artist: 'TLC' },
    { title: 'Kiss Kiss', artist: 'Chris Brown' },
    { title: 'Yeah!', artist: 'Usher' },
    { title: 'Ignition (Remix)', artist: 'R. Kelly' },
  ],
};

export const GENRES = Object.keys(SONG_DATABASE);
