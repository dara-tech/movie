import { Metadata } from 'next';

// Force dynamic rendering for this route to enable SSR
export const dynamic = 'force-dynamic';

// Use environment variables for API URL
// Default to production API for SSR metadata generation
const API_URL = process.env.NEXT_PUBLIC_API_URL 
  || (process.env.NODE_ENV === 'production' 
    ? 'https://movie-7zq4.onrender.com' 
    : 'http://localhost:5001');
    
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.NODE_ENV === 'production'
    ? 'https://streammoviehdfree.netlify.app'
    : 'http://localhost:3001');

interface Movie {
  _id: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath?: string;
  backdropPath?: string;
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  genres: Array<{ name: string }>;
  originalLanguage: string;
  originalTitle: string;
  adult: boolean;
  popularity: number;
  video: boolean;
  streamingUrl?: string;
  vidsrcUrl?: string;
  isAvailable: boolean;
}

async function fetchMovie(id: string): Promise<Movie | null> {
  try {
    const response = await fetch(`${API_URL}/api/movies/${id}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const movie = await fetchMovie(id);

  if (!movie) {
    return {
      title: 'Movie Not Found | MovieStream',
      description: 'Movie not found',
    };
  }

  const title = `${movie.title} (${new Date(movie.releaseDate).getFullYear()})`;
  const description = movie.overview || `Watch ${movie.title} - A ${movie.genres.map(g => g.name).join(', ')} movie`;
  const image = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : movie.posterPath
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : `${SITE_URL}/placeholder-movie.jpg`;

  const url = `${SITE_URL}/movie/${movie._id}`;
  const year = new Date(movie.releaseDate).getFullYear();
  const genres = movie.genres.map(g => g.name).join(', ');

  return {
    title: `${title} | MovieStream`,
    description: description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: 'MovieStream',
      images: [
        {
          url: image,
          width: 1280,
          height: 720,
          alt: `${movie.title} poster`,
        },
      ],
      locale: 'en_US',
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@MovieStream',
      title: title,
      description: description,
      images: [
        {
          url: image,
          alt: `${movie.title} poster`,
        },
      ],
    },
  };
}

export default function MovieLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
